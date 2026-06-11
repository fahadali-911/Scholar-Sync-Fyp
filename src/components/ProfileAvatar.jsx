import React, { useState, useRef } from "react";
import { uploadFile } from "../services/uploadService";
import { editUser } from "../api/FireStore";

/**
 * Asynchronous API function to handle uploading the profile image.
 * This demonstrates sending the file in a FormData object.
 *
 * @param {File} file - The image file selected by the user.
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadProfileImage = async (file) => {
  try {
    // 1. Prepare FormData (required by standard multi-part file uploads)
    const formData = new FormData();
    formData.append("profileImage", file);

    // 2. Call the file upload service
    // In this app, we upload to Cloudinary using uploadFile
    const result = await uploadFile(file, "research-hub/profiles");
    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    // 3. Update the Firestore user record with the new URL
    const updateResult = await editUser({
      photoURL: result.url,
      profileImagePublicId: result.publicId,
      updatedAt: new Date(),
    });

    if (!updateResult.success) {
      throw new Error(updateResult.error || "Failed to update profile record");
    }

    return { success: true, url: result.url };
  } catch (error) {
    console.error("Profile image upload failed:", error);
    return { success: false, error: error.message };
  }
};

const ProfileAvatar = ({
  user,
  size = "md",
  className = "",
  onClick = null,
  showOnlineStatus = false,
  isOnline = false,
  isEditable = false,
  onImageUpdate = null,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Get user data
  const userData = user || {};
  const name = userData.name || userData.displayName || "User";
  const currentPhotoURL =
    userData.photoURL || userData.avatar || userData.profilePicture;

  // Use previewUrl if available, otherwise fallback to currentPhotoURL
  const displayPhotoURL = previewUrl || currentPhotoURL;

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

  const handleContainerClick = (e) => {
    if (isEditable && !uploading) {
      fileInputRef.current?.click();
    } else if (onClick) {
      onClick(e);
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // File Validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid format. Please upload JPEG, PNG, or WEBP images.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File size exceeds 5MB limit. Please select a smaller image.");
      return;
    }

    // Instant Client Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const response = await uploadProfileImage(file);
      if (response.success) {
        if (onImageUpdate) {
          onImageUpdate(response.url);
        }
      } else {
        // Revert preview URL on failure
        setPreviewUrl(null);
        alert(`Error updating profile image: ${response.error}`);
      }
    } catch (err) {
      setPreviewUrl(null);
      alert("Failed to upload profile image. Please try again.");
    } finally {
      setUploading(false);
      // Clean up local preview object URL memory
      URL.revokeObjectURL(objectUrl);
    }
  };

  const baseClasses = `${sizeClasses[size] || sizeClasses.md} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative`;
  const interactiveClasses = (isEditable || onClick)
    ? "cursor-pointer transition-all duration-300 select-none"
    : "";
  const hoverClasses = isEditable
    ? "hover:scale-[1.02] hover:opacity-90 active:scale-98 group"
    : onClick
    ? "hover:shadow-lg"
    : "";
  const combinedClasses = `${baseClasses} ${interactiveClasses} ${hoverClasses} ${className}`;

  return (
    <div className={combinedClasses} onClick={handleContainerClick}>
      {/* Hidden File Input */}
      {isEditable && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      )}

      {/* Loading Spinner Overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center rounded-full z-20">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {displayPhotoURL ? (
        <img
          src={displayPhotoURL}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.target.style.display = "none";
            const sibling = e.target.nextSibling;
            if (sibling) sibling.style.display = "flex";
          }}
        />
      ) : null}

      {/* Fallback initials */}
      <div
        className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold rounded-full flex items-center justify-center ${
          displayPhotoURL ? "hidden" : "flex"
        }`}
        style={{ display: displayPhotoURL ? "none" : "flex" }}
      >
        {getInitials(name)}
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && !isEditable && (
        <div
          className={`absolute -bottom-1 -right-1 ${
            size === "xs" || size === "sm"
              ? "w-2 h-2"
              : size === "md"
              ? "w-3 h-3"
              : "w-4 h-4"
          } ${
            isOnline ? "bg-emerald-500" : "bg-gray-400"
          } border-2 border-white rounded-full`}
        ></div>
      )}

      {/* Edit Badge Visual Cue (Only for editable mode on large enough sizes) */}
      {isEditable && size !== "xs" && size !== "sm" && (
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:bg-primary-container transition-colors duration-250 z-10">
          <span className="material-symbols-outlined text-[13px] font-bold">photo_camera</span>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
