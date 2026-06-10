import React, { useState, useEffect } from "react";
import { UserPlus, UserCheck, Clock, UserX } from "lucide-react";
import {
  sendFollowRequest,
  cancelFollowRequest,
  checkFollowRequestStatus,
  unfollowUser,
} from "../api/FireStore";
import { auth } from "../firebaseConfig";

const FollowButton = ({ targetUID, onFollowStatusChange }) => {
  const [buttonState, setButtonState] = useState("loading"); // loading, follow, requested, following
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);

  useEffect(() => {
    if (!targetUID || !auth.currentUser) return;

    // Don't show follow button for own profile
    if (targetUID === auth.currentUser.uid) {
      setButtonState("hidden");
      return;
    }

    checkStatus();
  }, [targetUID]);

  const checkStatus = async () => {
    if (!targetUID || !auth.currentUser) return;

    try {
      const status = await checkFollowRequestStatus(targetUID);

      if (status.isFollowing) {
        setButtonState("following");
      } else if (status.hasRequested) {
        setButtonState("requested");
        setRequestId(status.requestId);
      } else {
        setButtonState("follow");
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
      setButtonState("follow");
    }
  };

  const handleFollowClick = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (buttonState === "follow") {
        // Send follow request
        const result = await sendFollowRequest(targetUID);

        if (result.success) {
          setButtonState("requested");
          setRequestId(result.requestId);

          if (onFollowStatusChange) {
            onFollowStatusChange("requested");
          }
        } else {
          console.error("Failed to send follow request:", result.error);
          alert(result.error || "Failed to send follow request");
        }
      } else if (buttonState === "requested") {
        // Cancel follow request
        const result = await cancelFollowRequest(targetUID);

        if (result.success) {
          setButtonState("follow");
          setRequestId(null);

          if (onFollowStatusChange) {
            onFollowStatusChange("cancelled");
          }
        } else {
          console.error("Failed to cancel follow request:", result.error);
          alert("Failed to cancel follow request");
        }
      } else if (buttonState === "following") {
        // Unfollow user
        const result = await unfollowUser(targetUID);

        if (result.success) {
          setButtonState("follow");

          if (onFollowStatusChange) {
            onFollowStatusChange("unfollowed");
          }
        } else {
          console.error("Failed to unfollow user:", result.error);
          alert("Failed to unfollow user");
        }
      }
    } catch (error) {
      console.error("Error handling follow action:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything if it's the user's own profile
  if (buttonState === "hidden" || buttonState === "loading") {
    return buttonState === "loading" ? (
      <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
    ) : null;
  }

  const getButtonConfig = () => {
    switch (buttonState) {
      case "follow":
        return {
          text: "Follow",
          icon: UserPlus,
          className: "bg-blue-600 hover:bg-blue-700 text-white",
          disabled: false,
        };
      case "requested":
        return {
          text: "Requested",
          icon: Clock,
          className: "bg-gray-200 hover:bg-gray-300 text-gray-700",
          disabled: false,
        };
      case "following":
        return {
          text: "Following",
          icon: UserCheck,
          className:
            "bg-green-600 hover:bg-red-600 text-white hover:text-white group",
          disabled: false,
          hoverText: "Unfollow",
          hoverIcon: UserX,
        };
      default:
        return {
          text: "Follow",
          icon: UserPlus,
          className: "bg-blue-600 hover:bg-blue-700 text-white",
          disabled: false,
        };
    }
  };

  const config = getButtonConfig();
  const Icon = config.icon;
  const HoverIcon = config.hoverIcon;

  return (
    <button
      onClick={handleFollowClick}
      disabled={config.disabled || isLoading}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200 relative overflow-hidden
        ${config.className}
        ${
          config.disabled || isLoading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }
        ${buttonState === "following" ? "group" : ""}
      `}
      title={
        buttonState === "follow"
          ? "Send follow request"
          : buttonState === "requested"
          ? "Cancel follow request"
          : buttonState === "following"
          ? "Click to unfollow"
          : ""
      }
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {/* Default state */}
          <div
            className={`flex items-center space-x-2 transition-opacity duration-200 ${
              buttonState === "following"
                ? "group-hover:opacity-0"
                : "opacity-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{config.text}</span>
          </div>

          {/* Hover state for following button */}
          {buttonState === "following" && HoverIcon && (
            <div className="absolute inset-0 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <HoverIcon className="h-4 w-4" />
              <span>{config.hoverText}</span>
            </div>
          )}
        </>
      )}
    </button>
  );
};

export default FollowButton;
