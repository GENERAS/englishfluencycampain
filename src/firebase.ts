import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import appletConfig from "../firebase-applet-config.json";

// Production Firebase configuration, using the user's custom project
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

// Initialize Firestore using the configured database with experimental auto-detect long polling
const databaseId = appletConfig.firestoreDatabaseId || "(default)";
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, databaseId);

// Initialize Authentication and Storage
export const auth = getAuth(app);
export const storage = getStorage(app);
