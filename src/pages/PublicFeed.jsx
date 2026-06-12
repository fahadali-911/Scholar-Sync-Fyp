import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebaseConfig";
import { getStatus, getUserDataByUID } from "../api/FireStore";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Heart,
  MessageCircle,
  Download,
  Eye,
  Users,
  TrendingUp,
  UserPlus,
  LogIn,
  Loader2,
  FileText,
  Award,
  Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScholarSyncLogo from "../components/ScholarSyncLogo";
import PublicNavbar from "../common/PublicNavbar";

const PublicFeed = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [posts, setPosts] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set up real-time listener for posts
  useMemo(() => {
    getStatus(setPosts);
    setLoading(false);
  }, []);

  // Load user profiles for all post authors when posts change
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const loadUserProfiles = async () => {
      console.log("Loading user profiles for posts...");
      const profilesMap = { ...userProfiles };

      // Get all unique user IDs from posts
      const userIds = posts
        .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
        .filter((id) => id && !profilesMap[id]);

      const uniqueUserIds = [...new Set(userIds)];

      if (uniqueUserIds.length === 0) {
        console.log("No new user profiles to load");
        return;
      }

      console.log("Loading profiles for users:", uniqueUserIds);

      // Load profile data for each user
      const profilePromises = uniqueUserIds.map(async (userId) => {
        try {
          const profileData = await getUserDataByUID(userId);
          if (profileData) {
            profilesMap[userId] = profileData;
          }
        } catch (error) {
          console.error(`Error loading profile for ${userId}:`, error);
        }
      });

      await Promise.all(profilePromises);
      console.log("Loaded user profiles:", profilesMap);
      setUserProfiles(profilesMap);
    };

    loadUserProfiles();
  }, [posts]);

  // Set up real-time listeners for user profiles that appear in posts
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const userIds = posts
      .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
      .filter((id) => id);

    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) return;

    console.log("Setting up real-time profile listeners for:", uniqueUserIds);

    const unsubscribes = [];

    // Set up individual listeners for each user
    uniqueUserIds.forEach((userId) => {
      if (!userId) return;

      const userRef = doc(db, "users", userId);

      const unsubscribe = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = { id: docSnap.id, ...docSnap.data() };
            console.log(`Profile updated for user ${userId}:`, userData);

            setUserProfiles((prev) => ({
              ...prev,
              [userId]: userData,
            }));
          } else {
            console.log(`User profile not found for: ${userId}`);
            setUserProfiles((prev) => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
            });
          }
        },
        (error) => {
          console.error(
            `Error in real-time profile listener for ${userId}:`,
            error
          );
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      console.log(
        "Cleaning up profile listeners for",
        uniqueUserIds.length,
        "users"
      );
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [posts]);

  // Generate consistent initials
  const getProfileInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get current profile data for a user
  const getCurrentUserProfile = (post) => {
    const userId = post.currUser?.uid || post.currUser?.id || post.authorId;
    return userProfiles[userId] || post.currUser || {};
  };

  // Get profile image URL with real-time data
  const getProfileImageURL = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return null;

    return (
      currentProfile.photoURL ||
      currentProfile.profilePicture ||
      currentProfile.avatar ||
      currentProfile.image ||
      post.currUser?.photoURL ||
      post.currUser?.profilePicture ||
      null
    );
  };

  // Get user display name with real-time data
  const getUserDisplayName = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return "Anonymous";

    return (
      currentProfile.name ||
      currentProfile.displayName ||
      currentProfile.fullName ||
      post.currUser?.name ||
      post.author ||
      (currentProfile.email && currentProfile.email.split("@")[0]) ||
      (post.currUser?.email && post.currUser.email.split("@")[0]) ||
      "Anonymous"
    );
  };

  // Generate consistent gradient colors
  const getConsistentGradient = (identifier) => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-blue-600",
      "from-purple-500 to-pink-600",
      "from-yellow-500 to-red-600",
      "from-indigo-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
    ];

    if (!identifier) return gradients[0];

    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // UserAvatar component for posts
  const UserAvatar = ({ post, size = "lg", onClick }) => {
    const currentProfile = getCurrentUserProfile(post);
    const profileImageURL = getProfileImageURL(post);
    const displayName = getUserDisplayName(post);
    const userId =
      post.currUser?.uid || post.currUser?.id || post.authorId || post.id;

    // Size classes
    const sizeClasses = {
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    const sizeClass = sizeClasses[size] || sizeClasses.lg;
    const gradient = getConsistentGradient(userId || displayName);

    return (
      <div
        onClick={onClick}
        className={`${sizeClass} rounded-full overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-blue-200 flex-shrink-0 relative`}
      >
        {profileImageURL ? (
          <>
            <img
              key={`profile-${userId}-${profileImageURL}-${currentProfile.updatedAt || Date.now()
                }`}
              src={profileImageURL}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
              onLoad={(e) => {
                const initialsDiv = e.target.nextElementSibling;
                if (
                  initialsDiv &&
                  initialsDiv.classList.contains("initials-fallback")
                ) {
                  initialsDiv.style.display = "none";
                }
                console.log("Profile image loaded for:", displayName);
              }}
              onError={(e) => {
                console.log("Profile image failed to load for:", displayName);
                e.target.style.display = "none";
                const initialsDiv = e.target.nextElementSibling;
                if (
                  initialsDiv &&
                  initialsDiv.classList.contains("initials-fallback")
                ) {
                  initialsDiv.style.display = "flex";
                }
              }}
            />
            <div
              className={`initials-fallback absolute inset-0 w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
              style={{ display: "none" }}
            >
              {getProfileInitials(displayName)}
            </div>
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
          >
            {getProfileInitials(displayName)}
          </div>
        )}
      </div>
    );
  };

  // Handle interactions that require authentication
  const handleAuthRequired = (action) => {
    const actionMessages = {
      like: "Please sign up or log in to like posts",
      comment: "Please sign up or log in to comment on posts",
      profile: "Please sign up or log in to view user profiles",
      download: "Please sign up or log in to download files",
    };

    if (
      window.confirm(
        `${actionMessages[action]}. Would you like to sign up now?`
      )
    ) {
      navigate("/register");
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "papers")
      return (
        post.type === "research-paper" || post.postType === "research-paper"
      );
    if (activeFilter === "discussions")
      return post.type === "discussion" || post.postType === "discussion";
    if (activeFilter === "projects")
      return post.type === "project" || post.postType === "project";
    return true;
  });

  const getPostTypeStyle = (type) => {
    switch (type) {
      case "research-paper":
        return "bg-blue-50/70 text-blue-600 border-blue-100/80";
      case "discussion":
        return "bg-red-50/80 text-red-600 border-red-100";
      case "project":
        return "bg-amber-50/70 text-amber-600 border-amber-100/80";
      default:
        return "bg-slate-50/70 text-slate-600 border-slate-100/80";
    }
  };

  const getPostTypeLabel = (type) => {
    switch (type) {
      case "research-paper":
        return "Research Paper";
      case "discussion":
        return "Discussion";
      case "project":
        return "Project";
      default:
        return "Post";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Scholar Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <PublicNavbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 py-20 sm:py-24 border-b border-slate-100/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight mb-6 leading-tight font-display-lg">
            Discover Academic <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent">
              Research & Collaboration
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-body-md font-medium">
            Join thousands of researchers, students, and academics sharing
            knowledge, collaborating on projects, and advancing science
            together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3.5 bg-primary hover:bg-primary-light text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
            >
              Join Scholar Sync
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3.5 border border-slate-200 text-slate-700 rounded-full font-semibold hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
            >
              Log In
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}

      {/* Main Feed */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Feed Header */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  Latest Research & Discussions
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  Explore what the academic community is sharing
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
                {[
                  { key: "all", label: "All" },
                  { key: "papers", label: "Papers" },
                  { key: "discussions", label: "Discussions" },
                  { key: "projects", label: "Projects" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeFilter === tab.key
                        ? "bg-[#0B192C] text-white shadow-sm"
                        : "bg-transparent text-slate-500 border border-slate-200 hover:text-[#0B192C] hover:border-slate-300 hover:bg-slate-100/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)]">
                <div className="text-4xl mb-4">🔬</div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No posts yet
                </h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Be the first to share your research with the community!
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="px-6 py-2.5 bg-[#0B192C] hover:bg-[#14263f] text-white rounded-full font-semibold shadow-sm hover:shadow transition-all duration-200 cursor-pointer text-sm"
                >
                  Join Now
                </button>
              </div>
            ) : (
              filteredPosts.map((post, index) => {
                const currentProfile = getCurrentUserProfile(post);
                const displayName = getUserDisplayName(post);

                return (
                  <article
                    key={`post-${post.id}-${currentProfile.updatedAt || index}`}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-4">
                        <UserAvatar
                          post={post}
                          size="lg"
                          onClick={() => handleAuthRequired("profile")}
                        />
                        <div>
                          <button
                            onClick={() => handleAuthRequired("profile")}
                            className="font-semibold cursor-pointer hover:text-[#00A6FB] text-slate-900 transition-colors text-left"
                          >
                            {displayName}
                          </button>
                          <p className="text-xs text-slate-400">
                            {post.timeStamp
                              ? new Date(
                                  post.timeStamp.seconds * 1000
                                ).toLocaleDateString()
                              : post.time || "Recently"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPostTypeStyle(
                          post.postType || post.type
                        )}`}
                      >
                        {getPostTypeLabel(post.postType || post.type)}
                      </span>
                    </div>

                    {/* Post Content */}
                    <div className="mb-5">
                      <h4 className="text-xl font-semibold text-slate-900 mb-2.5 leading-snug">
                        {post.title || post.status}
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {post.description || post.excerpt || post.status}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {post.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200/60 rounded-full text-xs font-medium hover:border-[#00A6FB] hover:text-[#00A6FB] transition-colors cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* File Preview (Attachment Component) */}
                    {post.fileURL && (
                      <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {post.fileName || "Attached file"}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {post.fileType
                                ? post.fileType.toUpperCase()
                                : "File"}{" "}
                              • Public document
                            </p>
                          </div>
                          <button
                            onClick={() => handleAuthRequired("download")}
                            className="px-4 py-1.5 bg-[#0B192C] hover:bg-[#14263f] text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 flex-shrink-0 cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-slate-100 gap-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAuthRequired("like")}
                          className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all duration-200 cursor-pointer"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Like ({post.likes || 0})</span>
                        </button>
                        <button
                          onClick={() => handleAuthRequired("comment")}
                          className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-[#00A6FB] hover:bg-sky-50/50 transition-all duration-200 cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Comment ({post.comments || 0})</span>
                        </button>
                      </div>

                      {(post.postType === "research-paper" ||
                        post.type === "research-paper") &&
                        post.fileURL && (
                          <button
                            onClick={() => handleAuthRequired("download")}
                            className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0B192C] hover:bg-[#14263f] text-white hover:shadow transition-all duration-200 cursor-pointer w-full sm:w-auto justify-center"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </button>
                        )}

                      {(post.postType === "project" ||
                        post.type === "project") && (
                          <button
                            onClick={() => handleAuthRequired("profile")}
                            className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#00A6FB] hover:bg-[#0086cc] text-white hover:shadow transition-all duration-200 cursor-pointer w-full sm:w-auto justify-center"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Project</span>
                          </button>
                        )}
                    </div>

                    {/* Show likes info without links for public users */}
                    {post.likedBy && post.likedBy.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-50">
                        <p className="text-xs text-slate-400 font-medium">
                          {post.likedBy.length === 1
                            ? `Liked by ${
                                post.likedBy[0].name ||
                                post.likedBy[0].email?.split("@")[0] ||
                                "someone"
                              }`
                            : post.likedBy.length === 2
                            ? `Liked by ${
                                post.likedBy[0].name ||
                                post.likedBy[0].email?.split("@")[0] ||
                                "someone"
                              } and ${
                                post.likedBy[1].name ||
                                post.likedBy[1].email?.split("@")[0] ||
                                "1 other"
                              }`
                            : `Liked by ${
                                post.likedBy[0].name ||
                                post.likedBy[0].email?.split("@")[0] ||
                                "someone"
                              } and ${post.likedBy.length - 1} others`}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-primary to-primary-dark py-20 border-t border-slate-900/40 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-[0.03]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight font-display-lg">
            Ready to Join the Community?
          </h3>
          <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed font-body-md font-medium">
            Connect with researchers worldwide, share your work, and collaborate
            on groundbreaking projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3.5 bg-white text-primary rounded-full font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
            >
              Sign Up Free
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3.5 border border-slate-700 text-white rounded-full font-semibold hover:bg-white/5 hover:border-slate-500 transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFeed;
