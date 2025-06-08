// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCFXwejaP2__yjIWuDSwCwx7o5hoax-GQM",
    authDomain: "ice-lol.firebaseapp.com",
    databaseURL: "https://ice-lol-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ice-lol",
    storageBucket: "ice-lol.firebasestorage.app",
    messagingSenderId: "1009338020865",
    appId: "1:1009338020865:web:096d67acff31304c7ebc00",
    measurementId: "G-M4678CVL8Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Export initialized services
export { app, analytics, auth, database, storage }; 