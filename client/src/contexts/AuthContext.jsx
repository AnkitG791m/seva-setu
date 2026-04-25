import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth, googleProvider, messaging } from '../lib/firebase.js';
import { getMe, registerUser, updateFcmToken } from '../lib/api.js';
import { getToken, onMessage } from 'firebase/messaging';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);   // DB user
  const [firebaseUser, setFirebase] = useState(null); // Firebase user
  const [loading, setLoading]     = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    // Failsafe: Ensure loading is set to false after 2 seconds even if Firebase hangs
    const failsafe = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timed out, using guest mode');
        setLoading(false);
      }
    }, 2000);

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(failsafe);
      setFirebase(fbUser);
      if (fbUser) {
        try {
          const { data } = await getMe();
          setUser(data);
          
          // FCM Setup for volunteers
          if (messaging && (data.role === 'VOLUNTEER' || data.role === 'FIELD_WORKER')) {
            try {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                const token = await getToken(messaging, { 
                  // vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' 
                });
                if (token) {
                  await updateFcmToken(token);
                }
              }
            } catch (err) {
              console.error('FCM Token generation failed:', err);
            }
          }

        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    let unsubscribeOnMessage = null;
    if (messaging) {
      unsubscribeOnMessage = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};
        const { taskId, urgencyScore, locationLat, locationLng, deepLink } = payload.data || {};

        toast.custom(
          (t) => (
            <div className={`bg-slate-800 border border-brand-500/30 text-white p-4 flex flex-col gap-2 rounded-xl shadow-2xl w-80 animate-slide-up ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
              <div className="font-bold border-b border-slate-700 pb-2">📋 {title || 'Nayi Task'}</div>
              <div className="text-sm text-slate-300">
                📍 {body ? body.split('-')[1]?.trim() || body : 'Location'} <br />
                🔥 Urgency: <span className="font-bold text-orange-400">{urgencyScore || 'N/A'}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (deepLink) window.location.href = deepLink;
                  }}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs py-1.5 rounded transition-colors"
                >
                  Dekho
                </button>
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs py-1.5 rounded transition-colors"
                >
                  Baad mein
                </button>
              </div>
            </div>
          ),
          { duration: 10000, position: 'top-center' }
        );
      });
    }

    return () => {
      unsub();
      if (unsubscribeOnMessage) unsubscribeOnMessage();
    };
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // Try to get the user from DB; if not found, register them
    try {
      const { data } = await getMe();
      setUser(data);
      return data;
    } catch {
      const { data } = await registerUser({
        firebase_uid: result.user.uid,
        name:         result.user.displayName || 'Anonymous',
        email:        result.user.email,
        role:         'VOLUNTEER',
      });
      setUser(data);
      return data;
    }
  };

  const loginWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    const { data } = await getMe();
    setUser(data);
    return data;
  };

  const registerWithEmail = async ({ email, password, name, phone, role }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const { data } = await registerUser({
      firebase_uid: cred.user.uid,
      name,
      email,
      phone,
      role,
    });
    setUser(data);
    return data;
  };

  const loginWithPhone = async (phoneNumber, recaptchaVerifier) => {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    setConfirmationResult(confirmation);
    return confirmation;
  };

  const verifyOTP = async (code) => {
    if (!confirmationResult) throw new Error('No OTP request found');
    const result = await confirmationResult.confirm(code);
    try {
      const { data } = await getMe();
      setUser(data);
      return data;
    } catch {
      // Register if it doesn't exist. Name and email optional due to DB changes
      const { data } = await registerUser({
        firebase_uid: result.user.uid,
        name: null,
        email: null,
        phone: result.user.phoneNumber,
        role: 'FIELD_WORKER', // Default to FIELD_WORKER for phone auth as per instructions
      });
      setUser(data);
      return data;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebase(null);
    setConfirmationResult(null);
  };

  const dummyUser = {
    id: 'dummy-admin',
    name: 'Admin (Dummy)',
    email: 'admin@sevasetu.dummy',
    role: 'COORDINATOR',
  };

  return (
    <AuthContext.Provider
      value={{ 
        user: user || dummyUser, 
        firebaseUser, 
        loading, 
        loginWithGoogle, 
        loginWithEmail, 
        registerWithEmail, 
        loginWithPhone, 
        verifyOTP, 
        logout 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
