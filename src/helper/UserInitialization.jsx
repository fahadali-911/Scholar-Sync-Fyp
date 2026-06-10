import { useEffect } from "react";
import { auth } from "../firebaseConfig";
import { ensureUserDocument } from "../api/FireStore";
import { onAuthStateChanged } from "firebase/auth";

// Hook to ensure user document exists
export const useUserInitialization = () => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ensure the user document exists in Firestore
          await ensureUserDocument();
          console.log("User document verified/created for:", user.email);
        } catch (error) {
          console.error("Error initializing user document:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);
};

export const UserInitializer = ({ children }) => {
  useUserInitialization();
  return children;
};
