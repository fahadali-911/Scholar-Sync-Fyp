import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Mail,
  Briefcase,
  FileText,
  MapPin,
  Loader,
} from "lucide-react";
import { editUser, getUser, updateUserNameInPosts } from "../api/FireStore";
import { auth } from "../firebaseConfig";

const EditProfile = ({ setShowEditPopup }) => {
  const [editInput, setEditInput] = useState({
    name: "",
    headline: "",
    bio: "",
    about: "",
    location: "",
    institution: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user data
  useEffect(() => {
    const unsubscribe = getUser(setCurrentUser);
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Populate form with current user data
  useEffect(() => {
    if (currentUser) {
      setEditInput({
        name: currentUser.name || "",
        headline: currentUser.headline || "",
        bio: currentUser.bio || "",
        about: currentUser.about || "",
        location: currentUser.location || "",
        institution: currentUser.institution || "",
        website: currentUser.website || "",
      });
    }
  }, [currentUser]);

  const editInputChange = (e) => {
    const { name, value } = e.target;
    setEditInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateUser = async (e) => {
    e.preventDefault();

    // Check if at least one field is filled
    const hasContent = Object.values(editInput).some((value) => value.trim());
    if (!hasContent) {
      setSaveStatus("error");
      return;
    }

    setLoading(true);
    setSaveStatus(null);

    try {
      const oldName = currentUser?.name;
      const newName = editInput.name;
      const userEmail = currentUser?.email || auth.currentUser?.email;

      // Update user profile
      const result = await editUser(editInput);

      if (result.success) {
        // If name changed, update all posts with the new name
        if (oldName !== newName && newName && userEmail) {
          await updateUserNameInPosts(newName, userEmail);
        }

        setSaveStatus("success");

        // Close popup after 1.5 seconds
        setTimeout(() => {
          setShowEditPopup(false);
        }, 1500);
      } else {
        setSaveStatus("error");
        console.error("Failed to update profile:", result.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowEditPopup(false);
  };

  return (
    // Full screen overlay with proper z-index
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden my-4">
        {/* Header - Always visible */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <User className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" />
            Edit Profile
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white hover:bg-opacity-70 rounded-full transition-colors z-20"
            disabled={loading}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 hover:text-gray-800" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          <form onSubmit={updateUser} className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    onChange={editInputChange}
                    name="name"
                    type="text"
                    value={editInput.name}
                    placeholder="Enter your full name"
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Field (Read Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="email"
                    value={currentUser?.email || auth.currentUser?.email || ""}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Headline Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    onChange={editInputChange}
                    name="headline"
                    type="text"
                    value={editInput.headline}
                    placeholder="e.g., PhD Student, Research Assistant"
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Institution and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      onChange={editInputChange}
                      name="institution"
                      type="text"
                      value={editInput.institution}
                      placeholder="University or Organization"
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    onChange={editInputChange}
                    name="location"
                    type="text"
                    value={editInput.location}
                    placeholder="City, Country"
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  onChange={editInputChange}
                  name="website"
                  type="url"
                  value={editInput.website}
                  placeholder="https://your-website.com"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Bio
                </label>
                <textarea
                  onChange={editInputChange}
                  name="bio"
                  value={editInput.bio}
                  placeholder="A brief description about yourself (1-2 sentences)"
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm sm:text-base"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editInput.bio.length}/200 characters
                </p>
              </div>

              {/* About Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About
                </label>
                <textarea
                  onChange={editInputChange}
                  name="about"
                  value={editInput.about}
                  placeholder="Tell us more about your research interests, background, and academic journey..."
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm sm:text-base"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editInput.about.length}/1000 characters
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Always visible */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 gap-3 sm:gap-0">
          {/* Status Messages */}
          <div className="flex items-center order-2 sm:order-1">
            {saveStatus === "success" && (
              <div className="flex items-center text-green-600 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2 flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                Profile updated successfully!
              </div>
            )}
            {saveStatus === "error" && (
              <div className="flex items-center text-red-600 text-sm">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2 flex items-center justify-center">
                  <X className="w-2 h-2 text-white" />
                </div>
                Please fill at least one field.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={updateUser}
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
