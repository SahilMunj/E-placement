// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > Your apps > SDK setup and configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7EAs8gYzWIT59lnvgPm9iRAJ3kr95Yvc",
    authDomain: "e-placement-portal.firebaseapp.com",
    projectId: "e-placement-portal",
    storageBucket: "e-placement-portal.firebasestorage.app",
    messagingSenderId: "1093451313451",
    appId: "1:1093451313451:web:6be05317aa4174d7e5d56e",
    measurementId: "G-YJ4SFFZD55"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
