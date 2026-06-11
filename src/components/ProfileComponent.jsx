import React, { useState, useEffect } from "react";
import ProfileCard from "../common/ProfileCard";
import EditProfile from "../pages/EditProfile";
import PostsProfile from "./PostsProfile";
import FollowButton from "../components/FollowButton";
import Sidebar from "./Sidebar";
import { editUser } from "../api/FireStore";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

export default function ProfileComponent({
  userData,
  isOwnProfile,
  targetUID,
}) {
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Inline editing states for contact info
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editInput, setEditInput] = useState({
    github: "",
    linkedin: "",
    orcid: "",
  });

  // Load user data into edit state
  useEffect(() => {
    if (userData) {
      setEditInput({
        github: userData.github || "",
        linkedin: userData.linkedin || "",
        orcid: userData.orcid || "",
      });
    }
  }, [userData]);

  function onEdit() {
    setShowEditPopup(true);
  }

  const handleFollowStatusChange = (status) => {
    console.log("Follow status changed:", status);
  };

  // URL formatting helper to resolve handle or full URL cleanly
  const formatLinkUrl = (url, type) => {
    if (!url) return "#";
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    
    // Check clean values to prevent prepending domain if already present
    if (type === "github") {
      if (trimmed.includes("github.com/")) {
        return `https://${trimmed}`;
      }
      return `https://github.com/${trimmed}`;
    }
    if (type === "linkedin") {
      if (trimmed.includes("linkedin.com/")) {
        return `https://${trimmed}`;
      }
      return `https://linkedin.com/in/${trimmed}`;
    }
    if (type === "orcid") {
      if (trimmed.includes("orcid.org/")) {
        return `https://${trimmed}`;
      }
      return `https://orcid.org/${trimmed}`;
    }
    return `https://${trimmed}`;
  };

  // Display text helper
  const getLinkDisplay = (url, type, defaultText) => {
    if (!url) return defaultText;
    return url
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "");
  };

  // Asynchronous API integration saving handler
  const handleSaveContactInfo = async (e) => {
    e.preventDefault();

    // Validate ORCID format (16-digit hyphenated structure)
    if (editInput.orcid.trim()) {
      const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
      if (!orcidRegex.test(editInput.orcid.trim())) {
        toast.error("Invalid ORCID format. Must match xxxx-xxxx-xxxx-xxxx");
        return;
      }
    }

    setLoading(true);

    try {
      const contactData = {
        github: editInput.github.trim(),
        linkedin: editInput.linkedin.trim(),
        orcid: editInput.orcid.trim(),
        updatedAt: new Date(),
      };

      // 1. Persist to Firestore
      const dbResult = await editUser(contactData);

      // 2. Dispatch to backend profile configuration endpoint
      let apiSuccess = false;
      try {
        const response = await fetch("/api/user/profile/contact", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactData),
        });
        if (response.ok) {
          apiSuccess = true;
        }
      } catch (apiError) {
        console.warn("Backend REST API PATCH failed, using Firestore persistence:", apiError);
        // Fall back to Firestore db result
        if (dbResult.success) {
          apiSuccess = true;
        }
      }

      if (dbResult.success || apiSuccess) {
        toast.success("Contact information updated successfully!");
        setIsEditing(false);
      } else {
        toast.error("Failed to update contact info: " + (dbResult.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving contact info:", error);
      toast.error("Error saving contact info: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Setup default interests if user hasn't defined any
  const interests = userData?.interests && userData.interests.length > 0
    ? userData.interests
    : ["Software Engineering", "Artificial Intelligence", "Academic Networking"];

  return (
    <div className="min-h-screen bg-bg-base font-body-md text-on-surface">
      {/* Responsive Sidebar component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSettingsClick={onEdit}
      />

      {/* Floating Sidebar Toggle Button for Mobile/Tablet */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-gradient-to-r from-primary to-secondary text-white p-3.5 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Open navigation menu"
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>

      {/* Main Content Layout Container */}
      <main className="lg:ml-64 pt-6 pb-20 px-4 md:px-8 max-w-[1440px] mx-auto">
        
        {/* Profile Header Hero Section */}
        <ProfileCard
          currentUser={userData}
          onEdit={onEdit}
          isOwnProfile={isOwnProfile}
          targetUID={targetUID}
          followButton={
            !isOwnProfile && (
              <FollowButton
                targetUID={targetUID}
                onFollowStatusChange={handleFollowStatusChange}
              />
            )
          }
        />

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (1/3 of page width on desktop) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Contact Information Card */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-label-md text-label-md text-text-muted uppercase tracking-wider font-bold">
                  Contact Information
                </h4>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditInput({
                          github: userData?.github || "",
                          linkedin: userData?.linkedin || "",
                          orcid: userData?.orcid || "",
                        });
                      }
                      setIsEditing(!isEditing);
                    }}
                    className="text-xs text-secondary hover:text-secondary-dark font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">{isEditing ? "close" : "edit"}</span>
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveContactInfo} className="space-y-4">
                  {/* Email (Always read-only) */}
                  {userData?.email && (
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Email (Read Only)</p>
                        <p className="text-body-sm text-on-surface truncate font-medium">{userData.email}</p>
                      </div>
                    </div>
                  )}

                  {/* GitHub Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">
                      GitHub Handle / URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">code</span>
                      </div>
                      <input
                        type="text"
                        value={editInput.github}
                        onChange={(e) => setEditInput({ ...editInput, github: e.target.value })}
                        placeholder="github.com/username or username"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-body-sm bg-slate-50 focus:bg-white text-on-surface"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* LinkedIn Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">
                      LinkedIn Handle / URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                      </div>
                      <input
                        type="text"
                        value={editInput.linkedin}
                        onChange={(e) => setEditInput({ ...editInput, linkedin: e.target.value })}
                        placeholder="linkedin.com/in/username or username"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-body-sm bg-slate-50 focus:bg-white text-on-surface"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* ORCID Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">
                      ORCID iD
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">id_card</span>
                      </div>
                      <input
                        type="text"
                        value={editInput.orcid}
                        onChange={(e) => setEditInput({ ...editInput, orcid: e.target.value })}
                        placeholder="orcid.org/0000-0000-0000-0000 or 16 digits"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-body-sm bg-slate-50 focus:bg-white text-on-surface"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Format: xxxx-xxxx-xxxx-xxxx (e.g. 0000-0002-1825-0097)</p>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditInput({
                          github: userData?.github || "",
                          linkedin: userData?.linkedin || "",
                          orcid: userData?.orcid || "",
                        });
                      }}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-primary hover:bg-primary-light text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Email */}
                  {userData?.email && (
                    <a
                      href={`mailto:${userData.email}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <span className="text-body-sm font-body-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {userData.email}
                      </span>
                    </a>
                  )}

                  {/* GitHub link */}
                  <a
                    href={userData?.github ? formatLinkUrl(userData.github, "github") : undefined}
                    onClick={(e) => {
                      if (!userData?.github) {
                        e.preventDefault();
                        if (isOwnProfile) setIsEditing(true);
                      }
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 group ${
                      !userData?.github && !isOwnProfile ? "opacity-60 pointer-events-none" : "cursor-pointer"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all duration-200">
                      <span className="material-symbols-outlined text-[20px]">code</span>
                    </div>
                    <span className={`text-body-sm font-body-sm transition-colors ${
                      userData?.github
                        ? "text-on-surface group-hover:text-primary font-medium"
                        : "text-text-muted italic group-hover:text-primary"
                    }`}>
                      {userData?.github
                        ? getLinkDisplay(userData.github, "github", "github.com")
                        : isOwnProfile
                        ? "Add GitHub profile"
                        : "Not linked yet"}
                    </span>
                  </a>

                  {/* LinkedIn link */}
                  <a
                    href={userData?.linkedin ? formatLinkUrl(userData.linkedin, "linkedin") : undefined}
                    onClick={(e) => {
                      if (!userData?.linkedin) {
                        e.preventDefault();
                        if (isOwnProfile) setIsEditing(true);
                      }
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 group ${
                      !userData?.linkedin && !isOwnProfile ? "opacity-60 pointer-events-none" : "cursor-pointer"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all duration-200">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <span className={`text-body-sm font-body-sm transition-colors ${
                      userData?.linkedin
                        ? "text-on-surface group-hover:text-primary font-medium"
                        : "text-text-muted italic group-hover:text-primary"
                    }`}>
                      {userData?.linkedin
                        ? getLinkDisplay(userData.linkedin, "linkedin", "linkedin.com")
                        : isOwnProfile
                        ? "Add LinkedIn profile"
                        : "Not linked yet"}
                    </span>
                  </a>

                  {/* ORCID link */}
                  <a
                    href={userData?.orcid ? formatLinkUrl(userData.orcid, "orcid") : undefined}
                    onClick={(e) => {
                      if (!userData?.orcid) {
                        e.preventDefault();
                        if (isOwnProfile) setIsEditing(true);
                      }
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 group ${
                      !userData?.orcid && !isOwnProfile ? "opacity-60 pointer-events-none" : "cursor-pointer"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all duration-200">
                      <span className="material-symbols-outlined text-[20px]">id_card</span>
                    </div>
                    <span className={`text-body-sm font-body-sm transition-colors ${
                      userData?.orcid
                        ? "text-on-surface group-hover:text-primary font-medium"
                        : "text-text-muted italic group-hover:text-primary"
                    }`}>
                      {userData?.orcid
                        ? getLinkDisplay(userData.orcid, "orcid", "orcid.org")
                        : isOwnProfile
                        ? "Add ORCID iD"
                        : "Not linked yet"}
                    </span>
                  </a>
                </div>
              )}
            </div>

            {/* Research Interests Card */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-4 font-bold">
                Research Interests
              </h4>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-bg-subtle text-text-muted rounded-lg text-body-sm font-body-sm hover:text-primary hover:bg-primary/10 cursor-default transition-all duration-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* About Card (Rendered if user has 'about' section to make it scalable and dynamic) */}
            {userData?.about && (
              <div className="glass-card p-6 rounded-2xl">
                <h4 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-3 font-bold">
                  About
                </h4>
                <p className="text-body-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {userData.about}
                </p>
              </div>
            )}

          </div>

          {/* Right Column (2/3 of page width on desktop - embedded PostsProfile) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <PostsProfile
              currentUser={userData}
              targetUID={targetUID}
              isOwnProfile={isOwnProfile}
            />
          </div>

        </div>
      </main>

      {/* Edit Profile Overlay Modal */}
      {showEditPopup && (
        <EditProfile setShowEditPopup={setShowEditPopup} />
      )}
    </div>
  );
}
