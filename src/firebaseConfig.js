import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updateProfile, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Add Firebase Storage import

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

// Enable persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase persistence enabled');
  })
  .catch((error) => {
    console.error('Error enabling persistence:', error);
  });

const generateUsername = (name) => {
  const base = name.toLowerCase().replace(/\s+/g, "_");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${randomNum}`;
};

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check Firestore for existing user data
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const name = user.displayName || prompt("Enter your name:");
      const username = generateUsername(name);
      await setDoc(userRef, {
        uid: user.uid,
        displayName: name,
        email: user.email,
        username: username,
        photoURL: user.photoURL,
        createdAt: new Date(),
      });

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: name });
    }
    return user;
  } catch (error) {
    console.error("Google Sign-In Error: ", error);
    throw error;
  }
};

const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Password reset email sent!" };
  } catch (error) {
    console.error("Password Reset Error: ", error);
    throw error;
  }
};

export { app, auth, db, storage, signInWithGoogle, sendPasswordReset }; // Export storage