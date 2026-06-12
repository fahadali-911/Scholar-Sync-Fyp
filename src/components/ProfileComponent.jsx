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
  
  // States for targeted contact info editing
  const [activeEditField, setActiveEditField] = useState(null); // 'github' | 'linkedin' | 'orcid' | null
  const [editingStyle, setEditingStyle] = useState("inline"); // 'inline' | 'modal'
  const [tempInputVal, setTempInputVal] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync temp input value when active edit field changes
  useEffect(() => {
    if (activeEditField && userData) {
      setTempInputVal(userData[activeEditField] || "");
    } else {
      setTempInputVal("");
    }
  }, [activeEditField, userData]);

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

  // Targeted save handler for individual contact field
  const handleSaveField = async (field, value) => {
    // Validate ORCID format (16-digit hyphenated structure)
    if (field === "orcid" && value.trim()) {
      const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
      if (!orcidRegex.test(value.trim())) {
        toast.error("Invalid ORCID format. Must match xxxx-xxxx-xxxx-xxxx");
        return;
      }
    }

    setLoading(true);

    try {
      const updatedValue = value.trim();
      const contactData = {
        [field]: updatedValue,
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
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
        setActiveEditField(null);
        if (userData) {
          userData[field] = updatedValue;
        }
      } else {
        toast.error("Failed to update: " + (dbResult.error || "Unknown error"));
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
            {/* Contact Information Card */}
            <div className="glass-card p-6 rounded-2xl relative">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100/60">
                <h4 className="font-label-md text-label-md text-text-muted uppercase tracking-wider font-bold">
                  Contact Information
                </h4>
                {isOwnProfile && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-slate-400">Style:</span>
                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEditField(null);
                          setEditingStyle("inline");
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                          editingStyle === "inline"
                            ? "bg-white text-slate-800 shadow-xs border border-slate-200/40"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Inline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEditField(null);
                          setEditingStyle("modal");
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                          editingStyle === "modal"
                            ? "bg-white text-slate-800 shadow-xs border border-slate-200/40"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Modal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Email (Always Read-only) */}
                {userData?.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Email (Read Only)</p>
                      <a
                        href={`mailto:${userData.email}`}
                        className="text-body-sm text-on-surface truncate font-medium hover:text-primary transition-colors block"
                      >
                        {userData.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* GitHub Field */}
                <div className="group flex items-center justify-between min-h-[40px]">
                  {activeEditField === "github" && editingStyle === "inline" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveField("github", tempInputVal);
                      }}
                      className="flex items-center gap-2 w-full animate-in fade-in duration-200"
                    >
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <span className="material-symbols-outlined text-[18px]">code</span>
                        </div>
                        <input
                          type="text"
                          value={tempInputVal}
                          onChange={(e) => setTempInputVal(e.target.value)}
                          placeholder="github.com/username"
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-on-surface transition-all focus:ring-1 focus:ring-secondary focus:border-secondary"
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="submit"
                          disabled={loading}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Save"
                        >
                          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEditField(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95"
                          title="Cancel"
                        >
                          <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <a
                        href={userData?.github ? formatLinkUrl(userData.github, "github") : undefined}
                        onClick={(e) => {
                          if (!userData?.github) {
                            e.preventDefault();
                            if (isOwnProfile) setActiveEditField("github");
                          }
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 group/link ${
                          !userData?.github && !isOwnProfile ? "opacity-60 pointer-events-none" : "cursor-pointer"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover/link:bg-primary group-hover/link:text-white transition-all duration-200">
                          <span className="material-symbols-outlined text-[20px]">code</span>
                        </div>
                        <span className={`text-body-sm font-body-sm transition-colors ${
                          userData?.github
                            ? "text-on-surface group-hover/link:text-primary font-medium"
                            : "text-text-muted italic group-hover/link:text-primary"
                        }`}>
                          {userData?.github
                            ? getLinkDisplay(userData.github, "github", "github.com")
                            : isOwnProfile
                            ? "Add GitHub profile"
                            : "Not linked yet"}
                        </span>
                      </a>
                      {isOwnProfile && userData?.github && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveEditField("github");
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-secondary hover:text-secondary-dark font-bold transition-all duration-200 cursor-pointer flex items-center gap-0.5 ml-2 font-display-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* LinkedIn Field */}
                <div className="group flex items-center justify-between min-h-[40px]">
                  {activeEditField === "linkedin" && editingStyle === "inline" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveField("linkedin", tempInputVal);
                      }}
                      className="flex items-center gap-2 w-full animate-in fade-in duration-200"
                    >
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <span className="material-symbols-outlined text-[18px]">person</span>
                        </div>
                        <input
                          type="text"
                          value={tempInputVal}
                          onChange={(e) => setTempInputVal(e.target.value)}
                          placeholder="linkedin.com/in/username"
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-on-surface transition-all focus:ring-1 focus:ring-secondary focus:border-secondary"
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="submit"
                          disabled={loading}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Save"
                        >
                          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEditField(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95"
                          title="Cancel"
                        >
                          <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <a
                        href={userData?.linkedin ? formatLinkUrl(userData.linkedin, "linkedin") : undefined}
                        onClick={(e) => {
                          if (!userData?.linkedin) {
                            e.preventDefault();
                            if (isOwnProfile) setActiveEditField("linkedin");
                          }
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 group/link ${
                          !userData?.linkedin && !isOwnProfile ? "opacity-60 pointer-events-none" : "cursor-pointer"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover/link:bg-primary group-hover/link:text-white transition-all duration-200">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <span className={`text-body-sm font-body-sm transition-colors ${
                          userData?.linkedin
                            ? "text-on-surface group-hover/link:text-primary font-medium"
                            : "text-text-muted italic group-hover/link:text-primary"
                        }`}>
                          {userData?.linkedin
                            ? getLinkDisplay(userData.linkedin, "linkedin", "linkedin.com")
                            : isOwnProfile
                            ? "Add LinkedIn profile"
                            : "Not linked yet"}
                        </span>
                      </a>
                      {isOwnProfile && userData?.linkedin && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveEditField("linkedin");
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-secondary hover:text-secondary-dark font-bold transition-all duration-200 cursor-pointer flex items-center gap-0.5 ml-2 font-display-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ORCID iD Field */}
                <div className="group flex items-center justify-between min-h-[40px]">
                  {activeEditField === "orcid" && editingStyle === "inline" ? (
                    <div className="w-full">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveField("orcid", tempInputVal);
                        }}
                        className="flex items-center gap-2 w-full animate-in fade-in duration-200"
                      >
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">id_card</span>
                          </div>
                          <input
                            type="text"
                            value={tempInputVal}
                            onChange={(e) => setTempInputVal(e.target.value)}
                            placeholder="orcid.org/0000-0000-0000-0000"
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white text-on-surface transition-all focus:ring-1 focus:ring-secondary focus:border-secondary"
                            disabled={loading}
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="submit"
                            disabled={loading}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Save"
                          >
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveEditField(null)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95"
                            title="Cancel"
                          >
                            <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                          </button>
                        </div>
                      </form>
                      <p className="text-[9px] text-slate-400 mt-1 pl-8">Format: xxxx-xxxx-xxxx-xxxx (e.g. 0000-0002-1825-0097)</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <a
                        href={userData?.orcid ? formatLinkUrl(userData.orcid, "orcid") : undefined}
                        onClick={(e) => {
                          if (!userData?.orcid) {
                            e.preventDefault();
                            if (isOwnProfile) setActiveEditField("orcid");
                          }
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 group/link ${
                          !userData?.orcid && !isOwnProfile ? "opacity-60 pointer-events-none" : "cursor-pointer"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover/link:bg-primary group-hover/link:text-white transition-all duration-200">
                          <span className="material-symbols-outlined text-[20px]">id_card</span>
                        </div>
                        <span className={`text-body-sm font-body-sm transition-colors ${
                          userData?.orcid
                            ? "text-on-surface group-hover/link:text-primary font-medium"
                            : "text-text-muted italic group-hover/link:text-primary"
                        }`}>
                          {userData?.orcid
                            ? getLinkDisplay(userData.orcid, "orcid", "orcid.org")
                            : isOwnProfile
                            ? "Add ORCID iD"
                            : "Not linked yet"}
                        </span>
                      </a>
                      {isOwnProfile && userData?.orcid && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveEditField("orcid");
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-secondary hover:text-secondary-dark font-bold transition-all duration-200 cursor-pointer flex items-center gap-0.5 ml-2 font-display-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
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

      {/* Targeted Contextual Modal (Approach B) */}
      {activeEditField && editingStyle === "modal" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  {activeEditField === "github"
                    ? "code"
                    : activeEditField === "linkedin"
                    ? "person"
                    : "id_card"}
                </span>
                Edit {activeEditField === "github"
                  ? "GitHub Profile"
                  : activeEditField === "linkedin"
                  ? "LinkedIn Profile"
                  : "ORCID iD"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveEditField(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveField(activeEditField, tempInputVal);
              }}
            >
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {activeEditField === "github"
                      ? "GitHub Username or URL"
                      : activeEditField === "linkedin"
                      ? "LinkedIn Username or URL"
                      : "ORCID iD (xxxx-xxxx-xxxx-xxxx)"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">
                        {activeEditField === "github"
                          ? "code"
                          : activeEditField === "linkedin"
                          ? "person"
                          : "id_card"}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={tempInputVal}
                      onChange={(e) => setTempInputVal(e.target.value)}
                      placeholder={
                        activeEditField === "github"
                          ? "github.com/username"
                          : activeEditField === "linkedin"
                          ? "linkedin.com/in/username"
                          : "orcid.org/0000-0000-0000-0000"
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-slate-50 focus:bg-white text-slate-800 transition-all focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-medium"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  {activeEditField === "orcid" && (
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                      Format: xxxx-xxxx-xxxx-xxxx (e.g. 0000-0002-1825-0097)
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveEditField(null)}
                  disabled={loading}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#0B192C] hover:bg-[#14263f] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
