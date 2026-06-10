import React, { useEffect, useState } from "react";
import Navbar from "../common/navbar";
import Homefeed from "../components/Homefeed";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getUser, ensureUserDocument } from "../api/FireStore";
import { useNavigate } from "react-router-dom";
import { UserInitializer } from "../helper/UserInitialization";
import Loader from "../components/Loader";

export default function Home() {
  const [currUser, setCurrUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInitialized, setUserInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        // Ensure user document exists in Firestore
        await ensureUserDocument();
        setUserInitialized(true);

        // Set up real-time listener for user data
        getUser(setCurrUser);
      } catch (error) {
        console.error("Error initializing user:", error);
        // Even if initialization fails, try to proceed
        setUserInitialized(true);
        getUser(setCurrUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading || !userInitialized) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Homefeed currUser={currUser} />
    </div>
  );
}
