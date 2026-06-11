import React, { createContext, useState, useEffect } from "react";
import { getUser } from "../api/FireStore";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);

  useEffect(() => {
    // Listen to Firebase current user data in real time
    getUser((userData) => {
      if (userData) {
        setCurrentUserData(userData);
        setUserProfileImage(userData.photoURL || userData.avatar || null);
      } else {
        setCurrentUserData(null);
        setUserProfileImage(null);
      }
    });
  }, []);

  const updateGlobalProfileImage = (newUrl) => {
    setUserProfileImage(newUrl);
    if (currentUserData) {
      setCurrentUserData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          photoURL: newUrl,
        };
      });
    }
  };

  return (
    <UserContext.Provider
      value={{
        userProfileImage,
        updateGlobalProfileImage,
        currentUserData,
        setCurrentUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
