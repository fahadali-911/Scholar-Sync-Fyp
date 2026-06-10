import React from "react";
import { MessageCircle } from "lucide-react";

const CommentPreview = ({ post, onViewAllComments }) => {
  if (!post.commentsList || post.commentsList.length === 0) {
    return null;
  }

  const getProfileInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

    return date.toLocaleDateString();
  };

  // Show the 2 most recent comments
  const recentComments = post.commentsList
    .sort((a, b) => {
      const aTime = a.timestamp?.toDate
        ? a.timestamp.toDate()
        : new Date(a.timestamp);
      const bTime = b.timestamp?.toDate
        ? b.timestamp.toDate()
        : new Date(b.timestamp);
      return bTime - aTime;
    })
    .slice(0, 2);

  const remainingComments = post.commentsList.length - recentComments.length;

  // Count total interactions (comments + replies)
  const totalInteractions = post.commentsList.reduce((total, comment) => {
    return total + 1 + (comment.replies ? comment.replies.length : 0);
  }, 0);

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      {/* View all comments link */}
      {post.commentsList.length > 0 && (
        <button
          onClick={onViewAllComments}
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors mb-3 flex items-center space-x-1"
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {totalInteractions === 1
              ? "View 1 comment"
              : `View all ${totalInteractions} ${
                  totalInteractions === post.commentsList.length
                    ? "comments"
                    : "comments & replies"
                }`}
          </span>
        </button>
      )}

      {/* Recent comments preview */}
      <div className="space-y-2">
        {recentComments.map((comment) => (
          <div key={comment.id} className="flex space-x-2">
            {/* Small avatar */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {getProfileInitials(comment.author)}
            </div>

            {/* Comment content */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {comment.author || "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(comment.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {comment.text.length > 100
                    ? `${comment.text.substring(0, 100)}...`
                    : comment.text}
                </p>
              </div>

              {/* Like count if any */}
              {comment.likes > 0 && (
                <div className="ml-3 mt-1">
                  <span className="text-xs text-gray-400">
                    {comment.likes} {comment.likes === 1 ? "like" : "likes"}
                  </span>
                </div>
              )}

              {/* Show reply indicator if there are replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-3 mt-1">
                  <span className="text-xs text-blue-500">
                    {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Show remaining comments indicator */}
        {remainingComments > 0 && (
          <button
            onClick={onViewAllComments}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-8"
          >
            View {remainingComments} more{" "}
            {remainingComments === 1 ? "comment" : "comments"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentPreview;
