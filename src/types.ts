export type UserRole = 'ADMIN' | 'VIEWER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Customer {
  customerId: string;
  customId: string; // e.g. MT-1001
  name: string;
  mobileNumber: string;
  alternativeNumber?: string;
  address: string;
  nidNumber?: string;
  guarantorName?: string;
  guarantorMobile?: string;
  notes?: string;
  totalEmiAmount: number;
  paidAmount: number;
  remainingAmount: number;
  activeEmiCount: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  // Embedded EMI accounts, Installments, and Payments directly in the customer document
  // Saves Firestore quota, reduces write limits, avoids sub-collections or duplicate collections
  emiAccounts?: EmiAccount[];
  installments?: Installment[];
  payments?: Payment[];
}

export interface EmiAccount {
  emiId: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  guarantorName?: string;
  guarantorMobile?: string;
  imeiNumber?: string;
  productName: string;
  productPrice: number;
  downPayment: number;
  interestRate?: number; // percentage interest on principal after downpayment
  interestAmount?: number; // total calculated interest amount in BDT
  totalFinancedAmount?: number; // principal + interestAmount
  remainingAmount: number; // financed amount remaining
  totalEmiMonths: number;
  monthlyEmiAmount: number;
  firstDueDate: string; // YYYY-MM-DD
  paymentFrequency: 'MONTHLY';
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
  totalPaid: number;
  totalFines: number;
  totalPostPlanCharges: number;
  lastChargedMonth?: number; // tracks how many extra months of 2% post-plan charges applied
  createdAt: string;
  updatedAt: string;
}

export type InstallmentStatus = 'UPCOMING' | 'DUE TODAY' | 'PAID' | 'OVERDUE' | 'PARTIALLY PAID';

export interface Installment {
  installmentId: string;
  emiId: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string; // YYYY-MM-DD
  emiAmount: number; // Base installment
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
  lateDays: number;
  fine: number;
  extraCharge: number;
  totalPayable: number;
  paidAt?: string;
  fineAppliedAt?: string;
  postPlanChargeAppliedAt?: string;
  notes?: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK';

export interface Payment {
  paymentId: string;
  customerId: string;
  customerName: string;
  emiId: string;
  installmentId: string;
  installmentNumber: number;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  recordedByUid: string;
  recordedByEmail: string;
  createdAt: string;
}

export type NotificationType = 'DUE_TODAY' | 'REMINDER_BEFORE' | 'OVERDUE' | 'LATE_FINE' | 'POST_PLAN';

export interface NotificationItem {
  notificationId: string;
  title: string;
  body: string;
  type: NotificationType;
  targetCustomerId?: string;
  targetEmiId?: string;
  targetInstallmentId?: string;
  dueDate?: string;
  amount?: number;
  status: 'UNREAD' | 'READ';
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  currency: string;
  timeZone: string;
  notificationEnabled: boolean;
  reminderOneDayBefore: boolean;
  dueTodayNotification: boolean;
  overdueNotification: boolean;
  lateFineNotification: boolean;
  notificationTime: string; // HH:MM
  gracePeriodDays: number;
  lateFineType: 'FIXED' | 'PERCENTAGE';
  lateFineAmount: number;
  postPlanChargeEnabled: boolean;
  postPlanPercentage: number;
  postPlanFrequency: 'MONTHLY';
  postPlanCalculationMethod: 'CURRENT_OUTSTANDING' | 'ORIGINAL_OUTSTANDING';
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Mehedi Telecom EMI',
  currency: '৳',
  timeZone: 'Asia/Dhaka',
  notificationEnabled: true,
  reminderOneDayBefore: true,
  dueTodayNotification: true,
  overdueNotification: true,
  lateFineNotification: true,
  notificationTime: '09:00',
  gracePeriodDays: 7,
  lateFineType: 'FIXED',
  lateFineAmount: 500,
  postPlanChargeEnabled: true,
  postPlanPercentage: 2,
  postPlanFrequency: 'MONTHLY',
  postPlanCalculationMethod: 'CURRENT_OUTSTANDING',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};
