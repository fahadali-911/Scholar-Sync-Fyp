import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "../firebaseConfig";
import {
  getStatus,
  getUser,
  toggleLike,
  getUserDataByUID,
  toggleLikeWithNotification,
} from "../api/FireStore";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Plus,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Code,
  Loader2,
} from "lucide-react";
import CreatePost from "../pages/CreatePost";
import LikesModal from "../components/LikesModal";
import { useNavigate } from "react-router-dom";
import CommentsModal from "../components/CommentsModal";

const Homefeed = ({ currUser }) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState({});
  const [posts, setPosts] = useState([]);
  const [likesModal, setLikesModal] = useState({
    isOpen: false,
    postId: null,
    totalLikes: 0,
  });
  const [commentsModal, setCommentsModal] = useState({
    isOpen: false,
    postId: null,
    postTitle: "",
    totalComments: 0,
  });

  const [userProfiles, setUserProfiles] = useState({});
  const [likingStates, setLikingStates] = useState({});
  const navigate = useNavigate();

  // Set up real-time listener for current user data
  useEffect(() => {
    getUser(setUserData);
  }, []);

  // Set up real-time listener for posts
  useMemo(() => {
    getStatus(setPosts);
  }, []);

  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const loadUserProfiles = async () => {
      console.log("Loading user profiles for posts...");
      const profilesMap = { ...userProfiles };

      // Get all unique user IDs from posts
      const userIds = posts
        .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
        .filter((id) => id && !profilesMap[id]); // Only load profiles we don't have

      const uniqueUserIds = [...new Set(userIds)];

      if (uniqueUserIds.length === 0) {
        console.log("No new user profiles to load");
        return;
      }

      console.log("Loading profiles for users:", uniqueUserIds);

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
      // Skip if we already have a listener for this user
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
  }, [posts]); // Re-setup listeners when posts change

  const [userStats] = useState([
    { number: 3, label: "Papers" },
    { number: 127, label: "Followers" },
    { number: 89, label: "Following" },
    { number: 24, label: "Discussions" },
  ]);

  // ENHANCED: Generate consistent initials
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

  const getCurrentUserProfile = (post) => {
    const userId = post.currUser?.uid || post.currUser?.id || post.authorId;
    return userProfiles[userId] || post.currUser || {};
  };

  const getProfileImageURL = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return null;

    // Priority: real-time data > original post data
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

  // ENHANCED: Get user display name with real-time data
  const getUserDisplayName = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return "Anonymous";

    // Priority: real-time data > original post data
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
              key={`profile-${userId}-${profileImageURL}-${
                currentProfile.updatedAt || Date.now()
              }`} // Force refresh with unique key
              src={profileImageURL}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
              onLoad={(e) => {
                // Hide initials when image loads successfully
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
                // Show initials when image fails to load
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
            {/* Initials fallback - always rendered but hidden by default when image exists */}
            <div
              className={`initials-fallback absolute inset-0 w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
              style={{ display: "none" }}
            >
              {getProfileInitials(displayName)}
            </div>
          </>
        ) : (
          // No image URL - show initials directly
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
          >
            {getProfileInitials(displayName)}
          </div>
        )}
      </div>
    );
  };

  const handleLike = async (postId) => {
    if (!auth.currentUser) {
      alert("Please log in to like posts");
      return;
    }

    // Prevent multiple simultaneous like requests for the same post
    if (likingStates[postId]) return;

    setLikingStates((prev) => ({ ...prev, [postId]: true }));

    try {
      // Use the enhanced toggleLike function that includes notifications
      const result = await toggleLikeWithNotification(postId);

      if (result.success) {
        console.log("Like toggled successfully with notification");
      } else {
        console.error("Failed to toggle like:", result.error);
        alert("Failed to update like. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLikingStates((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleLikesClick = (postId, totalLikes) => {
    if (totalLikes > 0) {
      setLikesModal({ isOpen: true, postId, totalLikes });
    }
  };

  const closeLikesModal = () => {
    setLikesModal({ isOpen: false, postId: null, totalLikes: 0 });
  };

  const handleCommentsClick = (post) => {
    setCommentsModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title || post.status,
      totalComments: post.comments || 0,
    });
  };
  const handleShare = (post) => {
    // Basic share functionality
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };
  const closeCommentsModal = () => {
    setCommentsModal({
      isOpen: false,
      postId: null,
      postTitle: "",
      totalComments: 0,
    });
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "papers")
      return (
        post.type === "research-paper" ||
        post.postType === "research-paper" ||
        post.type === "research" ||
        post.postType === "research"
      );
    if (activeFilter === "discussions")
      return post.type === "discussion" || post.postType === "discussion";

    return true;
  });

  const getPostTypeStyle = (type) => {
    switch (type) {
      case "research-paper":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "discussion":
        return "bg-red-50 text-red-600 border-red-200";
      case "project":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getPostTypeLabel = (type) => {
    switch (type) {
      case "research-paper":
        return "Research Paper";
      case "discussion":
        return "Discussion";
      case "research":
        return "Research";
      case "project":
        return "Project";
      default:
        return "Post";
    }
  };
  function handleFilePreview(post) {
    const fileType = post.fileType?.toLowerCase() || "";
    const fileName = post.fileName || "";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

    // Check if it's an image (can be previewed directly)
    if (
      fileType.includes("image") ||
      ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(
        fileExtension
      )
    ) {
      window.open(post.fileURL, "_blank");
      return;
    }

    // Check if it's a PDF (can be previewed directly)
    if (fileType === "pdf" || fileExtension === "pdf") {
      window.open(post.fileURL, "_blank");
      return;
    }

    // For DOCX and other Office documents, use Google Docs Viewer
    if (
      fileType === "docx" ||
      fileExtension === "docx" ||
      fileType.includes("word") ||
      fileType.includes("document") ||
      fileExtension === "doc" ||
      fileExtension === "ppt" ||
      fileExtension === "pptx"
    ) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        post.fileURL
      )}&embedded=true`;
      window.open(viewerUrl, "_blank");
      return;
    }

    // For other file types, try to open directly
    window.open(post.fileURL, "_blank");
  }

  const handleProfileClick = (post) => {
    const userId = post.currUser?.id || post.currUser?.uid;
    if (userId === auth.currentUser?.uid) {
      navigate("/my-profile");
    } else if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  // Check if current user liked a post
  const isPostLikedByCurrentUser = (post) => {
    if (!auth.currentUser || !post.likedBy) return false;
    return post.likedBy.some((like) => like.uid === auth.currentUser.uid);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div>
          {/* Main Feed */}
          {isOpen && (
            <CreatePost
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              currUser={userData || currUser}
            />
          )}

          {/* Likes Modal */}
          <LikesModal
            isOpen={likesModal.isOpen}
            onClose={closeLikesModal}
            postId={likesModal.postId}
            totalLikes={likesModal.totalLikes}
          />

          {/* Comments Modal */}
          <CommentsModal
            isOpen={commentsModal.isOpen}
            onClose={closeCommentsModal}
            postId={commentsModal.postId}
            postTitle={commentsModal.postTitle}
            totalComments={commentsModal.totalComments}
          />

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6 mb-6 sm:mb-8">
            {/* Feed Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Academic Feed
              </h1>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "papers", label: "Papers" },
                  { key: "discussions", label: "Discussions" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key)}
                    className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                      activeFilter === tab.key
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform -translate-y-0.5"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4 sm:space-y-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-500">
                    Be the first to share something!
                  </p>
                </div>
              ) : (
                filteredPosts.map((post, index) => {
                  const currentProfile = getCurrentUserProfile(post);
                  const profileImageURL = getProfileImageURL(post);
                  const displayName = getUserDisplayName(post);

                  return (
                    <div
                      key={`post-${post.id}-${
                        currentProfile.updatedAt || index
                      }`} // Dynamic key based on profile updates
                      className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {/* ENHANCED: Real-time Profile Avatar */}
                          <UserAvatar
                            post={post}
                            size="lg"
                            onClick={() => handleProfileClick(post)}
                          />

                          <div>
                            <button
                              onClick={() => handleProfileClick(post)}
                              className="font-semibold cursor-pointer hover:text-blue-500 hover:underline text-gray-900 transition-colors"
                            >
                              {displayName}
                            </button>
                            <p className="text-sm text-gray-500">
                              {post.timeStamp
                                ? new Date(
                                    post.timeStamp.seconds * 1000
                                  ).toLocaleDateString()
                                : post.time || "Recently"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getPostTypeStyle(
                            post.postType || post.type
                          )}`}
                        >
                          {getPostTypeLabel(post.postType || post.type)}
                        </span>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                          {post.title || post.status}
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                          {post.description || post.excerpt || post.status}
                        </p>
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 cursor-pointer transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* File Preview */}
                      {post.fileURL && (
                        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-lg sm:text-xl">
                                {post.fileType === "pdf"
                                  ? "📄"
                                  : post.fileType?.includes("image") ||
                                    [
                                      "jpg",
                                      "jpeg",
                                      "png",
                                      "gif",
                                      "bmp",
                                      "webp",
                                      "svg",
                                    ].includes(
                                      post.fileName
                                        ?.split(".")
                                        .pop()
                                        ?.toLowerCase()
                                    )
                                  ? "🖼️"
                                  : "📎"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                {post.fileName || "Attached file"}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {post.fileType
                                  ? post.fileType.toUpperCase()
                                  : "File"}{" "}
                                • Click to view
                              </p>
                            </div>

                            {/* Check if it's an image */}
                            {post.fileType?.includes("image") ||
                            [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "bmp",
                              "webp",
                              "svg",
                            ].includes(
                              post.fileName?.split(".").pop()?.toLowerCase()
                            ) ? (
                              // For images: only show preview button
                              <button
                                onClick={() => handleFilePreview(post)}
                                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-md text-xs sm:text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                              >
                                Preview
                              </button>
                            ) : (
                              // For non-images: show both preview and download buttons
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleFilePreview(post)}
                                  className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-md text-xs sm:text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                                >
                                  Preview
                                </button>
                                <button
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = post.fileURL;
                                    link.download = post.fileName || "download";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded-md text-xs sm:text-sm hover:bg-green-700 transition-colors flex-shrink-0"
                                >
                                  Download
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Post Actions */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-50 gap-4">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleLike(post.id)}
                            disabled={likingStates[post.id]}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                              isPostLikedByCurrentUser(post)
                                ? "bg-red-500 text-white shadow-lg"
                                : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600"
                            } ${
                              likingStates[post.id]
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {likingStates[post.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Heart
                                className={`w-4 h-4 ${
                                  isPostLikedByCurrentUser(post)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikesClick(post.id, post.likes || 0);
                              }}
                              className="hover:underline"
                              disabled={likingStates[post.id]}
                            >
                              Like ({post.likes || 0})
                            </button>
                          </button>
                          <button
                            onClick={() => handleCommentsClick(post)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Comment ({post.comments || 0})</span>
                          </button>
                          <button
                            onClick={() => handleShare(post)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all duration-300"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                        </div>
                        {(post.postType === "research-paper" ||
                          post.type === "research-paper") &&
                          post.fileURL &&
                          // Check if it's an image
                          (post.fileType?.includes("image") ||
                          [
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                            "bmp",
                            "webp",
                            "svg",
                          ].includes(
                            post.fileName?.split(".").pop()?.toLowerCase()
                          ) ? (
                            // For images: only show preview button
                            <button
                              onClick={() => handleFilePreview(post)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview</span>
                            </button>
                          ) : (
                            // For non-images: show both preview and download buttons
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFilePreview(post)}
                                className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Preview</span>
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = post.fileURL;
                                  link.download = post.fileName || "download";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-all duration-300"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          ))}
                        {(post.postType === "project" ||
                          post.type === "project") && (
                          <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-all duration-300">
                            <Eye className="w-4 h-4" />
                            <span>View Project</span>
                          </button>
                        )}
                      </div>

                      {/* Engagement Info */}
                      {post.likedBy && post.likedBy.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <button
                            onClick={() =>
                              handleLikesClick(post.id, post.likes || 0)
                            }
                            className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                          >
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
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
        </div>
      </div>

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r cursor-pointer from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
};

export default Homefeed;
