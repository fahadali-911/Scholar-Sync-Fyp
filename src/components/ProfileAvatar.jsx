import React from "react";

const ProfileAvatar = ({
  user,
  size = "md",
  className = "",
  onClick = null,
  showOnlineStatus = false,
  isOnline = false,
}) => {
  // Get user data
  const userData = user || {};
  const name = userData.name || userData.displayName || "User";
  const photoURL =
    userData.photoURL || userData.avatar || userData.profilePicture;

  // Generate initials
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Size configurations
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-20 h-20 text-xl",
    "3xl": "w-24 h-24 text-2xl",
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative`;
  const interactiveClasses = onClick
    ? "cursor-pointer hover:shadow-lg transition-all duration-200"
    : "";
  const combinedClasses = `${baseClasses} ${interactiveClasses} ${className}`;

  return (
    <div className={combinedClasses} onClick={onClick}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}

      {/* Fallback initials  */}
      <div
        className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold rounded-full flex items-center justify-center ${
          photoURL ? "hidden" : "flex"
        }`}
        style={{ display: photoURL ? "none" : "flex" }}
      >
        {getInitials(name)}
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && (
        <div
          className={`absolute -bottom-1 -right-1 ${
            size === "xs" || size === "sm"
              ? "w-2 h-2"
              : size === "md"
              ? "w-3 h-3"
              : "w-4 h-4"
          } ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          } border-2 border-white rounded-full`}
        ></div>
      )}
    </div>
  );
};

export default ProfileAvatar;
