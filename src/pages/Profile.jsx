import React, { useEffect, useState } from "react";
import ProfileComponent from "../components/ProfileComponent";
import Navbar from "../common/navbar";
import { getUserDataByUID } from "../api/FireStore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import { doc, onSnapshot } from "firebase/firestore";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const { uid } = useParams(); // Get uid from URL params
  const navigate = useNavigate();

  // Handle authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      } else {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Don't proceed if still checking auth
    if (authLoading) return;

    let unsubscribe = null;
    let timeoutId = null;

    const fetchUserData = async () => {
      setLoading(true);
      setUserNotFound(false);
      setUserData(null);

      try {
        // Determine which user's profile to load
        const targetUID = uid || auth.currentUser?.uid;

        if (!targetUID) {
          console.error("No target UID available");
          setUserNotFound(true);
          setLoading(false);
          return;
        }

        console.log("Fetching profile for UID:", targetUID);

        // Check if viewing own profile
        const ownProfile = !uid || uid === auth.currentUser?.uid;
        setIsOwnProfile(ownProfile);

        // First, try to get the data directly (faster initial load)
        try {
          const initialData = await getUserDataByUID(targetUID);
          if (initialData) {
            console.log("Initial user data loaded:", initialData);
            setUserData(initialData);
            setUserNotFound(false);
            setLoading(false);
          }
        } catch (directFetchError) {
          console.warn(
            "Direct fetch failed, trying real-time listener:",
            directFetchError
          );
        }

        // Set up real-time listener for user data
        const userRef = doc(db, "users", targetUID);

        // Set a timeout to handle cases where the listener never fires
        timeoutId = setTimeout(() => {
          console.warn("Real-time listener timeout - user may not exist");
          if (!userData) {
            setUserNotFound(true);
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        unsubscribe = onSnapshot(
          userRef,
          (docSnap) => {
            // Clear timeout since listener fired
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }

            if (docSnap.exists()) {
              const userData = { id: docSnap.id, ...docSnap.data() };
              console.log("Real-time user data updated:", userData);
              setUserData(userData);
              setUserNotFound(false);
            } else {
              console.log("User document does not exist for UID:", targetUID);

              // For own profile, try to create a basic user document
              if (ownProfile && auth.currentUser) {
                const basicUserData = {
                  id: auth.currentUser.uid,
                  name: auth.currentUser.displayName || "Anonymous User",
                  email: auth.currentUser.email,
                  bio: "",
                  headline: "",
                  about: "",
                  createdAt: new Date(),
                };
                setUserData(basicUserData);
                setUserNotFound(false);
              } else {
                setUserNotFound(true);
              }
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error in real-time user data listener:", error);

            // Clear timeout on error
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }

            // If it's a permission error and it's the user's own profile, create basic data
            if (ownProfile && auth.currentUser) {
              const basicUserData = {
                id: auth.currentUser.uid,
                name: auth.currentUser.displayName || "Anonymous User",
                email: auth.currentUser.email,
                bio: "",
                headline: "",
                about: "",
                createdAt: new Date(),
              };
              setUserData(basicUserData);
              setUserNotFound(false);
            } else {
              setUserNotFound(true);
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error setting up user data fetch:", error);

        // If it's the user's own profile and there's an error, create basic data
        if ((!uid || uid === auth.currentUser?.uid) && auth.currentUser) {
          const basicUserData = {
            id: auth.currentUser.uid,
            name: auth.currentUser.displayName || "Anonymous User",
            email: auth.currentUser.email,
            bio: "",
            headline: "",
            about: "",
            createdAt: new Date(),
          };
          setUserData(basicUserData);
          setUserNotFound(false);
        } else {
          setUserNotFound(true);
        }
        setLoading(false);
      }
    };

    fetchUserData();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [uid, authLoading]); // Re-run when uid changes or auth loading completes

  // Show loader while checking auth
  if (authLoading) {
    return <Loader />;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Loader />
      </>
    );
  }

  if (userNotFound) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              User Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The user you're looking for doesn't exist or their profile is not
              accessible.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/home")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go Back Home
              </button>
              {!isOwnProfile && (
                <button
                  onClick={() => navigate("/my-profile")}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  View My Profile
                </button>
              )}
            </div>
            <div className="mt-6 text-sm text-gray-500">
              <p>If this is your profile, try:</p>
              <ul className="mt-2 space-y-1">
                <li>• Refreshing the page</li>
                <li>• Checking your internet connection</li>
                <li>• Logging out and back in</li>
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {userData ? (
        <ProfileComponent
          userData={userData}
          isOwnProfile={isOwnProfile}
          targetUID={uid || auth.currentUser?.uid}
        />
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Profile Loading Issue
            </h1>
            <p className="text-gray-600 mb-4">
              There was an issue loading the profile. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
    </>
  );
}
