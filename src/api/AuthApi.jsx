import React from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signOut } from "firebase/auth";
export const AuthApi = (email, password) => {
  try {
    let response = signInWithEmailAndPassword(auth, email, password);
    return response;
  } catch (error) {
    return error;
  }
};
export const RegisterApi = (email, password, role, name) => {
  try {
    let response = createUserWithEmailAndPassword(
      auth,
      email,
      password,
      role,
      name
    );
    return response;
  } catch (error) {
    return error;
  }
};
export const GoogleAuthApi = () => {
  const provider = new GoogleAuthProvider();
  try {
    let response = signInWithPopup(auth, provider);
    return response;
  } catch (error) {
    return error;
  }
};

export const onLogut = () => {
  try {
    signOut(auth);
    localStorage.removeItem("userEmail");
  } catch (error) {
    console.error("Logout failed: ", error);
  }
};
