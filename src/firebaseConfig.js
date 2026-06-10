// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCEtLolqvx65BfQ2zRw4MqpQKn1IEurFZU",
  authDomain: "researchhub-7e718.firebaseapp.com",
  projectId: "researchhub-7e718",
  storageBucket: "researchhub-7e718.appspot.com", // ✅ FIXED
  messagingSenderId: "65929541562",
  appId: "1:65929541562:web:09deedf9abe11d3fabcf83",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider(); // 👈 Export the provider
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
