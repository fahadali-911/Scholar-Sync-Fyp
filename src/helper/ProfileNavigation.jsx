import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";

// Profile Avatar Component
export const ProfileAvatar = ({
  user,
  size = "md",
  showName = true,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (user?.id === auth.currentUser?.uid) {
      navigate("/my-profile");
    } else if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const getProfileInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case "sm":
        return "w-8 h-8 text-xs";
      case "lg":
        return "w-16 h-16 text-lg";
      case "xl":
        return "w-20 h-20 text-xl";
      default:
        return "w-12 h-12 text-sm";
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div
        onClick={handleClick}
        className={`${getSizeClasses(
          size
        )} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-all duration-200`}
      >
        {getProfileInitials(user?.name)}
      </div>
      {showName && (
        <div>
          <button
            onClick={handleClick}
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
          >
            {user?.name || "Anonymous"}
          </button>
        </div>
      )}
    </div>
  );
};

// Profile Link Component
export const ProfileLink = ({ user, children, className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (user?.id === auth.currentUser?.uid) {
      navigate("/my-profile");
    } else if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`cursor-pointer hover:text-blue-600 transition-colors ${className}`}
    >
      {children}
    </button>
  );
};
