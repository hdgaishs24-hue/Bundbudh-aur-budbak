import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  linkWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

export const OWNER_EMAIL = 'hdgaishs24@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  isGoogle: boolean;
  ownerEmail: string;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  upgradeGuestToGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  grantAdminAccess: (uid: string) => Promise<void>;
  verifyOwnerPasscode: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminBypass, setAdminBypass] = useState<boolean>(() => {
    return localStorage.getItem('bb_owner_admin_verified') === 'true';
  });

  const isGuest = currentUser?.isAnonymous ?? false;
  const isGoogle = !!currentUser && !isGuest;

  // Determine if admin
  const isAdmin =
    adminBypass ||
    (currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) ||
    (userProfile?.role === 'admin');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          const now = new Date().toISOString();
          const isOwnerAccount = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            const updatedProfile: UserProfile = {
              ...data,
              lastLogin: now,
              displayName: user.displayName || data.displayName,
              photoURL: user.photoURL || data.photoURL,
              role: isOwnerAccount ? 'admin' : data.role || 'user',
            };
            setUserProfile(updatedProfile);
            await updateDoc(userDocRef, {
              lastLogin: now,
              displayName: updatedProfile.displayName,
              photoURL: updatedProfile.photoURL,
              role: updatedProfile.role,
            }).catch(() => {});
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || (user.isAnonymous ? 'Guest Student' : 'Schoolmate'),
              email: user.email,
              photoURL: user.photoURL,
              accountType: user.isAnonymous ? 'anonymous' : 'google',
              role: isOwnerAccount ? 'admin' : 'user',
              createdAt: now,
              lastLogin: now,
            };
            setUserProfile(newProfile);
            await setDoc(userDocRef, newProfile).catch((err) => {
              console.warn('Could not auto-create user document:', err);
            });
          }

          // If owner account, make sure admin document exists in /admins/{uid}
          if (isOwnerAccount) {
            const adminRef = doc(db, 'admins', user.uid);
            await setDoc(adminRef, {
              uid: user.uid,
              email: OWNER_EMAIL,
              role: 'admin',
              createdAt: new Date().toISOString(),
            }, { merge: true }).catch(() => {});
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign In error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error('Guest Sign In error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const upgradeGuestToGoogle = async () => {
    if (!currentUser || !currentUser.isAnonymous) return;
    try {
      setLoading(true);
      await linkWithPopup(currentUser, googleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/credential-already-in-use') {
        // If account already exists with google, sign in directly with Google
        await signInWithPopup(auth, googleProvider);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setAdminBypass(false);
      localStorage.removeItem('bb_owner_admin_verified');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const grantAdminAccess = async (uid: string) => {
    const adminRef = doc(db, 'admins', uid);
    await setDoc(adminRef, {
      uid,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
  };

  const verifyOwnerPasscode = (code: string): boolean => {
    // Verified Owner PIN check
    if (code.trim() === 'ojas2012') {
      setAdminBypass(true);
      localStorage.setItem('bb_owner_admin_verified', 'true');
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(() => {});
      }
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isGuest,
        isGoogle,
        ownerEmail: OWNER_EMAIL,
        signInWithGoogle,
        signInAsGuest,
        upgradeGuestToGoogle,
        logout,
        grantAdminAccess,
        verifyOwnerPasscode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
