import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUUXGT47PupflmLD2OgoK3-dwEng-mGIo",
  authDomain: "efc-rwandan-schools.firebaseapp.com",
  projectId: "efc-rwandan-schools",
  storageBucket: "efc-rwandan-schools.firebasestorage.app",
  messagingSenderId: "311022171521",
  appId: "1:311022171521:web:4495fdc447b26b8348a480",
  measurementId: "G-3541QR617T"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally to avoid failure in non-browser environments or sandboxes
isSupported().then((yes) => {
  if (yes) getAnalytics(app);
});

// Initialize Firestore using the default database with experimental auto-detect long polling
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// Initialize Authentication and Storage
export const auth = getAuth(app);
export const storage = getStorage(app);
