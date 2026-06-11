import React, { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getOrCreateConversation, editUser } from "../api/FireStore";
import ProfileImageUpload from "../components/ProfileImageUpload";
import { UserContext } from "../context/UserContext.jsx";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { uploadFile, validateFile } from "../services/uploadService";


export default function ProfileCard({
  currentUser,
  onEdit,
  isOwnProfile,
  followButton,
  targetUID,
}) {
  const navigate = useNavigate();
  const { updateGlobalProfileImage } = useContext(UserContext);

  const fileInputRef = useRef(null);

  // Separate states for editing profile and cover
  const [isEditingCover, setIsEditingCover] = useState(false);

  // Preview states
  const [coverPreview, setCoverPreview] = useState(null);

  // Loading states
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingCover, setUpdatingCover] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Recently";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSendMessage = async () => {
    if (!targetUID) {
      console.error("No target user ID provided for messaging");
      return;
    }

    try {
      const result = await getOrCreateConversation(targetUID);
      if (result.success) {
        navigate(`/messages?userId=${targetUID}`);
      } else {
        console.error("Failed to create conversation:", result.error);
        navigate(`/messages?userId=${targetUID}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      navigate(`/messages?userId=${targetUID}`);
    }
  };

  // Handle profile picture file change (instant upload flow)
  const handleProfileImageFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(`Error: ${validation.errors.join(", ")}`);
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Check file size (max 5MB for profile images)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUpdatingProfile(true);
    try {
      const folder = "research-hub/profiles";
      const result = await uploadFile(file, folder);

      if (result.success) {
        const dbResult = await editUser({
          photoURL: result.url,
          profileImagePublicId: result.publicId,
          updatedAt: new Date(),
        });

        if (dbResult.success) {
          updateGlobalProfileImage(result.url); // Update global user state
        } else {
          alert("Failed to update profile picture: " + dbResult.error);
        }
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("Error uploading profile image: " + error.message);
    } finally {
      setUpdatingProfile(false);
      // Reset input value to allow uploading the same file again if desired
      e.target.value = "";
    }
  };

  // Handle profile picture removal with confirmation
  const handleProfileImageRemove = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setUpdatingProfile(true);
    try {
      const result = await editUser({
        photoURL: null,
        profileImagePublicId: null,
        updatedAt: new Date(),
      });

      if (result.success) {
        updateGlobalProfileImage(null); // Clear global user state
      } else {
        alert("Failed to remove profile picture: " + result.error);
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      alert("Error removing profile picture: " + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle cover photo preview
  const handleCoverImagePreview = (imageData) => {
    setCoverPreview(imageData);
  };

  // Handle cover photo upload
  const handleCoverImageUpload = async (imageData) => {
    setUpdatingCover(true);
    try {
      const result = await editUser({
        coverPhotoURL: imageData.url,
        coverImagePublicId: imageData.publicId,
        updatedAt: new Date(),
      });

      if (result.success) {
        setCoverPreview(null);
        setIsEditingCover(false);
      } else {
        alert("Failed to update cover photo: " + result.error);
      }
    } catch (error) {
      console.error("Error updating cover photo:", error);
      alert("Error updating cover photo: " + error.message);
    } finally {
      setUpdatingCover(false);
    }
  };

  // Handle cover photo removal
  const handleCoverImageRemove = async () => {
    setUpdatingCover(true);
    try {
      const result = await editUser({
        coverPhotoURL: null,
        coverImagePublicId: null,
        updatedAt: new Date(),
      });

      if (result.success) {
        setCoverPreview(null);
        setIsEditingCover(false);
      } else {
        alert("Failed to remove cover photo: " + result.error);
      }
    } catch (error) {
      console.error("Error removing cover photo:", error);
      alert("Error removing cover photo: " + error.message);
    } finally {
      setUpdatingCover(false);
    }
  };

  const cancelCoverEdit = () => {
    setIsEditingCover(false);
    setCoverPreview(null);
  };

  const confirmCoverUpload = () => {
    if (coverPreview) {
      handleCoverImageUpload(coverPreview);
    }
  };

  return (
    <section className="mb-6 relative rounded-3xl overflow-hidden glass-card">
      {/* Cover Image Section */}
      <div className="h-48 md:h-64 relative bg-gradient-to-r from-primary to-secondary">
        {coverPreview ? (
          <img
            src={coverPreview.url}
            alt="Cover Preview"
            className="w-full h-full object-cover"
          />
        ) : currentUser?.coverPhotoURL ? (
          <img
            src={currentUser.coverPhotoURL}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary"></div>
        )}
        <div className="absolute inset-0 pattern-overlay"></div>

        {/* Cover Photo Edit overlay */}
        {isOwnProfile && isEditingCover && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <div className="w-full h-full flex items-center justify-center">
              <ProfileImageUpload
                currentImage={currentUser?.coverPhotoURL}
                onImageUpload={handleCoverImagePreview}
                onImageRemove={handleCoverImageRemove}
                type="cover"
                className="w-full h-full"
              />
            </div>
            {/* Cover Edit Action Buttons */}
            <div className="absolute bottom-4 right-4 flex space-x-2 z-30">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cancelCoverEdit();
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {coverPreview && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmCoverUpload();
                  }}
                  disabled={updatingCover}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {updatingCover ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Edit Cover Photo Icon Button (Owner only) */}
        {isOwnProfile && !isEditingCover && (
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditingCover(true);
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
              title="Edit cover banner"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Details Header Panel */}
      <div className="px-6 pb-6 pt-16 md:pt-20 flex flex-col md:flex-row md:items-end justify-between relative">
        {/* Avatar Wrapper overlapping the cover banner */}
        <div className="absolute -top-16 left-6 md:left-10 w-32 h-32 md:w-40 md:h-40 z-10">
          {/* Hidden File Input for Avatar (Owner only) */}
          {isOwnProfile && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageFileChange}
              className="hidden"
            />
          )}

          {/* Main profile picture container */}
          <div 
            onClick={() => {
              if (isOwnProfile && !updatingProfile) {
                fileInputRef.current?.click();
              }
            }}
            className={`w-full h-full rounded-full border-4 border-white bg-white shadow-xl overflow-hidden relative ${
              isOwnProfile ? "cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" : ""
            }`}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                {getInitials(currentUser?.name)}
              </div>
            )}

            {/* Subtle Hover Cue overlay */}
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center" />
            )}

            {/* Spinner Overlay during Profile Picture update */}
            {updatingProfile && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-white animate-spin" />
                <span className="text-[9px] md:text-[10px] text-white mt-1 font-medium tracking-wide">Uploading</span>
              </div>
            )}
          </div>

          {/* Floating BADGE controls outside the overflow-hidden container to prevent clipping */}
          {isOwnProfile && (
            <>
              {/* Camera FAB on Bottom-Right */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-9 h-9 bg-primary hover:bg-primary-light text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all cursor-pointer hover:scale-105 active:scale-95 z-20"
                title="Change profile photo"
                disabled={updatingProfile}
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Red Trash FAB on Bottom-Left (Visible only if currentUser?.photoURL exists) */}
              {currentUser?.photoURL && (
                <button
                  onClick={handleProfileImageRemove}
                  className="absolute bottom-1 left-1 md:bottom-2 md:left-2 w-9 h-9 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-full flex items-center justify-center shadow-lg border-2 border-rose-100/30 transition-all cursor-pointer hover:scale-105 active:scale-95 z-20"
                  title="Remove profile photo"
                  disabled={updatingProfile}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* User Profile Info Info Column */}
        <div className="flex-1 md:ml-48 mt-4 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display-lg text-headline-lg text-inverse-surface mb-1 font-bold leading-tight">
                {currentUser?.name || "Anonymous User"}
              </h1>
              
              {currentUser?.headline && (
                <p className="text-body-md text-primary font-semibold mb-1">
                  {currentUser.headline}
                </p>
              )}

              {currentUser?.bio && (
                <p className="text-body-sm text-text-muted max-w-xl mb-3 leading-relaxed">
                  {currentUser.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted font-body-sm text-body-sm">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>Joined {formatDate(currentUser?.createdAt)}</span>
                </div>
                {currentUser?.location && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span>{currentUser.location}</span>
                  </div>
                )}
                {currentUser?.institution && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">domain</span>
                    <span>{currentUser.institution}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {isOwnProfile ? (
                <button
                  onClick={onEdit}
                  className="px-6 py-2.5 border border-outline-variant text-inverse-surface font-label-md text-label-md rounded-full hover:bg-surface-container transition-all flex items-center gap-2 w-fit font-bold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {followButton}
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-label-md text-label-md rounded-full hover:opacity-95 transition-all flex items-center gap-2 w-fit font-bold cursor-pointer shadow-md active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
