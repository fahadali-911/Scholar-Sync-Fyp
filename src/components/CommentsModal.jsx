import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MessageCircle,
  Heart,
  Send,
  Loader2,
  MoreHorizontal,
  Edit3,
  Trash2,
  Reply,
} from "lucide-react";
import {
  addCommentWithNotification,
  addComment,
  getPostComments,
  toggleCommentLike,
  deleteComment,
  editComment,
  addReply,
  toggleReplyLike,
  deleteReply,
  editReply,
} from "../api/FireStore";
import { auth } from "../firebaseConfig";
import { getUserDataByUID } from "../api/FireStore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
const CommentsModal = ({
  isOpen,
  onClose,
  postId,
  postTitle,
  totalComments,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [showDropdown, setShowDropdown] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");
  const textareaRef = useRef(null);
  const [userProfiles, setUserProfiles] = useState({});
  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);
  // FIND THE FIRST useEffect (that fetches comments)
  // ADD THIS NEW useEffect RIGHT AFTER IT:

  // NEW: Load user profiles for comment authors
  useEffect(() => {
    if (!comments || comments.length === 0) return;

    const loadUserProfiles = async () => {
      console.log("Loading user profiles for comments...");
      const profilesMap = { ...userProfiles };

      // Get user IDs from comments and replies
      const userIds = [];
      comments.forEach((comment) => {
        if (comment.uid && !profilesMap[comment.uid]) {
          userIds.push(comment.uid);
        }
        if (comment.replies) {
          comment.replies.forEach((reply) => {
            if (reply.uid && !profilesMap[reply.uid]) {
              userIds.push(reply.uid);
            }
          });
        }
      });

      const uniqueUserIds = [...new Set(userIds)];
      if (uniqueUserIds.length === 0) return;

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
      setUserProfiles(profilesMap);
    };

    loadUserProfiles();
  }, [comments]);

  // NEW: Set up real-time listeners for comment user profiles
  useEffect(() => {
    if (!comments || comments.length === 0) return;

    const userIds = [];
    comments.forEach((comment) => {
      if (comment.uid) userIds.push(comment.uid);
      if (comment.replies) {
        comment.replies.forEach((reply) => {
          if (reply.uid) userIds.push(reply.uid);
        });
      }
    });

    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) return;

    const unsubscribes = [];

    uniqueUserIds.forEach((userId) => {
      if (!userId) return;

      const userRef = doc(db, "users", userId);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() };
          setUserProfiles((prev) => ({
            ...prev,
            [userId]: userData,
          }));
        }
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [comments]);
  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPostComments(postId);
      if (result.success) {
        setComments(result.comments || []);
      } else {
        setError(result.error || "Failed to load comments");
      }
    } catch (err) {
      setError("An error occurred while loading comments");
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    if (!auth.currentUser) {
      alert("Please log in to comment");
      return;
    }

    setSubmitting(true);

    try {
      const result = await addCommentWithNotification(postId, newComment);
      if (result.success) {
        setNewComment("");
        await fetchComments(); // Refresh comments

        // Scroll to bottom to show new comment
        setTimeout(() => {
          const container = document.querySelector(".comments-container");
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      } else {
        alert(result.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("An error occurred while adding comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!auth.currentUser) {
      alert("Please log in to like comments");
      return;
    }

    try {
      const result = await toggleCommentLike(postId, commentId);
      if (result.success) {
        await fetchComments(); // Refresh comments to show updated likes
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const result = await deleteComment(postId, commentId);
      if (result.success) {
        await fetchComments(); // Refresh comments
        setShowDropdown(null);
      } else {
        alert(result.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("An error occurred while deleting comment");
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const result = await editComment(postId, commentId, editText);
      if (result.success) {
        setEditingComment(null);
        setEditText("");
        await fetchComments(); // Refresh comments
      } else {
        alert(result.error || "Failed to edit comment");
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      alert("An error occurred while editing comment");
    }
  };

  const handleAddReply = async (commentId) => {
    if (!replyText.trim() || submitting) return;

    if (!auth.currentUser) {
      alert("Please log in to reply");
      return;
    }

    setSubmitting(true);

    try {
      const result = await addReply(postId, commentId, replyText);
      if (result.success) {
        setReplyText("");
        setReplyingTo(null);
        await fetchComments(); // Refresh comments
      } else {
        alert(result.error || "Failed to add reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("An error occurred while adding reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReply = async (commentId, replyId) => {
    if (!auth.currentUser) {
      alert("Please log in to like replies");
      return;
    }

    try {
      const result = await toggleReplyLike(postId, commentId, replyId);
      if (result.success) {
        await fetchComments(); // Refresh comments to show updated likes
      }
    } catch (error) {
      console.error("Error liking reply:", error);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
      const result = await deleteReply(postId, commentId, replyId);
      if (result.success) {
        await fetchComments(); // Refresh comments
        setShowDropdown(null);
      } else {
        alert(result.error || "Failed to delete reply");
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("An error occurred while deleting reply");
    }
  };

  const handleEditReply = async (commentId, replyId) => {
    if (!editReplyText.trim()) return;

    try {
      const result = await editReply(postId, commentId, replyId, editReplyText);
      if (result.success) {
        setEditingReply(null);
        setEditReplyText("");
        await fetchComments(); // Refresh comments
      } else {
        alert(result.error || "Failed to edit reply");
      }
    } catch (error) {
      console.error("Error editing reply:", error);
      alert("An error occurred while editing reply");
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
    setShowDropdown(null);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText("");
  };

  const startReplying = (commentId) => {
    setReplyingTo(commentId);
    setShowDropdown(null);
    // Focus on reply input after a short delay
    setTimeout(() => {
      const replyInput = document.querySelector(`#reply-input-${commentId}`);
      if (replyInput) replyInput.focus();
    }, 100);
  };

  const cancelReplying = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const startEditingReply = (commentId, reply) => {
    setEditingReply(`${commentId}-${reply.id}`);
    setEditReplyText(reply.text);
    setShowDropdown(null);
  };

  const cancelEditingReply = () => {
    setEditingReply(null);
    setEditReplyText("");
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };
  // FIND THE getProfileInitials FUNCTION
  // ADD THESE FUNCTIONS RIGHT BEFORE IT:

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

  const getCurrentUserProfile = (userId) => {
    return userProfiles[userId] || {};
  };

  const getProfileImageURL = (userId) => {
    const profile = getCurrentUserProfile(userId);
    return profile.photoURL || profile.profilePicture || null;
  };

  const getUserDisplayName = (userId, fallbackName) => {
    const profile = getCurrentUserProfile(userId);
    return profile.name || fallbackName || "Anonymous";
  };

  // UserAvatar component for comments
  const CommentUserAvatar = ({ userId, fallbackName, size = "md" }) => {
    const profile = getCurrentUserProfile(userId);
    const profileImageURL = getProfileImageURL(userId);
    const displayName = getUserDisplayName(userId, fallbackName);

    const sizeClasses = {
      sm: "w-6 h-6 text-xs",
      md: "w-8 h-8 text-xs",
      lg: "w-10 h-10 text-sm",
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const gradient = getConsistentGradient(userId || displayName);

    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 relative`}
      >
        {profileImageURL ? (
          <>
            <img
              key={`comment-${userId}-${profileImageURL}-${
                profile.updatedAt || Date.now()
              }`}
              src={profileImageURL}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                const initialsDiv = e.target.nextElementSibling;
                if (initialsDiv) {
                  initialsDiv.style.display = "flex";
                }
              }}
            />
            <div
              className={`absolute inset-0 w-full h-full bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
              style={{ display: "none" }}
            >
              {getProfileInitials(displayName)}
            </div>
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
          >
            {getProfileInitials(displayName)}
          </div>
        )}
      </div>
    );
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

  const isCommentLikedByCurrentUser = (comment) => {
    if (!auth.currentUser || !comment.likedBy) return false;
    return comment.likedBy.some((like) => like.uid === auth.currentUser.uid);
  };

  const isReplyLikedByCurrentUser = (reply) => {
    if (!auth.currentUser || !reply.likedBy) return false;
    return reply.likedBy.some((like) => like.uid === auth.currentUser.uid);
  };

  const canDeleteComment = (comment) => {
    if (!auth.currentUser) return false;
    return comment.uid === auth.currentUser.uid;
  };

  const canDeleteReply = (reply) => {
    if (!auth.currentUser) return false;
    return reply.uid === auth.currentUser.uid;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
              <p className="text-sm text-gray-500 truncate max-w-xs">
                {postTitle || "Post"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto comments-container">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading comments...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchComments}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Try again
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No comments yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Be the first to comment on this post!
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className="flex space-x-3">
                    {/* Avatar */}
                    <CommentUserAvatar
                      userId={comment.uid}
                      fallbackName={comment.author}
                      size="md"
                    />

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {getUserDisplayName(comment.uid, comment.author)}
                          </h4>

                          {/* Comment Options */}
                          {canDeleteComment(comment) && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setShowDropdown(
                                    showDropdown === comment.id
                                      ? null
                                      : comment.id
                                  )
                                }
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>

                              {showDropdown === comment.id && (
                                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                  <button
                                    onClick={() => startEditing(comment)}
                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(comment.id)
                                    }
                                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Comment Text or Edit Form */}
                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {comment.text}
                            {comment.editedAt && (
                              <span className="text-xs text-gray-400 ml-2">
                                (edited)
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Comment Actions */}
                      <div className="flex items-center space-x-4 mt-1 ml-3">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center space-x-1 text-xs transition-colors ${
                            isCommentLikedByCurrentUser(comment)
                              ? "text-red-500"
                              : "text-gray-500 hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              isCommentLikedByCurrentUser(comment)
                                ? "fill-current"
                                : ""
                            }`}
                          />
                          <span>{comment.likes || 0}</span>
                        </button>

                        <button
                          onClick={() => startReplying(comment.id)}
                          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Reply</span>
                        </button>

                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                      </div>

                      {/* Reply Form */}
                      {replyingTo === comment.id && (
                        <div className="mt-3 ml-3">
                          <div className="flex space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {auth.currentUser
                                ? getProfileInitials(
                                    auth.currentUser.displayName ||
                                      auth.currentUser.email?.split("@")[0] ||
                                      "U"
                                  )
                                : "?"}
                            </div>
                            <div className="flex-1">
                              <textarea
                                id={`reply-input-${comment.id}`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                                maxLength={500}
                              />
                              <div className="flex justify-between items-center mt-1">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleAddReply(comment.id)}
                                    disabled={!replyText.trim() || submitting}
                                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {submitting ? "Posting..." : "Reply"}
                                  </button>
                                  <button
                                    onClick={cancelReplying}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {replyText.length}/500
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-3 space-y-2 border-l-2 border-gray-100 pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-2">
                              {/* Reply Avatar */}
                              <CommentUserAvatar
                                userId={reply.uid}
                                fallbackName={reply.author}
                                size="sm"
                              />
                              {/* Reply Content */}
                              <div className="flex-1 min-w-0">
                                <div className="bg-blue-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="font-medium text-sm text-gray-900">
                                      {getUserDisplayName(
                                        reply.uid,
                                        reply.author
                                      )}
                                    </h5>

                                    {/* Reply Options */}
                                    {canDeleteReply(reply) && (
                                      <div className="relative">
                                        <button
                                          onClick={() =>
                                            setShowDropdown(
                                              showDropdown ===
                                                `${comment.id}-${reply.id}`
                                                ? null
                                                : `${comment.id}-${reply.id}`
                                            )
                                          }
                                          className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                        >
                                          <MoreHorizontal className="w-3 h-3 text-gray-400" />
                                        </button>

                                        {showDropdown ===
                                          `${comment.id}-${reply.id}` && (
                                          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                            <button
                                              onClick={() =>
                                                startEditingReply(
                                                  comment.id,
                                                  reply
                                                )
                                              }
                                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                              <Edit3 className="w-3 h-3 mr-2" />
                                              Edit
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDeleteReply(
                                                  comment.id,
                                                  reply.id
                                                )
                                              }
                                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                              <Trash2 className="w-3 h-3 mr-2" />
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Reply Text or Edit Form */}
                                  {editingReply ===
                                  `${comment.id}-${reply.id}` ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editReplyText}
                                        onChange={(e) =>
                                          setEditReplyText(e.target.value)
                                        }
                                        className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={2}
                                        autoFocus
                                      />
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() =>
                                            handleEditReply(
                                              comment.id,
                                              reply.id
                                            )
                                          }
                                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelEditingReply}
                                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {reply.text}
                                      {reply.editedAt && (
                                        <span className="text-xs text-gray-400 ml-2">
                                          (edited)
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>

                                {/* Reply Actions */}
                                <div className="flex items-center space-x-3 mt-1 ml-3">
                                  <button
                                    onClick={() =>
                                      handleLikeReply(comment.id, reply.id)
                                    }
                                    className={`flex items-center space-x-1 text-xs transition-colors ${
                                      isReplyLikedByCurrentUser(reply)
                                        ? "text-red-500"
                                        : "text-gray-500 hover:text-red-500"
                                    }`}
                                  >
                                    <Heart
                                      className={`w-3 h-3 ${
                                        isReplyLikedByCurrentUser(reply)
                                          ? "fill-current"
                                          : ""
                                      }`}
                                    />
                                    <span>{reply.likes || 0}</span>
                                  </button>

                                  <span className="text-xs text-gray-400">
                                    {formatTimeAgo(reply.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleAddComment} className="flex space-x-3">
            {/* Current User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {auth.currentUser
                ? getProfileInitials(
                    auth.currentUser.displayName ||
                      auth.currentUser.email?.split("@")[0] ||
                      "U"
                  )
                : "?"}
            </div>

            {/* Comment Input */}
            <div className="flex-1">
              <div className="flex space-x-2">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    auth.currentUser
                      ? "Write a comment..."
                      : "Please log in to comment"
                  }
                  disabled={!auth.currentUser || submitting}
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={2}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={
                    !newComment.trim() || !auth.currentUser || submitting
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Character count */}
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-400">
                  {!auth.currentUser && "Please log in to comment"}
                </div>
                <div className="text-xs text-gray-400">
                  {newComment.length}/500
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
