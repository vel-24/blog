// client/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (!apiKey || apiKey === "undefined" || apiKey.startsWith("<")) {
  console.error("🔥 Missing/invalid VITE_FIREBASE_API_KEY. Check client/.env and rebuild.");
  console.error("Value at runtime:", apiKey);
  // Optional: throw to prevent app from running during debugging
  // throw new Error("Missing VITE_FIREBASE_API_KEY");
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);

// export a top-level variable and initialize it inside the try block
export let analytics = null;
try {
  // analytics may fail in some environments — guard it
  analytics = getAnalytics(app);
} catch (e) {
  // not fatal: analytics sometimes throws in non-browser environments
  // console.warn("Analytics not initialized:", e);
}
export const storage = getStorage(app);
