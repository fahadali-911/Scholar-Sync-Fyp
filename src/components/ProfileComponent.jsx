import React, { useState } from "react";
import ProfileCard from "../common/ProfileCard";
import EditProfile from "../pages/EditProfile";
import PostsProfile from "./PostsProfile";
import FollowButton from "../components/FollowButton";

export default function ProfileComponent({
  userData,
  isOwnProfile,
  targetUID,
}) {
  const [showEditPopup, setShowEditPopup] = useState(false);

  function onEdit() {
    setShowEditPopup(true);
  }

  const handleFollowStatusChange = (status) => {
    console.log("Follow status changed:", status);
    // You can add notifications or UI updates here if needed
    switch (status) {
      case "requested":
        console.log("Follow request sent successfully");
        break;
      case "cancelled":
        console.log("Follow request cancelled");
        break;
      case "unfollowed":
        console.log("User unfollowed successfully");
        break;
      default:
        break;
    }
  };

  return (
    <>
      {showEditPopup ? (
        <EditProfile setShowEditPopup={setShowEditPopup} />
      ) : (
        <>
          <ProfileCard
            currentUser={userData}
            onEdit={onEdit}
            isOwnProfile={isOwnProfile}
            targetUID={targetUID} // Pass targetUID for messaging
            followButton={
              !isOwnProfile && (
                <FollowButton
                  targetUID={targetUID}
                  onFollowStatusChange={handleFollowStatusChange}
                />
              )
            }
          />
          <PostsProfile
            currentUser={userData}
            targetUID={targetUID}
            isOwnProfile={isOwnProfile}
          />
        </>
      )}
    </>
  );
}
