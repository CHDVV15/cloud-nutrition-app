// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyA4ks_-08cUQD1zBelEYrKIoFpPMBMdJlA",
  authDomain: "nutrition-assistant-63023.firebaseapp.com",
  projectId: "nutrition-assistant-63023",
  storageBucket: "nutrition-assistant-63023.firebasestorage.app",
  messagingSenderId: "453851185757",
  appId: "1:453851185757:web:5fd7c1a25982b891d8c3b4",
  measurementId: "G-SZ7TFY2EDN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);