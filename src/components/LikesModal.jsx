import React, { useState, useEffect } from "react";
import { X, Heart, User, Loader2 } from "lucide-react";
import { getPostLikes } from "../api/FireStore";
import { ProfileAvatar, ProfileLink } from "../helper/ProfileNavigation";

const LikesModal = ({ isOpen, onClose, postId, totalLikes }) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchLikes();
    }
  }, [isOpen, postId]);

  const fetchLikes = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPostLikes(postId);
      if (result.success) {
        setLikes(result.likedBy || []);
      } else {
        setError(result.error || "Failed to load likes");
      }
    } catch (err) {
      setError("An error occurred while loading likes");
      console.error("Error fetching likes:", err);
    } finally {
      setLoading(false);
    }
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

  const getProfileInitials = (like) => {
    const name = like.name || like.email?.split("@")[0] || "User";
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            <h2 className="text-lg font-semibold text-gray-900">
              Likes ({totalLikes || likes.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading likes...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <Heart className="w-8 h-8 mx-auto mb-2" />
              </div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchLikes}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Try again
              </button>
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No likes yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Be the first to like this post!
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {likes.map((like, index) => (
                <div
                  key={`${like.uid}-${index}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getProfileInitials(like)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {like.name || like.email?.split("@")[0] || "User"}
                      </h3>
                      <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {like.email || "No email"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimeAgo(like.timestamp)}
                    </p>
                  </div>

                  {/* Profile Action */}
                  <button
                    onClick={() => {
                      // Navigate to user profile
                      if (like.uid) {
                        window.location.href = `/profile/${like.uid}`;
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors flex-shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {likes.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              {likes.length === 1
                ? "1 person likes this post"
                : `${likes.length} people like this post`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikesModal;
