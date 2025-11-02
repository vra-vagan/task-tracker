import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDur-_Gm0ZQOhdNwlzX5Aea-FSMXnXfyOM",
    authDomain: "tasks-cifrium.firebaseapp.com",
    projectId: "tasks-cifrium",
    storageBucket: "tasks-cifrium.firebasestorage.app",
    messagingSenderId: "969489877277",
    appId: "1:969489877277:web:4b22747d40819df432b9f4",
    measurementId: "G-8BM9F20HJM",
};

export const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
