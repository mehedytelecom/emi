import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  AppSettings,
  AppUser,
  Customer,
  DEFAULT_SETTINGS,
  EmiAccount,
  Installment,
  NotificationItem,
  Payment,
  PaymentMethod,
  UserRole,
} from '../types';
import {
  evaluateEmiInstallments,
  generateInstallmentSchedule,
} from '../utils/dateAndEmiUtils';
import { generateInstallmentAlerts, sendLocalPushNotification } from '../services/notificationService';

// Helpers to strip redundant customer fields before writing to Firestore
function cleanInstallmentForDb(inst: Installment): Record<string, any> {
  const { customerName, customerMobile, ...rest } = inst;
  const clean: Record<string, any> = {};
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  return clean;
}

function cleanEmiForDb(emi: EmiAccount): Record<string, any> {
  const { customerName, customerMobile, ...rest } = emi;
  const clean: Record<string, any> = {};
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  return clean;
}

function cleanPaymentForDb(pay: Payment): Record<string, any> {
  const { customerName, ...rest } = pay;
  const clean: Record<string, any> = {};
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined) clean[k] = v;
  });
  return clean;
}

interface DataContextType {
  customers: Customer[];
  emiAccounts: EmiAccount[];
  installments: Installment[];
  payments: Payment[];
  notifications: NotificationItem[];
  users: AppUser[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;

  // Actions (Admin only)
  addCustomer: (data: Omit<Customer, 'customerId' | 'createdAt' | 'updatedAt' | 'totalEmiAmount' | 'paidAmount' | 'remainingAmount' | 'activeEmiCount'>) => Promise<string>;
  updateCustomer: (customerId: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  createEmiAccount: (data: {
    customerId?: string;
    customerName: string;
    customerMobile: string;
    guarantorName?: string;
    guarantorMobile?: string;
    imeiNumber?: string;
    customerAddress?: string;
    productName: string;
    productPrice: number;
    downPayment: number;
    interestRate?: number;
    interestAmount?: number;
    totalEmiMonths: number;
    monthlyEmiAmount: number;
    firstDueDate: string;
    paymentFrequency: 'MONTHLY';
    notes?: string;
  }) => Promise<string>;
  recordPayment: (data: {
    installmentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    transactionId?: string;
    notes?: string;
  }) => Promise<void>;
  updateInstallmentDueDate: (installmentId: string, newDueDate: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  approveUser: (uid: string, role: UserRole) => Promise<void>;
  rejectUser: (uid: string) => Promise<void>;
  disableUser: (uid: string) => Promise<void>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  triggerEmiEvaluation: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isApproved, isAdmin, currentUser } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('read_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // 1. Subscribe ONLY to customers collection, settings, and users
  // Single-collection architecture embeds EMI accounts, installments, and payments
  // directly in customers, saving >90% Firestore read/write quota.
  useEffect(() => {
    if (!isApproved) {
      setCustomers([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Settings listener (single document)
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'app_settings'),
      async (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as AppSettings);
        } else if (isAdmin) {
          try {
            await setDoc(doc(db, 'settings', 'app_settings'), DEFAULT_SETTINGS);
          } catch (err) {
            console.warn('Could not auto-seed settings:', err);
          }
        }
      },
      (err) => {
        console.error('Settings listener error:', err);
      }
    );

    // Customers listener (single collection for all customer, EMI, and installment data)
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snap) => {
        const list: Customer[] = [];
        snap.forEach((docSnap) => {
          const cust = docSnap.data() as Customer;
          list.push(cust);
        });

        setCustomers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Customers listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubSettings();
      unsubCustomers();
    };
  }, [isApproved, isAdmin]);

  // 2. Subscribe to users collection (Admin only)
  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      return;
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: AppUser[] = [];
        snap.forEach((docSnap) => list.push(docSnap.data() as AppUser));
        setUsers(list);
      },
      (err) => {
        console.warn('Users listener error:', err.message);
      }
    );

    return () => unsubUsers();
  }, [isAdmin]);

  // Derive consolidated EMI accounts, Installments, and Payments from Customers
  // Directly attach customerName & customerMobile in memory for seamless front-end consumption
  const emiAccounts = useMemo(() => {
    const list: EmiAccount[] = [];
    customers.forEach((c) => {
      if (c.emiAccounts && Array.isArray(c.emiAccounts)) {
        c.emiAccounts.forEach((emi) => {
          list.push({
            ...emi,
            customerName: c.name,
            customerMobile: c.mobileNumber,
            customerId: c.customerId,
          });
        });
      }
    });
    return list;
  }, [customers]);

  const installments = useMemo(() => {
    const list: Installment[] = [];
    customers.forEach((c) => {
      if (c.installments && Array.isArray(c.installments)) {
        c.installments.forEach((inst) => {
          list.push({
            ...inst,
            customerName: c.name,
            customerMobile: c.mobileNumber,
            customerId: c.customerId,
          });
        });
      }
    });
    return list;
  }, [customers]);

  const payments = useMemo(() => {
    const list: Payment[] = [];
    customers.forEach((c) => {
      if (c.payments && Array.isArray(c.payments)) {
        c.payments.forEach((pay) => {
          list.push({
            ...pay,
            customerName: c.name,
            customerId: c.customerId,
          });
        });
      }
    });
    return list.sort((a, b) => (b?.createdAt || '').localeCompare(a?.createdAt || ''));
  }, [customers]);

  // Notifications dynamically calculated in-memory from installments & settings
  // Avoids continuous database writes and reads for notifications
  const notifications = useMemo(() => {
    const alerts = generateInstallmentAlerts(installments, settings);
    const all = [
      ...alerts.dueTodayAlerts.map((a) => ({
        notificationId: `notif_${a.item.installmentId}_due`,
        title: a.title,
        body: a.body,
        type: 'DUE_TODAY' as const,
        targetCustomerId: a.item.customerId,
        targetInstallmentId: a.item.installmentId,
        targetEmiId: a.item.emiId,
        dueDate: a.item.dueDate,
        amount: a.item.totalPayable,
        status: readNotifications.has(`notif_${a.item.installmentId}_due`)
          ? ('READ' as const)
          : ('UNREAD' as const),
        createdAt: new Date().toISOString(),
      })),
      ...alerts.dueTomorrowAlerts.map((a) => ({
        notificationId: `notif_${a.item.installmentId}_rem`,
        title: a.title,
        body: a.body,
        type: 'REMINDER_BEFORE' as const,
        targetCustomerId: a.item.customerId,
        targetInstallmentId: a.item.installmentId,
        targetEmiId: a.item.emiId,
        dueDate: a.item.dueDate,
        amount: a.item.totalPayable,
        status: readNotifications.has(`notif_${a.item.installmentId}_rem`)
          ? ('READ' as const)
          : ('UNREAD' as const),
        createdAt: new Date().toISOString(),
      })),
      ...alerts.overdueAlerts.map((a) => ({
        notificationId: `notif_${a.item.installmentId}_ovd`,
        title: a.title,
        body: a.body,
        type: 'OVERDUE' as const,
        targetCustomerId: a.item.customerId,
        targetInstallmentId: a.item.installmentId,
        targetEmiId: a.item.emiId,
        dueDate: a.item.dueDate,
        amount: a.item.totalPayable,
        status: readNotifications.has(`notif_${a.item.installmentId}_ovd`)
          ? ('READ' as const)
          : ('UNREAD' as const),
        createdAt: new Date().toISOString(),
      })),
    ];
    return all;
  }, [installments, settings, readNotifications]);

  // 3. Automatic in-memory overdue, late fine & 2% post-plan evaluation
  const triggerEmiEvaluation = async () => {
    if (!isAdmin || customers.length === 0) return;

    try {
      for (const customer of customers) {
        if (customer.status === 'ARCHIVED') continue;
        const emis = customer.emiAccounts || [];
        const insts = customer.installments || [];
        if (emis.length === 0 || insts.length === 0) continue;

        let customerHasChanges = false;
        let workingInsts = [...insts];
        let workingEmis = [...emis];

        for (let eIdx = 0; eIdx < workingEmis.length; eIdx++) {
          const emi = workingEmis[eIdx];
          if (emi.status === 'COMPLETED') continue;

          const emiInsts = workingInsts.filter((i) => i.emiId === emi.emiId);
          if (emiInsts.length === 0) continue;

          const evalResult = evaluateEmiInstallments(emiInsts, settings, emi);
          if (evalResult.hasChanges) {
            customerHasChanges = true;
            workingInsts = workingInsts.map((i) => {
              const found = evalResult.updatedInstallments.find(
                (u) => u.installmentId === i.installmentId
              );
              return found ? (cleanInstallmentForDb(found) as Installment) : i;
            });

            const newTotalFines = emi.totalFines + evalResult.newFinesAdded;
            const newTotalPostPlan = emi.totalPostPlanCharges + evalResult.newPostPlanChargesAdded;
            const newRemaining = evalResult.updatedInstallments.reduce(
              (sum, item) => sum + item.remainingAmount,
              0
            );

            workingEmis[eIdx] = cleanEmiForDb({
              ...emi,
              totalFines: newTotalFines,
              totalPostPlanCharges: newTotalPostPlan,
              remainingAmount: newRemaining,
              lastChargedMonth: evalResult.newLastChargedMonth,
              updatedAt: new Date().toISOString(),
            }) as EmiAccount;
          }
        }

        if (customerHasChanges) {
          const totalRemaining = workingInsts.reduce((sum, i) => sum + i.remainingAmount, 0);
          await updateDoc(doc(db, 'customers', customer.customerId), {
            emiAccounts: workingEmis,
            installments: workingInsts,
            remainingAmount: totalRemaining,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Notification Alerts Check
      const allInsts = customers.flatMap((c) => c.installments || []);
      const alerts = generateInstallmentAlerts(allInsts, settings);
      const allAlerts = [
        ...alerts.dueTodayAlerts,
        ...alerts.dueTomorrowAlerts,
        ...alerts.overdueAlerts,
      ];

      if (
        allAlerts.length > 0 &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const topAlert = allAlerts[0];
        sendLocalPushNotification(topAlert.title, topAlert.body, {
          installmentId: topAlert.item.installmentId,
        });
      }
    } catch (err) {
      console.warn('EMI evaluation notice:', err);
    }
  };

  // Run evaluation with debounce
  useEffect(() => {
    if (!isAdmin || customers.length === 0) return;
    const timer = setTimeout(() => {
      triggerEmiEvaluation();
    }, 2000);
    return () => clearTimeout(timer);
  }, [customers.length, settings.gracePeriodDays, settings.lateFineAmount, settings.postPlanPercentage]);

  // Actions
  const addCustomer = async (
    data: Omit<
      Customer,
      | 'customerId'
      | 'createdAt'
      | 'updatedAt'
      | 'totalEmiAmount'
      | 'paidAmount'
      | 'remainingAmount'
      | 'activeEmiCount'
    >
  ): Promise<string> => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot add customers.');
    const customerId = `cust_${Date.now()}`;
    const newCustomer: Customer = {
      ...data,
      customerId,
      totalEmiAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      activeEmiCount: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emiAccounts: [],
      installments: [],
      payments: [],
    };

    try {
      await setDoc(doc(db, 'customers', customerId), newCustomer);
      return customerId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `customers/${customerId}`);
      return '';
    }
  };

  const updateCustomer = async (customerId: string, data: Partial<Customer>) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot edit customers.');
    try {
      await updateDoc(doc(db, 'customers', customerId), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${customerId}`);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot delete customers.');
    try {
      await updateDoc(doc(db, 'customers', customerId), {
        status: 'ARCHIVED',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${customerId}`);
    }
  };

  const createEmiAccount = async (data: {
    customerId?: string;
    customerName: string;
    customerMobile: string;
    guarantorName?: string;
    guarantorMobile?: string;
    imeiNumber?: string;
    customerAddress?: string;
    productName: string;
    productPrice: number;
    downPayment: number;
    interestRate?: number;
    interestAmount?: number;
    totalEmiMonths: number;
    monthlyEmiAmount: number;
    firstDueDate: string;
    paymentFrequency: 'MONTHLY';
    notes?: string;
  }): Promise<string> => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot create EMI accounts.');

    const existingCustomer =
      (data.customerId ? customers.find((c) => c.customerId === data.customerId) : null) ||
      customers.find(
        (c) => c.mobileNumber.trim() === data.customerMobile.trim() && c.status !== 'ARCHIVED'
      );
    const finalCustomerId: string = existingCustomer
      ? existingCustomer.customerId
      : `cust_${Date.now()}`;
    const emiId = `emi_${Date.now()}`;

    // Principal and interest calculations
    const principalAmount = Math.max(0, data.productPrice - data.downPayment);
    const interestRate = Number(data.interestRate) || 0;
    const interestAmount =
      data.interestAmount !== undefined
        ? data.interestAmount
        : Math.round(principalAmount * (interestRate / 100));
    const totalFinancedAmount = principalAmount + interestAmount;

    // Lean EMI account object (no redundant customerName/Mobile stored inside doc)
    const newEmiRaw: EmiAccount = {
      emiId,
      customerId: finalCustomerId,
      customerName: data.customerName.trim(),
      customerMobile: data.customerMobile.trim(),
      guarantorName: data.guarantorName?.trim() || '',
      guarantorMobile: data.guarantorMobile?.trim() || '',
      imeiNumber: data.imeiNumber?.trim() || '',
      productName: data.productName.trim(),
      productPrice: data.productPrice,
      downPayment: data.downPayment,
      interestRate,
      interestAmount,
      totalFinancedAmount,
      remainingAmount: totalFinancedAmount,
      totalEmiMonths: data.totalEmiMonths,
      monthlyEmiAmount: data.monthlyEmiAmount,
      firstDueDate: data.firstDueDate,
      paymentFrequency: data.paymentFrequency,
      notes: data.notes?.trim() || '',
      status: 'ACTIVE',
      totalPaid: 0,
      totalFines: 0,
      totalPostPlanCharges: 0,
      lastChargedMonth: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newEmi = cleanEmiForDb(newEmiRaw) as EmiAccount;

    const rawInstallments = generateInstallmentSchedule({
      emiId,
      customerId: finalCustomerId,
      customerName: data.customerName.trim(),
      customerMobile: data.customerMobile.trim(),
      totalMonths: data.totalEmiMonths,
      monthlyAmount: data.monthlyEmiAmount,
      firstDueDate: data.firstDueDate,
      remainingFinancedAmount: totalFinancedAmount,
    });
    const newInstallments = rawInstallments.map((i) => cleanInstallmentForDb(i) as Installment);

    try {
      if (!existingCustomer) {
        const nextIdNumber = 1001 + customers.length;
        const customId = `MT-${nextIdNumber}`;

        const newCustomer: Customer = {
          customerId: finalCustomerId,
          customId,
          name: data.customerName.trim(),
          mobileNumber: data.customerMobile.trim(),
          address: data.customerAddress?.trim() || 'Dhaka, Bangladesh',
          guarantorName: data.guarantorName?.trim() || '',
          guarantorMobile: data.guarantorMobile?.trim() || '',
          totalEmiAmount: totalFinancedAmount,
          paidAmount: 0,
          remainingAmount: totalFinancedAmount,
          activeEmiCount: 1,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emiAccounts: [newEmi],
          installments: newInstallments,
          payments: [],
        };

        // 1 single document write in customers collection
        await setDoc(doc(db, 'customers', finalCustomerId), newCustomer);
      } else {
        const currentEmis = existingCustomer.emiAccounts || [];
        const currentInstallments = existingCustomer.installments || [];

        const updatedCustomer: Customer = {
          ...existingCustomer,
          totalEmiAmount: existingCustomer.totalEmiAmount + totalFinancedAmount,
          remainingAmount: existingCustomer.remainingAmount + totalFinancedAmount,
          activeEmiCount: existingCustomer.activeEmiCount + 1,
          ...(data.customerAddress?.trim() ? { address: data.customerAddress.trim() } : {}),
          ...(data.guarantorName ? { guarantorName: data.guarantorName.trim() } : {}),
          ...(data.guarantorMobile ? { guarantorMobile: data.guarantorMobile.trim() } : {}),
          updatedAt: new Date().toISOString(),
          emiAccounts: [...currentEmis, newEmi],
          installments: [...currentInstallments, ...newInstallments],
        };

        // 1 single document update in customers collection
        await setDoc(doc(db, 'customers', finalCustomerId), updatedCustomer, { merge: true });
      }

      return emiId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customers/${finalCustomerId}`);
      return '';
    }
  };

  const recordPayment = async (data: {
    installmentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    transactionId?: string;
    notes?: string;
  }) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot accept or mark payments.');

    const targetCustomer = customers.find((c) =>
      (c.installments || []).some((i) => i.installmentId === data.installmentId)
    );

    if (!targetCustomer) throw new Error('Installment or Customer record not found.');

    const currentInstallments = targetCustomer.installments || [];
    const currentEmis = targetCustomer.emiAccounts || [];
    const currentPayments = targetCustomer.payments || [];

    const targetInstallment = currentInstallments.find(
      (i) => i.installmentId === data.installmentId
    );
    if (!targetInstallment) throw new Error('Installment not found.');

    const targetEmi = currentEmis.find((e) => e.emiId === targetInstallment.emiId);
    if (!targetEmi) throw new Error('EMI account not found.');

    const paymentId = `pay_${Date.now()}`;
    const newPaidAmount = targetInstallment.paidAmount + data.amount;
    const newRemainingAmount = Math.max(0, targetInstallment.totalPayable - newPaidAmount);
    const newStatus = newRemainingAmount === 0 ? 'PAID' : 'PARTIALLY PAID';

    const paymentRecordRaw: Payment = {
      paymentId,
      customerId: targetCustomer.customerId,
      customerName: targetCustomer.name,
      emiId: targetInstallment.emiId,
      installmentId: targetInstallment.installmentId,
      installmentNumber: targetInstallment.installmentNumber,
      paymentDate: data.paymentDate,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId || '',
      notes: data.notes || '',
      recordedByUid: currentUser?.uid || '',
      recordedByEmail: currentUser?.email || '',
      createdAt: new Date().toISOString(),
    };
    const paymentRecord = cleanPaymentForDb(paymentRecordRaw) as Payment;

    const updatedInstallments = currentInstallments.map((i) =>
      i.installmentId === targetInstallment.installmentId
        ? (cleanInstallmentForDb({
            ...i,
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus as Installment['status'],
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }) as Installment)
        : i
    );

    const emiRemaining = updatedInstallments
      .filter((i) => i.emiId === targetEmi.emiId)
      .reduce((sum, i) => sum + i.remainingAmount, 0);
    const emiTotalPaid = targetEmi.totalPaid + data.amount;
    const emiStatus = emiRemaining === 0 ? 'COMPLETED' : targetEmi.status;

    const updatedEmis = currentEmis.map((e) =>
      e.emiId === targetEmi.emiId
        ? (cleanEmiForDb({
            ...e,
            totalPaid: emiTotalPaid,
            remainingAmount: emiRemaining,
            status: emiStatus as EmiAccount['status'],
            updatedAt: new Date().toISOString(),
          }) as EmiAccount)
        : e
    );

    const custPaid = targetCustomer.paidAmount + data.amount;
    const custRemaining = Math.max(0, targetCustomer.remainingAmount - data.amount);
    const activeEmiCount = updatedEmis.filter((e) => e.status === 'ACTIVE').length;

    const updatedCustomer: Customer = {
      ...targetCustomer,
      paidAmount: custPaid,
      remainingAmount: custRemaining,
      activeEmiCount,
      updatedAt: new Date().toISOString(),
      emiAccounts: updatedEmis,
      installments: updatedInstallments,
      payments: [paymentRecord, ...currentPayments],
    };

    try {
      // 1 single document update in customers collection
      await setDoc(doc(db, 'customers', targetCustomer.customerId), updatedCustomer, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customers/${targetCustomer.customerId}`);
    }
  };

  const updateInstallmentDueDate = async (installmentId: string, newDueDate: string) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot change due dates.');

    const targetCustomer = customers.find((c) =>
      (c.installments || []).some((i) => i.installmentId === installmentId)
    );

    if (!targetCustomer) throw new Error('Installment not found.');

    const updatedInstallments = (targetCustomer.installments || []).map((i) =>
      i.installmentId === installmentId
        ? (cleanInstallmentForDb({ ...i, dueDate: newDueDate, updatedAt: new Date().toISOString() }) as Installment)
        : i
    );

    try {
      await updateDoc(doc(db, 'customers', targetCustomer.customerId), {
        installments: updatedInstallments,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${targetCustomer.customerId}`);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot change settings.');
    const merged: AppSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.email || 'admin',
    };
    try {
      await setDoc(doc(db, 'settings', 'app_settings'), merged);
      setSettings(merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/app_settings');
    }
  };

  const approveUser = async (uid: string, role: UserRole) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot approve users.');
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'APPROVED',
        role,
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.email || 'admin',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const rejectUser = async (uid: string) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot reject users.');
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'REJECTED',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.email || 'admin',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const disableUser = async (uid: string) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot disable users.');
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'DISABLED',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.email || 'admin',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateUserRole = async (uid: string, role: UserRole) => {
    if (!isAdmin) throw new Error('Unauthorized: Viewer cannot change user roles.');
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setReadNotifications((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      try {
        localStorage.setItem('read_notifications', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const clearAllNotifications = async () => {
    const allIds = notifications.map((n) => n.notificationId);
    setReadNotifications(new Set(allIds));
    try {
      localStorage.setItem('read_notifications', JSON.stringify(allIds));
    } catch {}
  };

  return (
    <DataContext.Provider
      value={{
        customers,
        emiAccounts,
        installments,
        payments,
        notifications,
        users,
        settings,
        loading,
        error,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        createEmiAccount,
        recordPayment,
        updateInstallmentDueDate,
        updateSettings,
        approveUser,
        rejectUser,
        disableUser,
        updateUserRole,
        markNotificationAsRead,
        clearAllNotifications,
        triggerEmiEvaluation,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
