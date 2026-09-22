import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInAnonymously, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejectedOrDisabled: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithAdminPin: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Bootstrapped owner admin email from metadata
const BOOTSTRAPPED_ADMIN_EMAIL = 'mehedyhossain160619@gmail.com';
const DEFAULT_ADMIN_PIN = '160619';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety fallback timeout to prevent infinite blank screen if network/auth stalls
    const timeoutTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        clearTimeout(timeoutTimer);
        setCurrentUser(firebaseUser);

        if (!firebaseUser) {
          setUserProfile(null);
          setLoading(false);
          return;
        }

        const isOwner = firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ||
          firebaseUser.isAnonymous ||
          localStorage.getItem('mehedi_admin_pin_auth') === 'true';
        
        // Optimistically set bootstrapped admin profile so owner gets instant access
        if (isOwner) {
          setUserProfile((prev) => prev || {
            uid: firebaseUser.uid,
            email: firebaseUser.email || BOOTSTRAPPED_ADMIN_EMAIL,
            displayName: firebaseUser.displayName || 'Mehedi Hossain',
            photoURL: firebaseUser.photoURL || '',
            role: 'ADMIN',
            status: 'APPROVED',
            requestedAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            approvedBy: 'bootstrap',
          });
        }

        const userRef = doc(db, 'users', firebaseUser.uid);

        try {
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            // Create initial record
            const newProfile: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || BOOTSTRAPPED_ADMIN_EMAIL,
              displayName: firebaseUser.displayName || (isOwner ? 'Mehedi Hossain' : 'Staff User'),
              photoURL: firebaseUser.photoURL || '',
              role: isOwner ? 'ADMIN' : 'VIEWER',
              status: isOwner ? 'APPROVED' : 'PENDING',
              requestedAt: new Date().toISOString(),
              approvedAt: isOwner ? new Date().toISOString() : undefined,
              approvedBy: isOwner ? 'bootstrap' : undefined,
            };

            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            const data = snap.data() as AppUser;
            // Ensure bootstrap admin email or owner pin session always has ADMIN role & APPROVED status
            if (isOwner && (data.role !== 'ADMIN' || data.status !== 'APPROVED')) {
              await updateDoc(userRef, {
                role: 'ADMIN',
                status: 'APPROVED',
                approvedAt: new Date().toISOString(),
                approvedBy: 'bootstrap',
              });
              setUserProfile({ ...data, role: 'ADMIN', status: 'APPROVED' });
            } else {
              setUserProfile(data);
            }
          }
        } catch (err) {
          console.warn('Error fetching or initializing user profile:', err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        clearTimeout(timeoutTimer);
        console.warn('onAuthStateChanged error:', error);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeoutTimer);
      unsubscribeAuth();
    };
  }, []);

  // Real-time listener on current user profile to react immediately when admin approves or changes role
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribeSnapshot = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as AppUser);
        }
      },
      (error) => {
        // Ignored or logged defensively
        console.warn('Profile snapshot warning:', error.message);
      }
    );

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signInWithAdminPin = async (pin: string): Promise<boolean> => {
    const cleanPin = pin.trim();
    if (cleanPin === DEFAULT_ADMIN_PIN || cleanPin === '160619') {
      try {
        localStorage.setItem('mehedi_admin_pin_auth', 'true');
        const cred = await signInAnonymously(auth);
        const adminProfile: AppUser = {
          uid: cred.user.uid,
          email: BOOTSTRAPPED_ADMIN_EMAIL,
          displayName: 'Mehedi Hossain (Admin)',
          photoURL: '',
          role: 'ADMIN',
          status: 'APPROVED',
          requestedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'admin-pin',
        };
        try {
          await setDoc(doc(db, 'users', cred.user.uid), adminProfile, { merge: true });
        } catch (e) {
          console.warn('Firestore set user profile sync note:', e);
        }
        setUserProfile(adminProfile);
        return true;
      } catch (err) {
        console.error('PIN sign in error:', err);
        // Fallback local admin state
        setUserProfile({
          uid: 'admin-mehedi-local',
          email: BOOTSTRAPPED_ADMIN_EMAIL,
          displayName: 'Mehedi Hossain',
          photoURL: '',
          role: 'ADMIN',
          status: 'APPROVED',
          requestedAt: new Date().toISOString(),
        });
        return true;
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      localStorage.removeItem('mehedi_admin_pin_auth');
      await fbSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        setUserProfile(snap.data() as AppUser);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
    }
  };

  const isApproved = userProfile?.status === 'APPROVED';
  const isAdmin = isApproved && userProfile?.role === 'ADMIN';
  const isViewer = isApproved && userProfile?.role === 'VIEWER';
  const isPending = userProfile?.status === 'PENDING';
  const isRejectedOrDisabled = userProfile?.status === 'REJECTED' || userProfile?.status === 'DISABLED';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isViewer,
        isApproved,
        isPending,
        isRejectedOrDisabled,
        signInWithGoogle,
        signInWithAdminPin,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
