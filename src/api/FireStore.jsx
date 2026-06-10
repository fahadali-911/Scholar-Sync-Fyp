import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp as firebaseServerTimestamp,
  arrayUnion,
  setDoc,
  deleteDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";

let docRef = collection(db, "posts");
let userRef = collection(db, "users");

export default function FireStore(postData) {
  let object = { ...postData };
  addDoc(docRef, object)
    .then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
    });
}

export const getStatus = (setPosts) => {
  onSnapshot(docRef, (data) => {
    setPosts(
      data.docs.map((doc) => {
        return { ...doc.data(), id: doc.id };
      })
    );
  });
};

// like/unlike feature
export const toggleLike = async (postId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to like posts");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.error("Post not found");
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];
    const isLiked = likedBy.some((like) => like.uid === currentUser.uid);

    if (isLiked) {
      const updatedLikedBy = likedBy.filter(
        (like) => like.uid !== currentUser.uid
      );
      await updateDoc(postRef, {
        likedBy: updatedLikedBy,
        likes: Math.max(0, (postData.likes || 0) - 1),
      });
    } else {
      const userData = await getUserDataByUID(currentUser.uid);

      const userName =
        userData?.name ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "User";

      const likeObject = {
        uid: currentUser.uid,
        name: userName,
        email: currentUser.email || "No email",
        timestamp: new Date(),
        userPhoto: userData?.photoURL || currentUser.photoURL,
        userBio: userData?.bio || "",
      };

      console.log("Creating like object:", likeObject);
      await updateDoc(postRef, {
        likedBy: arrayUnion(likeObject),
        likes: (postData.likes || 0) + 1,
      });
    }

    return { success: true, isLiked: !isLiked };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: error.message };
  }
};

// Function to get users who liked a specific post
export const getPostLikes = async (postId) => {
  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];

    return { success: true, likedBy };
  } catch (error) {
    console.error("Error getting post likes:", error);
    return { success: false, error: error.message };
  }
};

export const postUserData = async (userData) => {
  const uid = auth.currentUser?.uid;

  try {
    if (!uid) {
      console.error("User not authenticated");
      return { success: false, error: "User not authenticated" };
    }

    // Ensure we have basic user data
    const userEmail = auth.currentUser?.email;
    const userName =
      userData.name || auth.currentUser?.displayName || "Anonymous User";

    const completeUserData = {
      name: userName,
      email: userEmail,
      bio: "",
      headline: "",
      about: "",
      location: "",
      institution: "",
      website: "",
      followers: [],
      following: [],
      interests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData, // Override with provided data
    };

    await setDoc(doc(userRef, uid), completeUserData);
    console.log("User document created/updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating/updating user document:", error);
    return { success: false, error: error.message };
  }
};

// Function to ensure user document exists
export const ensureUserDocument = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const userDocRef = doc(userRef, currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      // Create basic user document
      const basicUserData = {
        name: currentUser.displayName || "Anonymous User",
        email: currentUser.email,
        bio: "",
        headline: "",
        about: "",
        location: "",
        institution: "",
        website: "",
        followers: [],
        following: [],
        interests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(userDocRef, basicUserData);
      console.log("Basic user document created");
      return { id: currentUser.uid, ...basicUserData };
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error ensuring user document:", error);
    return null;
  }
};

// Enhanced getUser function with real-time updates
export const getUser = (setCurrUser) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Set up real-time listener for the current user's data
      const userDocRef = doc(userRef, user.uid);
      onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() };
          setCurrUser(userData);
        } else {
          console.log("User document not found");
          setCurrUser(null);
        }
      });
    } else {
      console.log("User not authenticated.");
      setCurrUser(null);
    }
  });
};

// Enhanced editUser function with better error handling and real-time updates
export const editUser = async (payload) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("No authenticated user found.");
    return { success: false, error: "No authenticated user" };
  }

  try {
    const userDocRef = doc(userRef, currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      // Update the user document
      await updateDoc(userDocRef, payload);
      console.log("User document updated successfully");

      // Update the display name in Firebase Auth if name was changed
      if (payload.name && currentUser.displayName !== payload.name) {
        try {
          await currentUser.updateProfile({
            displayName: payload.name,
          });
          console.log("Firebase Auth display name updated");
        } catch (authError) {
          console.warn(
            "Could not update Firebase Auth display name:",
            authError
          );
        }
      }

      return { success: true };
    } else {
      console.warn("⚠️ User document not found. Creating new document.");
      await setDoc(userDocRef, payload);
      return { success: true };
    }
  } catch (error) {
    console.error("Error updating user document:", error);
    return { success: false, error: error.message };
  }
};

//  getUserDataByUID function with better error handling
export const getUserDataByUID = async (uid) => {
  try {
    if (!uid) {
      console.error("No UID provided");
      return null;
    }

    const docRef = doc(userRef, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = { id: docSnap.id, ...docSnap.data() };
      console.log("User data fetched:", userData);
      return userData;
    } else {
      console.log("No such user document found for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Real-time user data listener
export const getUserDataByUIDRealtime = (uid, setUserData) => {
  if (!uid) {
    console.error("No UID provided for real-time user data");
    setUserData(null);
    return null;
  }

  const userDocRef = doc(userRef, uid);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() };
        setUserData(userData);
      } else {
        console.log("User document not found for UID:", uid);
        setUserData(null);
      }
    },
    (error) => {
      console.error("Error in real-time user data listener:", error);
      setUserData(null);
    }
  );

  return unsubscribe; // Return the unsubscribe function
};

export const getUserDataByUIDWithCallback = async (uid, setUserData) => {
  try {
    const userData = await getUserDataByUID(uid);
    if (setUserData && typeof setUserData === "function") {
      setUserData(userData);
    }
    return userData;
  } catch (error) {
    console.error("Error in getUserDataByUIDWithCallback:", error);
    if (setUserData && typeof setUserData === "function") {
      setUserData(null);
    }
    return null;
  }
};

// user posts with real-time updates
export const getUserPosts = (userEmail, setPosts) => {
  if (!userEmail) {
    console.error("No user email provided for getting user posts");
    return null;
  }

  // Create a query to get posts where the user email matches
  const q = query(docRef, where("currUser.email", "==", userEmail));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const userPosts = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setPosts(userPosts);
  });

  return unsubscribe;
};

// Function to get user by email
export const getUserByEmail = async (email) => {
  try {
    if (!email) {
      console.error("No email provided");
      return null;
    }

    const q = query(userRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.log("No user found with email:", email);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};

// Function to follow/unfollow a user
export const toggleFollowUser = async (targetUID, isFollowing) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("No authenticated user found.");
    return false;
  }

  try {
    const currentUserRef = doc(userRef, currentUser.uid);
    const targetUserRef = doc(userRef, targetUID);

    // Update current user's following list
    const currentUserDoc = await getDoc(currentUserRef);
    const targetUserDoc = await getDoc(targetUserRef);

    if (currentUserDoc.exists() && targetUserDoc.exists()) {
      const currentUserData = currentUserDoc.data();
      const targetUserData = targetUserDoc.data();

      let updatedFollowing = currentUserData.following || [];
      let updatedFollowers = targetUserData.followers || [];

      if (isFollowing) {
        // Remove from following/followers
        updatedFollowing = updatedFollowing.filter((id) => id !== targetUID);
        updatedFollowers = updatedFollowers.filter(
          (id) => id !== currentUser.uid
        );
      } else {
        // Add to following/followers
        if (!updatedFollowing.includes(targetUID)) {
          updatedFollowing.push(targetUID);
        }
        if (!updatedFollowers.includes(currentUser.uid)) {
          updatedFollowers.push(currentUser.uid);
        }
      }

      // Update both documents
      await updateDoc(currentUserRef, { following: updatedFollowing });
      await updateDoc(targetUserRef, { followers: updatedFollowers });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error toggling follow status:", error);
    return false;
  }
};

// Function to update posts when user name changes
export const updateUserNameInPosts = async (newName, userEmail) => {
  try {
    if (!userEmail || !newName) {
      console.error("Missing required parameters for updating posts");
      return;
    }

    // Get all posts by this user
    const q = query(docRef, where("currUser.email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    // Update each post with the new name
    const updatePromises = querySnapshot.docs.map((docSnapshot) => {
      const postRef = doc(docRef, docSnapshot.id);
      return updateDoc(postRef, {
        "currUser.name": newName,
        author: newName,
      });
    });

    await Promise.all(updatePromises);
    console.log(`Updated ${updatePromises.length} posts with new user name`);
  } catch (error) {
    console.error("Error updating user name in posts:", error);
  }
};

export const debugPostLikes = async (postId) => {
  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      console.log("=== DEBUG: Post Likes Data ===");
      console.log("Post ID:", postId);
      console.log("Total Likes:", postData.likes);
      console.log("Liked By Array:", postData.likedBy);

      if (postData.likedBy && postData.likedBy.length > 0) {
        postData.likedBy.forEach((like, index) => {
          console.log(`Like ${index + 1}:`, {
            uid: like.uid,
            name: like.name,
            email: like.email,
            timestamp: like.timestamp,
          });
        });
      }
      console.log("=== END DEBUG ===");

      return postData.likedBy || [];
    } else {
      console.log("Post not found for debugging");
      return [];
    }
  } catch (error) {
    console.error("Error debugging post likes:", error);
    return [];
  }
};

// Function to check current user data
export const debugCurrentUser = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log("No current user authenticated");
    return;
  }

  console.log("=== DEBUG: Current User ===");
  console.log("Auth User:", {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName,
  });

  const userData = await getUserDataByUID(currentUser.uid);
  console.log("Firestore User Data:", userData);
  console.log("=== END DEBUG ===");
};

// Function to add a comment to a post
export const addComment = async (postId, commentText) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to comment");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.error("Post not found");
      return { success: false, error: "Post not found" };
    }

    // Get fresh user data
    const userData = await getUserDataByUID(currentUser.uid);

    const userEmail = currentUser.email || userData?.email || "";
    const userName =
      userData?.name ||
      currentUser.displayName ||
      (userEmail ? userEmail.split("@")[0] : "") ||
      "Anonymous User";

    // Create comment object
    const commentObject = {
      id: Date.now() + Math.random().toString(36).substring(2, 15),
      text: commentText.trim(),
      uid: currentUser.uid,
      author: userName,
      email: userEmail,
      timestamp: new Date(),
      likes: 0,
      likedBy: [],
      replies: [],
      userPhoto: userData?.photoURL || currentUser.photoURL || "",
    };

    const postData = postSnap.data();
    const currentComments = postData.comments || 0;
    const commentsList = postData.commentsList || [];

    // Update post with new comment
    await updateDoc(postRef, {
      comments: currentComments + 1,
      commentsList: arrayUnion(commentObject),
    });

    console.log("Comment added successfully:", commentObject);
    return { success: true, comment: commentObject };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: error.message };
  }
};

// Function to get comments for a specific post
export const getPostComments = async (postId) => {
  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Sort comments by timestamp (newest first)
    const sortedComments = commentsList.sort((a, b) => {
      const aTime = a.timestamp?.toDate
        ? a.timestamp.toDate()
        : new Date(a.timestamp);
      const bTime = b.timestamp?.toDate
        ? b.timestamp.toDate()
        : new Date(b.timestamp);
      return bTime - aTime;
    });

    return { success: true, comments: sortedComments };
  } catch (error) {
    console.error("Error getting post comments:", error);
    return { success: false, error: error.message };
  }
};

// Function to like/unlike a comment
export const toggleCommentLike = async (postId, commentId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to like comments");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Find the comment to update
    const updatedComments = commentsList.map((comment) => {
      if (comment.id === commentId) {
        const likedBy = comment.likedBy || [];
        const isLiked = likedBy.some((like) => like.uid === currentUser.uid);

        if (isLiked) {
          // Unlike the comment
          return {
            ...comment,
            likes: Math.max(0, (comment.likes || 0) - 1),
            likedBy: likedBy.filter((like) => like.uid !== currentUser.uid),
          };
        } else {
          // Like the comment
          const likeObject = {
            uid: currentUser.uid,
            timestamp: new Date(),
          };
          return {
            ...comment,
            likes: (comment.likes || 0) + 1,
            likedBy: [...likedBy, likeObject],
          };
        }
      }
      return comment;
    });

    // Update the post with modified comments
    await updateDoc(postRef, {
      commentsList: updatedComments,
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return { success: false, error: error.message };
  }
};

// Function to delete a comment (only by comment author or post author)
export const deleteComment = async (postId, commentId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to delete comments");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Find the comment to check permissions
    const commentToDelete = commentsList.find(
      (comment) => comment.id === commentId
    );
    if (!commentToDelete) {
      return { success: false, error: "Comment not found" };
    }

    // Check if user can delete (comment author or post author)
    const canDelete =
      commentToDelete.uid === currentUser.uid ||
      postData.currUser?.uid === currentUser.uid ||
      postData.authorId === currentUser.uid;

    if (!canDelete) {
      return {
        success: false,
        error: "You don't have permission to delete this comment",
      };
    }

    // Remove the comment from the list
    const updatedComments = commentsList.filter(
      (comment) => comment.id !== commentId
    );

    // Update the post
    await updateDoc(postRef, {
      comments: Math.max(0, (postData.comments || 0) - 1),
      commentsList: updatedComments,
    });

    console.log("Comment deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: error.message };
  }
};

// Function to edit a comment (only by comment author)
export const editComment = async (postId, commentId, newText) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to edit comments");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Update the specific comment
    const updatedComments = commentsList.map((comment) => {
      if (comment.id === commentId && comment.uid === currentUser.uid) {
        return {
          ...comment,
          text: newText.trim(),
          editedAt: new Date(),
        };
      }
      return comment;
    });

    // Update the post with modified comments
    await updateDoc(postRef, {
      commentsList: updatedComments,
    });

    return { success: true };
  } catch (error) {
    console.error("Error editing comment:", error);
    return { success: false, error: error.message };
  }
};

// Function to create a notification when someone replies to a comment
export const createReplyNotification = async (
  originalCommentAuthorUID,
  postId,
  postTitle,
  replierName
) => {
  try {
    // Don't notify if replying to own comment
    if (originalCommentAuthorUID === auth.currentUser?.uid) {
      return { success: true };
    }

    const notificationObject = {
      id: Date.now() + Math.random().toString(36).substring(2, 15),
      type: "reply",
      message: `${replierName} replied to your comment`,
      postId: postId,
      postTitle: postTitle,
      fromUID: auth.currentUser?.uid,
      fromName: replierName,
      toUID: originalCommentAuthorUID,
      timestamp: new Date(),
      read: false,
    };

    // Add notification to the user's notifications collection
    const userNotificationsRef = collection(
      db,
      `users/${originalCommentAuthorUID}/notifications`
    );
    await addDoc(userNotificationsRef, notificationObject);

    console.log("Reply notification created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating reply notification:", error);
    return { success: false, error: error.message };
  }
};

// Function to get user notifications
export const getUserNotifications = async (userUID) => {
  try {
    if (!userUID) {
      return { success: false, error: "User UID required" };
    }

    const notificationsRef = collection(db, `users/${userUID}/notifications`);
    const q = query(notificationsRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, notifications };
  } catch (error) {
    console.error("Error getting notifications:", error);
    return { success: false, error: error.message };
  }
};

// Function to mark notification as read
export const markNotificationAsRead = async (userUID, notificationId) => {
  try {
    const notificationRef = doc(
      db,
      `users/${userUID}/notifications/${notificationId}`
    );
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
};

// Function to add a reply to a comment
export const addReply = async (postId, commentId, replyText) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to reply");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.error("Post not found");
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Find the original comment to get author info for notification
    const originalComment = commentsList.find(
      (comment) => comment.id === commentId
    );
    if (!originalComment) {
      return { success: false, error: "Original comment not found" };
    }

    // Get fresh user data
    const userData = await getUserDataByUID(currentUser.uid);

    const userEmail = currentUser.email || userData?.email || "";
    const userName =
      userData?.name ||
      currentUser.displayName ||
      (userEmail ? userEmail.split("@")[0] : "") ||
      "Anonymous User";

    // Create reply object
    const replyObject = {
      id: Date.now() + Math.random().toString(36).substring(2, 15),
      text: replyText.trim(),
      uid: currentUser.uid,
      author: userName,
      email: userEmail,
      timestamp: new Date(),
      likes: 0,
      likedBy: [],
      userPhoto: userData?.photoURL || currentUser.photoURL || "",
    };

    // Find the comment and add reply to it
    const updatedComments = commentsList.map((comment) => {
      if (comment.id === commentId) {
        const updatedReplies = [...(comment.replies || []), replyObject];
        return {
          ...comment,
          replies: updatedReplies,
        };
      }
      return comment;
    });

    // Update the post with modified comments
    await updateDoc(postRef, {
      commentsList: updatedComments,
    });

    // Create notification for the original comment author
    if (originalComment.uid !== currentUser.uid) {
      try {
        await createReplyNotification(
          originalComment.uid,
          postId,
          postData.title || "a post",
          userName
        );
      } catch (notificationError) {
        console.warn("Failed to create reply notification:", notificationError);
        // Don't fail the reply if notification fails
      }
    }

    console.log("Reply added successfully:", replyObject);
    return { success: true, reply: replyObject };
  } catch (error) {
    console.error("Error adding reply:", error);
    return { success: false, error: error.message };
  }
};

// Function to like/unlike a reply
export const toggleReplyLike = async (postId, commentId, replyId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to like replies");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Find the comment and update the specific reply
    const updatedComments = commentsList.map((comment) => {
      if (comment.id === commentId) {
        const updatedReplies = (comment.replies || []).map((reply) => {
          if (reply.id === replyId) {
            const likedBy = reply.likedBy || [];
            const isLiked = likedBy.some(
              (like) => like.uid === currentUser.uid
            );

            if (isLiked) {
              // Unlike the reply
              return {
                ...reply,
                likes: Math.max(0, (reply.likes || 0) - 1),
                likedBy: likedBy.filter((like) => like.uid !== currentUser.uid),
              };
            } else {
              // Like the reply
              const likeObject = {
                uid: currentUser.uid,
                timestamp: new Date(),
              };
              return {
                ...reply,
                likes: (reply.likes || 0) + 1,
                likedBy: [...likedBy, likeObject],
              };
            }
          }
          return reply;
        });

        return {
          ...comment,
          replies: updatedReplies,
        };
      }
      return comment;
    });

    // Update the post with modified comments
    await updateDoc(postRef, {
      commentsList: updatedComments,
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling reply like:", error);
    return { success: false, error: error.message };
  }
};

// Function to delete a reply (only by reply author or post author)
export const deleteReply = async (postId, commentId, replyId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to delete replies");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Find the reply to check permission
    let replyToDelete = null;
    const commentWithReply = commentsList.find((comment) => {
      if (comment.id === commentId && comment.replies) {
        replyToDelete = comment.replies.find((reply) => reply.id === replyId);
        return !!replyToDelete;
      }
      return false;
    });

    if (!replyToDelete) {
      return { success: false, error: "Reply not found" };
    }

    // Check if user can delete (reply author or post author)
    const canDelete =
      replyToDelete.uid === currentUser.uid ||
      postData.currUser?.uid === currentUser.uid ||
      postData.authorId === currentUser.uid;

    if (!canDelete) {
      return {
        success: false,
        error: "You don't have permission to delete this reply",
      };
    }

    // Remove the reply from the comment
    const updatedComments = commentsList.map((comment) => {
      if (comment.id === commentId) {
        const updatedReplies = (comment.replies || []).filter(
          (reply) => reply.id !== replyId
        );
        return {
          ...comment,
          replies: updatedReplies,
        };
      }
      return comment;
    });

    // Update the post
    await updateDoc(postRef, {
      commentsList: updatedComments,
    });

    console.log("Reply deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting reply:", error);
    return { success: false, error: error.message };
  }
};

// Function to edit a reply (only by reply author)
export const editReply = async (postId, commentId, replyId, newText) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to edit replies");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const commentsList = postData.commentsList || [];

    // Update the specific reply
    const updatedComments = commentsList.map((comment) => {
      if (comment.id === commentId) {
        const updatedReplies = (comment.replies || []).map((reply) => {
          if (reply.id === replyId && reply.uid === currentUser.uid) {
            return {
              ...reply,
              text: newText.trim(),
              editedAt: new Date(),
            };
          }
          return reply;
        });

        return {
          ...comment,
          replies: updatedReplies,
        };
      }
      return comment;
    });

    // Update the post with modified comments
    await updateDoc(postRef, {
      commentsList: updatedComments,
    });

    return { success: true };
  } catch (error) {
    console.error("Error editing reply:", error);
    return { success: false, error: error.message };
  }
};

// Create follow request collection reference

let followRequestsRef = collection(db, "followRequests");

// Function to send a follow request
export const sendFollowRequest = async (targetUID) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to send follow requests");
    return { success: false, error: "User not authenticated" };
  }

  if (currentUser.uid === targetUID) {
    return { success: false, error: "Cannot send follow request to yourself" };
  }

  try {
    // Check if request already exists
    const existingRequestQuery = query(
      followRequestsRef,
      where("fromUID", "==", currentUser.uid),
      where("toUID", "==", targetUID)
    );
    const existingRequests = await getDocs(existingRequestQuery);

    if (!existingRequests.empty) {
      return { success: false, error: "Follow request already sent" };
    }

    // Check if already following
    const currentUserData = await getUserDataByUID(currentUser.uid);
    const following = currentUserData?.following || [];

    if (following.includes(targetUID)) {
      return { success: false, error: "Already following this user" };
    }

    // Get user data for the request
    const fromUserData = await getUserDataByUID(currentUser.uid);
    const toUserData = await getUserDataByUID(targetUID);

    if (!fromUserData || !toUserData) {
      return { success: false, error: "User data not found" };
    }

    // Create follow request object
    const followRequestObject = {
      fromUID: currentUser.uid,
      toUID: targetUID,
      fromUserData: {
        name: fromUserData.name || "Anonymous User",
        email: fromUserData.email || "",
        bio: fromUserData.bio || "",
        photoURL: fromUserData.photoURL || "",
        username:
          fromUserData.username || fromUserData.email?.split("@")[0] || "user",
      },
      toUserData: {
        name: toUserData.name || "Anonymous User",
        email: toUserData.email || "",
        username:
          toUserData.username || toUserData.email?.split("@")[0] || "user",
      },
      status: "pending",
      timestamp: new Date(),
      createdAt: new Date(),
    };

    // Add the follow request to Firestore
    const docRef = await addDoc(followRequestsRef, followRequestObject);
    console.log("Follow request sent successfully:", docRef.id);

    return { success: true, requestId: docRef.id };
  } catch (error) {
    console.error("Error sending follow request:", error);
    return { success: false, error: error.message };
  }
};

// Function to accept a follow request
export const acceptFollowRequest = async (requestId, fromUID) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to accept follow requests");
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get the follow request
    const requestRef = doc(followRequestsRef, requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: "Follow request not found" };
    }

    const requestData = requestSnap.data();

    // Verify the request is for the current user
    if (requestData.toUID !== currentUser.uid) {
      return { success: false, error: "Unauthorized to accept this request" };
    }

    // Update both users' following/followers lists
    const currentUserRef = doc(userRef, currentUser.uid);
    const fromUserRef = doc(userRef, fromUID);

    // Get current data
    const currentUserDoc = await getDoc(currentUserRef);
    const fromUserDoc = await getDoc(fromUserRef);

    if (currentUserDoc.exists() && fromUserDoc.exists()) {
      const currentUserData = currentUserDoc.data();
      const fromUserData = fromUserDoc.data();

      // Update followers list for current user (add fromUID)
      const updatedFollowers = [...(currentUserData.followers || [])];
      if (!updatedFollowers.includes(fromUID)) {
        updatedFollowers.push(fromUID);
      }

      // Update following list for the user who sent the request (add currentUser.uid)
      const updatedFollowing = [...(fromUserData.following || [])];
      if (!updatedFollowing.includes(currentUser.uid)) {
        updatedFollowing.push(currentUser.uid);
      }

      // Update both user documents
      await updateDoc(currentUserRef, { followers: updatedFollowers });
      await updateDoc(fromUserRef, { following: updatedFollowing });

      // Delete the follow request
      await deleteDoc(requestRef);

      console.log("Follow request accepted successfully");
      return { success: true };
    } else {
      return { success: false, error: "User data not found" };
    }
  } catch (error) {
    console.error("Error accepting follow request:", error);
    return { success: false, error: error.message };
  }
};

// Function to reject/decline a follow request
export const rejectFollowRequest = async (requestId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to reject follow requests");
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get the follow request
    const requestRef = doc(followRequestsRef, requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: "Follow request not found" };
    }

    const requestData = requestSnap.data();

    // Verify the request is for the current user
    if (requestData.toUID !== currentUser.uid) {
      return { success: false, error: "Unauthorized to reject this request" };
    }

    // Delete the follow request
    await deleteDoc(requestRef);

    console.log("Follow request rejected successfully");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting follow request:", error);
    return { success: false, error: error.message };
  }
};

// Function to cancel a sent follow request
export const cancelFollowRequest = async (targetUID) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to cancel follow requests");
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Find the follow request
    const requestQuery = query(
      followRequestsRef,
      where("fromUID", "==", currentUser.uid),
      where("toUID", "==", targetUID)
    );
    const querySnapshot = await getDocs(requestQuery);

    if (querySnapshot.empty) {
      return { success: false, error: "Follow request not found" };
    }

    // Delete the follow request (should only be one)
    const requestDoc = querySnapshot.docs[0];
    await deleteDoc(doc(followRequestsRef, requestDoc.id));

    console.log("Follow request cancelled successfully");
    return { success: true };
  } catch (error) {
    console.error("Error cancelling follow request:", error);
    return { success: false, error: error.message };
  }
};

// Function to get follow requests for current user (incoming requests)
export const getFollowRequests = (setFollowRequests) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to get follow requests");
    return null;
  }

  const requestQuery = query(
    followRequestsRef,
    where("toUID", "==", currentUser.uid),
    where("status", "==", "pending")
  );

  const unsubscribe = onSnapshot(requestQuery, (querySnapshot) => {
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by timestamp (newest first)
    requests.sort((a, b) => {
      const aTime = a.timestamp?.toDate
        ? a.timestamp.toDate()
        : new Date(a.timestamp);
      const bTime = b.timestamp?.toDate
        ? b.timestamp.toDate()
        : new Date(b.timestamp);
      return bTime - aTime;
    });

    setFollowRequests(requests);
  });

  return unsubscribe;
};

// Function to get sent follow requests (outgoing requests)
export const getSentFollowRequests = (setSentRequests) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to get sent follow requests");
    return null;
  }

  const requestQuery = query(
    followRequestsRef,
    where("fromUID", "==", currentUser.uid),
    where("status", "==", "pending")
  );

  const unsubscribe = onSnapshot(requestQuery, (querySnapshot) => {
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setSentRequests(requests);
  });

  return unsubscribe;
};

// Function to check if current user has sent a follow request to target user
export const checkFollowRequestStatus = async (targetUID) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { hasRequested: false, isFollowing: false };
  }

  try {
    // Check if already following
    const currentUserData = await getUserDataByUID(currentUser.uid);
    const following = currentUserData?.following || [];

    if (following.includes(targetUID)) {
      return { hasRequested: false, isFollowing: true };
    }

    // Check if request exists
    const requestQuery = query(
      followRequestsRef,
      where("fromUID", "==", currentUser.uid),
      where("toUID", "==", targetUID),
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(requestQuery);

    return {
      hasRequested: !querySnapshot.empty,
      isFollowing: false,
      requestId: !querySnapshot.empty ? querySnapshot.docs[0].id : null,
    };
  } catch (error) {
    console.error("Error checking follow request status:", error);
    return { hasRequested: false, isFollowing: false };
  }
};

// Function to get followers list for a user
export const getFollowersList = async (userUID) => {
  try {
    const userData = await getUserDataByUID(userUID);
    const followerUIDs = userData?.followers || [];

    // Get user data for each follower
    const followersData = await Promise.all(
      followerUIDs.map(async (uid) => {
        const followerData = await getUserDataByUID(uid);
        return followerData;
      })
    );

    // Filter out null results
    return followersData.filter((data) => data !== null);
  } catch (error) {
    console.error("Error getting followers list:", error);
    return [];
  }
};

// Function to get following list for a user
export const getFollowingList = async (userUID) => {
  try {
    const userData = await getUserDataByUID(userUID);
    const followingUIDs = userData?.following || [];

    // Get user data for each followed user
    const followingData = await Promise.all(
      followingUIDs.map(async (uid) => {
        const followedData = await getUserDataByUID(uid);
        return followedData;
      })
    );

    // Filter out null results
    return followingData.filter((data) => data !== null);
  } catch (error) {
    console.error("Error getting following list:", error);
    return [];
  }
};

// Function to unfollow a user
export const unfollowUser = async (targetUID) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to unfollow");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const currentUserRef = doc(userRef, currentUser.uid);
    const targetUserRef = doc(userRef, targetUID);

    // Get current data
    const currentUserDoc = await getDoc(currentUserRef);
    const targetUserDoc = await getDoc(targetUserRef);

    if (currentUserDoc.exists() && targetUserDoc.exists()) {
      const currentUserData = currentUserDoc.data();
      const targetUserData = targetUserDoc.data();

      // Remove from following list (current user)
      const updatedFollowing = (currentUserData.following || []).filter(
        (uid) => uid !== targetUID
      );

      // Remove from followers list (target user)
      const updatedFollowers = (targetUserData.followers || []).filter(
        (uid) => uid !== currentUser.uid
      );

      // Update both documents
      await updateDoc(currentUserRef, { following: updatedFollowing });
      await updateDoc(targetUserRef, { followers: updatedFollowers });

      console.log("User unfollowed successfully");
      return { success: true };
    } else {
      return { success: false, error: "User data not found" };
    }
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return { success: false, error: error.message };
  }
};

// Function to get mutual followers count
export const getMutualFollowersCount = async (targetUID) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return 0;
  }

  try {
    const currentUserData = await getUserDataByUID(currentUser.uid);
    const targetUserData = await getUserDataByUID(targetUID);

    const currentFollowing = currentUserData?.following || [];
    const targetFollowers = targetUserData?.followers || [];

    // Find intersection (mutual connections)
    const mutualCount = currentFollowing.filter((uid) =>
      targetFollowers.includes(uid)
    ).length;

    return mutualCount;
  } catch (error) {
    console.error("Error getting mutual followers count:", error);
    return 0;
  }
};
// Collections references for messaging
const conversationsRef = collection(db, "conversations");
const messagesRef = collection(db, "messages");

// Helper function to create conversation ID
const createConversationId = (uid1, uid2) => {
  return [uid1, uid2].sort().join("_");
};

// ===================== NO-INDEX MESSAGING FUNCTIONS =====================

/**
 * Send a message - NO INDEX VERSION
 */
export const sendMessage = async (receiverId, content) => {
  console.log("🚀 Starting sendMessage function");
  console.log("Receiver ID:", receiverId);
  console.log("Content:", content);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("❌ No current user");
      throw new Error("User not authenticated");
    }

    console.log("✅ Current user:", currentUser.uid);

    // Get user data
    const [senderData, receiverData] = await Promise.all([
      getUserDataByUID(currentUser.uid),
      getUserDataByUID(receiverId),
    ]);

    console.log("✅ Sender data:", senderData);
    console.log("✅ Receiver data:", receiverData);

    if (!senderData || !receiverData) {
      console.error("❌ Missing user data");
      throw new Error("User data not found");
    }

    const conversationId = createConversationId(currentUser.uid, receiverId);
    console.log("✅ Conversation ID:", conversationId);

    // Create message with simplified structure - NO COMPOSITE QUERIES
    const messageData = {
      conversationId,
      senderId: currentUser.uid,
      receiverId,
      content: content.trim(),
      timestamp: firebaseServerTimestamp(),
      clientTimestamp: new Date(),
      status: "sent",
      deleted: false,
      senderName: senderData.name || "Unknown User",
      receiverName: receiverData.name || "Unknown User",
      // Add individual fields to avoid composite index needs
      createdAt: firebaseServerTimestamp(),
    };

    console.log("📝 Message data:", messageData);

    // Add message to Firestore
    console.log("💾 Adding message to Firestore...");
    const messageDocRef = await addDoc(messagesRef, messageData);
    console.log("✅ Message added with ID:", messageDocRef.id);

    // Create/update conversation - simplified structure
    const conversationData = {
      participants: [currentUser.uid, receiverId],
      participantNames: {
        [currentUser.uid]: senderData.name || "Unknown User",
        [receiverId]: receiverData.name || "Unknown User",
      },
      lastMessage: {
        content: content.trim(),
        senderId: currentUser.uid,
        timestamp: firebaseServerTimestamp(),
        clientTimestamp: new Date(),
      },
      updatedAt: firebaseServerTimestamp(),
      unreadCount: {
        [currentUser.uid]: 0,
        [receiverId]: 1,
      },
      // Denormalize data to avoid complex queries
      [`participant_${currentUser.uid}`]: true,
      [`participant_${receiverId}`]: true,
    };

    console.log("💬 Conversation data:", conversationData);

    const conversationDocRef = doc(conversationsRef, conversationId);

    // Check if conversation exists
    const existingConv = await getDoc(conversationDocRef);

    if (existingConv.exists()) {
      console.log("📝 Updating existing conversation...");
      const existing = existingConv.data();
      await updateDoc(conversationDocRef, {
        lastMessage: conversationData.lastMessage,
        updatedAt: firebaseServerTimestamp(),
        [`unreadCount.${receiverId}`]:
          (existing.unreadCount?.[receiverId] || 0) + 1,
        [`unreadCount.${currentUser.uid}`]: 0,
      });
      console.log("✅ Conversation updated");
    } else {
      console.log("🆕 Creating new conversation...");
      await setDoc(conversationDocRef, {
        ...conversationData,
        createdAt: firebaseServerTimestamp(),
      });
      console.log("✅ New conversation created");
    }

    console.log("🎉 Message sent successfully!");
    return { success: true, messageId: messageDocRef.id, conversationId };
  } catch (error) {
    console.error("❌ Error in sendMessage:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    return { success: false, error: error.message };
  }
};

/**
 * Get conversations - NO COMPOSITE INDEX REQUIRED
 */
export const getConversations = (setConversations) => {
  console.log("🔄 Setting up conversations listener");

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("❌ No current user for conversations");
    setConversations([]);
    return null;
  }

  console.log("👤 Current user for conversations:", currentUser.uid);

  // Use simple query without composite index
  const q = query(
    conversationsRef,
    where(`participant_${currentUser.uid}`, "==", true)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("📨 Conversations snapshot received");
      console.log("📊 Snapshot size:", snapshot.size);
      console.log("📊 Snapshot empty:", snapshot.empty);

      const conversations = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("💬 Conversation doc:", doc.id, data);

        const otherParticipantId = data.participants?.find(
          (id) => id !== currentUser.uid
        );
        const otherParticipantName =
          data.participantNames?.[otherParticipantId];

        if (otherParticipantId && otherParticipantName) {
          conversations.push({
            id: doc.id,
            ...data,
            otherParticipant: {
              id: otherParticipantId,
              name: otherParticipantName,
              avatar: null,
            },
            unreadCount: data.unreadCount?.[currentUser.uid] || 0,
          });
        }
      });

      // Sort by updatedAt manually (no composite index needed)
      conversations.sort((a, b) => {
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(0);
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(0);
        return bTime - aTime;
      });

      console.log("✅ Processed conversations:", conversations.length);
      setConversations(conversations);
    },
    (error) => {
      console.error("❌ Error in conversations listener:", error);
      setConversations([]);
    }
  );

  return unsubscribe;
};

/**
 * Get messages - NO COMPOSITE INDEX REQUIRED - FIXED ORDERING
 */
export const getMessages = (conversationId, setMessages) => {
  console.log("📨 Setting up messages listener for:", conversationId);

  if (!conversationId) {
    console.error("❌ No conversation ID provided");
    setMessages([]);
    return null;
  }

  // Use simple query without composite index
  const q = query(messagesRef, where("conversationId", "==", conversationId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("💬 Messages snapshot received for:", conversationId);
      console.log("📊 Messages count:", snapshot.size);

      const messages = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📝 Message doc:", doc.id, data);

        // Only include non-deleted messages
        if (!data.deleted) {
          messages.push({
            id: doc.id,
            ...data,
            // Use clientTimestamp if serverTimestamp is null, fallback to current time
            timestamp:
              data.timestamp?.toDate() || data.clientTimestamp || new Date(),
          });
        }
      });

      // Sort by timestamp - OLDEST TO NEWEST (chronological order)
      messages.sort((a, b) => {
        // Get timestamps for comparison
        let aTime, bTime;

        // Try to get the most accurate timestamp
        if (a.timestamp instanceof Date) {
          aTime = a.timestamp;
        } else if (a.clientTimestamp instanceof Date) {
          aTime = a.clientTimestamp;
        } else if (a.clientTimestamp) {
          aTime = new Date(a.clientTimestamp);
        } else {
          aTime = new Date(0); // Fallback to epoch
        }

        if (b.timestamp instanceof Date) {
          bTime = b.timestamp;
        } else if (b.clientTimestamp instanceof Date) {
          bTime = b.clientTimestamp;
        } else if (b.clientTimestamp) {
          bTime = new Date(b.clientTimestamp);
        } else {
          bTime = new Date(0); // Fallback to epoch
        }

        // Sort oldest to newest (a - b for ascending order)
        const result = aTime.getTime() - bTime.getTime();
        console.log(
          `📅 Sorting: ${a.content?.substring(
            0,
            20
          )} (${aTime.toISOString()}) vs ${b.content?.substring(
            0,
            20
          )} (${bTime.toISOString()}) = ${result}`
        );
        return result;
      });

      console.log("✅ Processed and sorted messages:", messages.length);
      console.log(
        "📅 Message order:",
        messages.map((m) => ({
          content: m.content?.substring(0, 20),
          time: m.timestamp?.toISOString(),
        }))
      );
      setMessages(messages);
    },
    (error) => {
      console.error("❌ Error in messages listener:", error);
      setMessages([]);
    }
  );

  return unsubscribe;
};

/**
 * Mark messages as read - SIMPLIFIED
 */
export const markMessagesAsRead = async (conversationId) => {
  console.log("👁️ Marking messages as read for:", conversationId);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    const conversationRef = doc(conversationsRef, conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${currentUser.uid}`]: 0,
    });

    console.log("✅ Messages marked as read");
    return { success: true };
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get total unread count - NO COMPOSITE INDEX
 */
export const getTotalUnreadCount = (setUnreadCount) => {
  console.log("🔔 Setting up unread count listener");

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log("❌ No current user for unread count");
    setUnreadCount(0);
    return null;
  }

  // Use simple query
  const q = query(
    conversationsRef,
    where(`participant_${currentUser.uid}`, "==", true)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("🔔 Unread count snapshot received");

      let totalUnread = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const userUnread = data.unreadCount?.[currentUser.uid] || 0;
        totalUnread += userUnread;
      });

      console.log("📊 Total unread count:", totalUnread);
      setUnreadCount(totalUnread);
    },
    (error) => {
      console.error("❌ Error in unread count listener:", error);
      setUnreadCount(0);
    }
  );

  return unsubscribe;
};

/**
 * Create conversation for direct messaging - NO INDEX
 */
export const getOrCreateConversation = async (otherUserId) => {
  console.log("🆕 Creating/getting conversation with:", otherUserId);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    const conversationId = createConversationId(currentUser.uid, otherUserId);
    console.log("🔗 Conversation ID:", conversationId);

    // Check if conversation exists
    const conversationRef = doc(conversationsRef, conversationId);
    const existingConv = await getDoc(conversationRef);

    if (existingConv.exists()) {
      console.log("✅ Conversation already exists");
      return { success: true, conversationId, exists: true };
    }

    // Get user data
    const [currentUserData, otherUserData] = await Promise.all([
      getUserDataByUID(currentUser.uid),
      getUserDataByUID(otherUserId),
    ]);

    if (!currentUserData || !otherUserData) {
      throw new Error("User data not found");
    }

    // Create new conversation with denormalized participant fields
    const conversationData = {
      participants: [currentUser.uid, otherUserId],
      participantNames: {
        [currentUser.uid]: currentUserData.name || "Unknown User",
        [otherUserId]: otherUserData.name || "Unknown User",
      },
      lastMessage: null,
      createdAt: firebaseServerTimestamp(),
      updatedAt: firebaseServerTimestamp(),
      unreadCount: {
        [currentUser.uid]: 0,
        [otherUserId]: 0,
      },
      // Denormalized fields to avoid array-contains queries
      [`participant_${currentUser.uid}`]: true,
      [`participant_${otherUserId}`]: true,
    };

    await setDoc(conversationRef, conversationData);
    console.log("✅ New conversation created");

    return { success: true, conversationId, exists: false };
  } catch (error) {
    console.error("❌ Error creating conversation:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a message - SIMPLE VERSION
 */
export const deleteMessage = async (messageId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    const messageRef = doc(messagesRef, messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      throw new Error("Message not found");
    }

    const messageData = messageSnap.data();

    // Only sender can delete their own messages
    if (messageData.senderId !== currentUser.uid) {
      throw new Error("You can only delete your own messages");
    }

    // Soft delete
    await updateDoc(messageRef, {
      deleted: true,
      deletedAt: firebaseServerTimestamp(),
      content: "[Message deleted]",
    });

    console.log("✅ Message deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Edit a message - SIMPLE VERSION
 */
export const editMessage = async (messageId, newContent) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    const messageRef = doc(messagesRef, messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      throw new Error("Message not found");
    }

    const messageData = messageSnap.data();

    // Only sender can edit their own messages
    if (messageData.senderId !== currentUser.uid) {
      throw new Error("You can only edit your own messages");
    }

    await updateDoc(messageRef, {
      content: newContent.trim(),
      editedAt: firebaseServerTimestamp(),
    });

    console.log("✅ Message edited successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error editing message:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user's online status - IMPROVED VERSION
 */
export const updateOnlineStatus = async (isOnline = true) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("❌ No current user for online status update");
      return;
    }

    console.log(
      `🔄 Updating online status for ${currentUser.uid} to:`,
      isOnline
    );

    const userDocRef = doc(db, "users", currentUser.uid);

    // Check if user document exists first
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        isOnline: isOnline,
        lastSeen: firebaseServerTimestamp(),
        lastActivity: new Date().toISOString(), // Add readable timestamp
      });
      console.log("✅ Online status updated successfully:", isOnline);
    } else {
      console.log(
        "⚠️ User document does not exist, cannot update online status"
      );
      // Optionally create the document with basic info
      const userData = await getUserDataByUID(currentUser.uid);
      if (userData) {
        await updateDoc(userDocRef, {
          isOnline: isOnline,
          lastSeen: firebaseServerTimestamp(),
          lastActivity: new Date().toISOString(),
        });
        console.log("✅ Created online status for existing user");
      }
    }
  } catch (error) {
    console.error("❌ Error updating online status:", error);
  }
};

/**
 * Get online status for multiple users - FIXED VERSION
 */
export const getOnlineStatus = (userIds, setOnlineUsers) => {
  if (!userIds || userIds.length === 0) {
    console.log("👁️ No user IDs provided for online status");
    setOnlineUsers({});
    return null;
  }

  console.log("👁️ Setting up online status listeners for users:", userIds);

  const unsubscribes = [];

  // Set up individual listeners for each user
  userIds.forEach((userId) => {
    if (!userId) {
      console.warn("⚠️ Skipping undefined userId");
      return;
    }

    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const isOnline = userData.isOnline || false;
          const lastSeen = userData.lastSeen;

          console.log(`👤 Online status for ${userId}:`, {
            isOnline,
            lastSeen: lastSeen?.toDate?.() || lastSeen,
            lastActivity: userData.lastActivity,
          });

          // Check if user is actually online (recent activity)
          let actuallyOnline = false;
          if (isOnline && lastSeen) {
            const lastSeenTime = lastSeen.toDate
              ? lastSeen.toDate()
              : new Date(lastSeen);
            const now = new Date();
            const timeDifference = now - lastSeenTime;
            const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes

            // Consider user online if they were active in the last 5 minutes
            actuallyOnline = timeDifference < fiveMinutesInMs;

            console.log(
              `🕐 User ${userId} last seen ${Math.floor(
                timeDifference / 1000
              )}s ago, online: ${actuallyOnline}`
            );
          }

          setOnlineUsers((prev) => ({
            ...prev,
            [userId]: {
              isOnline: actuallyOnline,
              lastSeen: lastSeen,
              rawOnlineStatus: isOnline, // Keep raw status for debugging
              lastActivity: userData.lastActivity,
            },
          }));
        } else {
          console.log(`❌ User document not found for ${userId}`);
          setOnlineUsers((prev) => ({
            ...prev,
            [userId]: {
              isOnline: false,
              lastSeen: null,
              rawOnlineStatus: false,
            },
          }));
        }
      },
      (error) => {
        console.error(
          `❌ Error getting online status for user ${userId}:`,
          error
        );
        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: {
            isOnline: false,
            lastSeen: null,
            error: error.message,
          },
        }));
      }
    );

    unsubscribes.push(unsubscribe);
  });

  // Return cleanup function that unsubscribes all listeners
  return () => {
    console.log(
      "🧹 Cleaning up online status listeners for",
      userIds.length,
      "users"
    );
    unsubscribes.forEach((unsubscribe) => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    });
  };
};

/**
 * Initialize online status when user logs in
 */
export const initializeOnlineStatus = async () => {
  console.log("🚀 Initializing online status system");

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log("❌ No current user for online status initialization");
    return;
  }

  // Set user as online
  await updateOnlineStatus(true);

  // Set up listeners for when user goes offline
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log("📱 App went to background, setting offline");
      updateOnlineStatus(false);
    } else {
      console.log("📱 App came to foreground, setting online");
      updateOnlineStatus(true);
    }
  };

  const handleBeforeUnload = () => {
    console.log("🚪 User leaving page, setting offline");
    updateOnlineStatus(false);
  };

  // Add event listeners
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleBeforeUnload);

  // Update status every 2 minutes to keep it fresh
  const statusInterval = setInterval(() => {
    if (!document.hidden && auth.currentUser) {
      console.log("🔄 Refreshing online status");
      updateOnlineStatus(true);
    }
  }, 2 * 60 * 1000); // 2 minutes

  // Return cleanup function
  return () => {
    console.log("🧹 Cleaning up online status system");
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    clearInterval(statusInterval);
    updateOnlineStatus(false);
  };
};

// ===================== TEST FUNCTIONS =====================

/**
 * Test function to check if messaging works
 */
export const testMessaging = async () => {
  console.log("🧪 Testing messaging system...");

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("❌ No user logged in for test");
      return;
    }

    console.log("👤 Current user for test:", currentUser.uid);
    console.log("📧 Current user email:", currentUser.email);

    // Test user data retrieval
    const userData = await getUserDataByUID(currentUser.uid);
    console.log("👤 User data:", userData);

    // Test collections access - simple queries only
    console.log("📁 Testing collections access...");
    const testQuery = query(
      messagesRef,
      where("senderId", "==", currentUser.uid)
    );
    const testSnapshot = await getDocs(testQuery);
    console.log("📊 Test query result size:", testSnapshot.size);

    // Test conversation query
    const convQuery = query(
      conversationsRef,
      where(`participant_${currentUser.uid}`, "==", true)
    );
    const convSnapshot = await getDocs(convQuery);
    console.log("📊 Conversations query result size:", convSnapshot.size);

    console.log("✅ Messaging system test completed");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Export the test function so you can call it from console
window.testMessaging = testMessaging;

// Enhanced search function for posts
export const searchPosts = async (searchTerm, filters = {}) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, results: [] };
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    // Get all posts first (since Firestore doesn't support complex full-text search)
    const postsQuery = query(docRef, orderBy("timeStamp", "desc"), limit(100));
    const snapshot = await getDocs(postsQuery);

    const allPosts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter posts based on search term
    const filteredPosts = allPosts.filter((post) => {
      const title = (post.title || post.status || "").toLowerCase();
      const description = (
        post.description ||
        post.excerpt ||
        post.status ||
        ""
      ).toLowerCase();
      const author = (post.currUser?.name || post.author || "").toLowerCase();
      const tags = (post.tags || []).join(" ").toLowerCase();
      const postType = (post.postType || post.type || "").toLowerCase();

      // Check if search term matches any field
      const matchesSearch =
        title.includes(searchTermLower) ||
        description.includes(searchTermLower) ||
        author.includes(searchTermLower) ||
        tags.includes(searchTermLower) ||
        postType.includes(searchTermLower);

      // Apply additional filters if provided
      if (filters.postType && filters.postType !== "all") {
        return (
          matchesSearch &&
          (post.postType === filters.postType || post.type === filters.postType)
        );
      }

      return matchesSearch;
    });

    // Sort by relevance (title matches first, then description matches)
    const sortedResults = filteredPosts.sort((a, b) => {
      const aTitleMatch = (a.title || a.status || "")
        .toLowerCase()
        .includes(searchTermLower);
      const bTitleMatch = (b.title || b.status || "")
        .toLowerCase()
        .includes(searchTermLower);

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // If both or neither match title, sort by timestamp
      const aTime = a.timeStamp?.seconds || 0;
      const bTime = b.timeStamp?.seconds || 0;
      return bTime - aTime;
    });

    return {
      success: true,
      results: sortedResults.slice(0, 20), // Limit to 20 results
      total: sortedResults.length,
    };
  } catch (error) {
    console.error("Error searching posts:", error);
    return { success: false, error: error.message, results: [] };
  }
};

// Search users/people
export const searchUsers = async (searchTerm, filters = {}) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, results: [] };
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    // Get all users (limited for performance)
    const usersQuery = query(userRef, limit(100));
    const snapshot = await getDocs(usersQuery);

    const allUsers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter users based on search term
    const filteredUsers = allUsers.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const bio = (user.bio || "").toLowerCase();
      const institution = (user.institution || "").toLowerCase();
      const interests = (user.interests || []).join(" ").toLowerCase();
      const location = (user.location || "").toLowerCase();

      return (
        name.includes(searchTermLower) ||
        email.includes(searchTermLower) ||
        bio.includes(searchTermLower) ||
        institution.includes(searchTermLower) ||
        interests.includes(searchTermLower) ||
        location.includes(searchTermLower)
      );
    });

    // Sort by relevance (name matches first)
    const sortedResults = filteredUsers.sort((a, b) => {
      const aNameMatch = (a.name || "").toLowerCase().includes(searchTermLower);
      const bNameMatch = (b.name || "").toLowerCase().includes(searchTermLower);

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      // Sort by follower count if available
      const aFollowers = (a.followers || []).length;
      const bFollowers = (b.followers || []).length;
      return bFollowers - aFollowers;
    });

    return {
      success: true,
      results: sortedResults.slice(0, 15), // Limit to 15 results
      total: sortedResults.length,
    };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: error.message, results: [] };
  }
};

// Search for trending topics/tags
export const searchTopics = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, results: [] };
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    // Get all posts to extract tags
    const postsQuery = query(docRef, limit(200));
    const snapshot = await getDocs(postsQuery);

    const allPosts = snapshot.docs.map((doc) => doc.data());

    // Extract and count all tags
    const tagCounts = {};
    const topicPosts = {};

    allPosts.forEach((post) => {
      const tags = post.tags || [];
      const postType = post.postType || post.type || "general";

      tags.forEach((tag) => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes(searchTermLower)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;

          if (!topicPosts[tag]) {
            topicPosts[tag] = [];
          }
          topicPosts[tag].push({
            id: post.id || Math.random().toString(),
            title: post.title || post.status,
            author: post.currUser?.name || post.author,
            type: postType,
          });
        }
      });
    });

    // Convert to array and sort by count
    const sortedTopics = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        posts: topicPosts[tag] || [],
        relatedPostsCount: topicPosts[tag]?.length || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      results: sortedTopics,
      total: sortedTopics.length,
    };
  } catch (error) {
    console.error("Error searching topics:", error);
    return { success: false, error: error.message, results: [] };
  }
};

// Combined search function
export const performGlobalSearch = async (searchTerm, category = "all") => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        success: true,
        posts: [],
        users: [],
        topics: [],
        total: 0,
      };
    }

    const searchPromises = [];

    if (category === "all" || category === "posts") {
      searchPromises.push(searchPosts(searchTerm));
    } else {
      searchPromises.push(Promise.resolve({ success: true, results: [] }));
    }

    if (category === "all" || category === "people") {
      searchPromises.push(searchUsers(searchTerm));
    } else {
      searchPromises.push(Promise.resolve({ success: true, results: [] }));
    }

    if (category === "all" || category === "topics") {
      searchPromises.push(searchTopics(searchTerm));
    } else {
      searchPromises.push(Promise.resolve({ success: true, results: [] }));
    }

    const [postsResult, usersResult, topicsResult] = await Promise.all(
      searchPromises
    );

    const totalResults =
      (postsResult.results?.length || 0) +
      (usersResult.results?.length || 0) +
      (topicsResult.results?.length || 0);

    return {
      success: true,
      posts: postsResult.results || [],
      users: usersResult.results || [],
      topics: topicsResult.results || [],
      total: totalResults,
      searchTerm,
    };
  } catch (error) {
    console.error("Error performing global search:", error);
    return {
      success: false,
      error: error.message,
      posts: [],
      users: [],
      topics: [],
      total: 0,
    };
  }
};

// Real-time search suggestions (for autocomplete)
export const getSearchSuggestions = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 1) {
      return { success: true, suggestions: [] };
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    // Get recent posts for title suggestions
    const postsQuery = query(docRef, orderBy("timeStamp", "desc"), limit(50));
    const postsSnapshot = await getDocs(postsQuery);

    // Get users for name suggestions
    const usersQuery = query(userRef, limit(50));
    const usersSnapshot = await getDocs(usersQuery);

    const suggestions = new Set();

    // Add post titles that match
    postsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const title = data.title || data.status || "";
      if (title.toLowerCase().includes(searchTermLower)) {
        suggestions.add(title);
      }

      // Add tags that match
      const tags = data.tags || [];
      tags.forEach((tag) => {
        if (tag.toLowerCase().includes(searchTermLower)) {
          suggestions.add(tag);
        }
      });
    });

    // Add user names that match
    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const name = data.name || "";
      if (name.toLowerCase().includes(searchTermLower)) {
        suggestions.add(name);
      }
    });

    return {
      success: true,
      suggestions: Array.from(suggestions).slice(0, 8), // Limit to 8 suggestions
    };
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    return { success: false, suggestions: [] };
  }
};

/**
 * Real-time user profile listener
 */
export const getUserProfileRealtime = (userId, setUserProfile) => {
  if (!userId) {
    console.error("No user ID provided for real-time profile");
    setUserProfile(null);
    return null;
  }

  console.log("Setting up real-time profile listener for:", userId);

  const userDocRef = doc(userRef, userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() };
        console.log("Profile updated for user:", userId, userData);
        setUserProfile(userData);
      } else {
        console.log("User profile not found for:", userId);
        setUserProfile(null);
      }
    },
    (error) => {
      console.error("Error in real-time profile listener:", error);
      setUserProfile(null);
    }
  );

  return unsubscribe;
};

/**
 * Get multiple users' profile data with real-time updates
 */
export const getMultipleUsersRealtime = (userIds, setUsersProfiles) => {
  if (!userIds || userIds.length === 0) {
    console.log("No user IDs provided for multiple users real-time");
    setUsersProfiles({});
    return null;
  }

  console.log("Setting up real-time listeners for multiple users:", userIds);

  const unsubscribes = [];
  const profilesMap = {};

  // Set up individual listeners for each user
  userIds.forEach((userId) => {
    if (!userId) {
      console.warn("Skipping undefined userId in multiple users listener");
      return;
    }

    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() };
          console.log(`Profile updated for user ${userId}:`, userData);

          profilesMap[userId] = userData;

          // Update the state with the new profiles map
          setUsersProfiles((prev) => ({
            ...prev,
            [userId]: userData,
          }));
        } else {
          console.log(`User profile not found for: ${userId}`);
          // Remove from profiles if user no longer exists
          setUsersProfiles((prev) => {
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
        // Remove from profiles on error
        setUsersProfiles((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    );

    unsubscribes.push(unsubscribe);
  });

  // Return cleanup function that unsubscribes all listeners
  return () => {
    console.log(
      "Cleaning up multiple users real-time listeners for",
      userIds.length,
      "users"
    );
    unsubscribes.forEach((unsubscribe) => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    });
  };
};

/**
 * Enhanced conversations listener that includes real-time profile data
 */
export const getConversationsWithProfiles = (setConversations) => {
  console.log("🔄 Setting up enhanced conversations listener with profiles");

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("❌ No current user for conversations");
    setConversations([]);
    return null;
  }

  console.log("👤 Current user for conversations:", currentUser.uid);

  // Use simple query without composite index
  const q = query(
    conversationsRef,
    where(`participant_${currentUser.uid}`, "==", true)
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      console.log("📨 Enhanced conversations snapshot received");
      console.log("📊 Snapshot size:", snapshot.size);

      const conversations = [];
      const participantIds = new Set();

      // First pass: collect all participant IDs
      snapshot.forEach((doc) => {
        const data = doc.data();
        const otherParticipantId = data.participants?.find(
          (id) => id !== currentUser.uid
        );
        if (otherParticipantId) {
          participantIds.add(otherParticipantId);
        }
      });

      // Load all participant profile data
      const participantProfiles = {};
      const profilePromises = Array.from(participantIds).map(
        async (participantId) => {
          try {
            const profileData = await getUserDataByUID(participantId);
            if (profileData) {
              participantProfiles[participantId] = profileData;
            }
          } catch (error) {
            console.error(`Error loading profile for ${participantId}:`, error);
          }
        }
      );

      await Promise.all(profilePromises);

      // Second pass: build conversations with profile data
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("💬 Conversation doc:", doc.id, data);

        const otherParticipantId = data.participants?.find(
          (id) => id !== currentUser.uid
        );
        const otherParticipantName =
          data.participantNames?.[otherParticipantId];

        if (otherParticipantId && otherParticipantName) {
          const participantProfile = participantProfiles[otherParticipantId];

          conversations.push({
            id: doc.id,
            ...data,
            otherParticipant: {
              id: otherParticipantId,
              name: otherParticipantName,
              avatar: participantProfile?.photoURL || null,
              profile: participantProfile || null,
            },
            unreadCount: data.unreadCount?.[currentUser.uid] || 0,
          });
        }
      });

      // Sort by updatedAt manually (no composite index needed)
      conversations.sort((a, b) => {
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(0);
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(0);
        return bTime - aTime;
      });

      console.log("✅ Processed enhanced conversations:", conversations.length);
      setConversations(conversations);
    },
    (error) => {
      console.error("❌ Error in enhanced conversations listener:", error);
      setConversations([]);
    }
  );

  return unsubscribe;
};

/**
 * Enhanced sendMessage that updates participant names in real-time
 */
export const sendMessageEnhanced = async (receiverId, content) => {
  console.log("🚀 Starting enhanced sendMessage function");
  console.log("Receiver ID:", receiverId);
  console.log("Content:", content);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("❌ No current user");
      throw new Error("User not authenticated");
    }

    console.log("✅ Current user:", currentUser.uid);

    // Get fresh user data to ensure names are up to date
    const [senderData, receiverData] = await Promise.all([
      getUserDataByUID(currentUser.uid),
      getUserDataByUID(receiverId),
    ]);

    console.log("✅ Sender data:", senderData);
    console.log("✅ Receiver data:", receiverData);

    if (!senderData || !receiverData) {
      console.error("❌ Missing user data");
      throw new Error("User data not found");
    }

    const conversationId = createConversationId(currentUser.uid, receiverId);
    console.log("✅ Conversation ID:", conversationId);

    // Create message with fresh user data
    const messageData = {
      conversationId,
      senderId: currentUser.uid,
      receiverId,
      content: content.trim(),
      timestamp: firebaseServerTimestamp(),
      clientTimestamp: new Date(),
      status: "sent",
      deleted: false,
      senderName: senderData.name || "Unknown User",
      receiverName: receiverData.name || "Unknown User",
      // Add profile photos for immediate display
      senderPhoto: senderData.photoURL || null,
      receiverPhoto: receiverData.photoURL || null,
      createdAt: firebaseServerTimestamp(),
    };

    console.log("📝 Enhanced message data:", messageData);

    // Add message to Firestore
    console.log("💾 Adding message to Firestore...");
    const messageDocRef = await addDoc(messagesRef, messageData);
    console.log("✅ Message added with ID:", messageDocRef.id);

    // Create/update conversation with fresh profile data
    const conversationData = {
      participants: [currentUser.uid, receiverId],
      participantNames: {
        [currentUser.uid]: senderData.name || "Unknown User",
        [receiverId]: receiverData.name || "Unknown User",
      },
      participantPhotos: {
        [currentUser.uid]: senderData.photoURL || null,
        [receiverId]: receiverData.photoURL || null,
      },
      lastMessage: {
        content: content.trim(),
        senderId: currentUser.uid,
        timestamp: firebaseServerTimestamp(),
        clientTimestamp: new Date(),
      },
      updatedAt: firebaseServerTimestamp(),
      unreadCount: {
        [currentUser.uid]: 0,
        [receiverId]: 1,
      },
      [`participant_${currentUser.uid}`]: true,
      [`participant_${receiverId}`]: true,
    };

    console.log("💬 Enhanced conversation data:", conversationData);

    const conversationDocRef = doc(conversationsRef, conversationId);
    const existingConv = await getDoc(conversationDocRef);

    if (existingConv.exists()) {
      console.log("📝 Updating existing conversation with fresh data...");
      const existing = existingConv.data();
      await updateDoc(conversationDocRef, {
        // Update participant names and photos in case they changed
        participantNames: conversationData.participantNames,
        participantPhotos: conversationData.participantPhotos,
        lastMessage: conversationData.lastMessage,
        updatedAt: firebaseServerTimestamp(),
        [`unreadCount.${receiverId}`]:
          (existing.unreadCount?.[receiverId] || 0) + 1,
        [`unreadCount.${currentUser.uid}`]: 0,
      });
      console.log("✅ Conversation updated with fresh profile data");
    } else {
      console.log("🆕 Creating new conversation with profile data...");
      await setDoc(conversationDocRef, {
        ...conversationData,
        createdAt: firebaseServerTimestamp(),
      });
      console.log("✅ New conversation created with profile data");
    }

    console.log("🎉 Enhanced message sent successfully!");
    return { success: true, messageId: messageDocRef.id, conversationId };
  } catch (error) {
    console.error("❌ Error in enhanced sendMessage:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Function to refresh conversation participant data
 */
export const refreshConversationParticipants = async (conversationId) => {
  try {
    console.log(
      "🔄 Refreshing participant data for conversation:",
      conversationId
    );

    const conversationRef = doc(conversationsRef, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      console.error("❌ Conversation not found");
      return { success: false, error: "Conversation not found" };
    }

    const conversationData = conversationSnap.data();
    const participants = conversationData.participants || [];

    // Get fresh data for all participants
    const participantUpdates = {};
    const photoUpdates = {};

    for (const participantId of participants) {
      const userData = await getUserDataByUID(participantId);
      if (userData) {
        participantUpdates[participantId] = userData.name || "Unknown User";
        photoUpdates[participantId] = userData.photoURL || null;
      }
    }

    // Update conversation with fresh data
    await updateDoc(conversationRef, {
      participantNames: participantUpdates,
      participantPhotos: photoUpdates,
      updatedAt: firebaseServerTimestamp(),
    });

    console.log("✅ Conversation participant data refreshed");
    return { success: true };
  } catch (error) {
    console.error("❌ Error refreshing conversation participants:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Batch refresh all user conversations when profile is updated
 */
export const refreshAllUserConversations = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("❌ No current user for refreshing conversations");
      return { success: false, error: "User not authenticated" };
    }

    console.log("🔄 Refreshing all conversations for user:", currentUser.uid);

    // Get all conversations for current user
    const q = query(
      conversationsRef,
      where(`participant_${currentUser.uid}`, "==", true)
    );
    const snapshot = await getDocs(q);

    // Refresh each conversation
    const refreshPromises = snapshot.docs.map((doc) =>
      refreshConversationParticipants(doc.id)
    );

    await Promise.all(refreshPromises);

    console.log("✅ All conversations refreshed");
    return { success: true, refreshedCount: snapshot.size };
  } catch (error) {
    console.error("❌ Error refreshing all conversations:", error);
    return { success: false, error: error.message };
  }
};

// Enhanced editUser function that also updates conversations
export const editUserWithConversationUpdate = async (payload) => {
  console.log("🔄 Updating user with conversation refresh...");

  // First update the user document
  const userUpdateResult = await editUser(payload);

  if (userUpdateResult.success) {
    // If name or photo was updated, refresh all conversations
    if (payload.name || payload.photoURL !== undefined) {
      console.log("🔄 Profile data changed, refreshing conversations...");
      await refreshAllUserConversations();
    }
  }

  return userUpdateResult;
};

// Create notifications collection reference
const notificationsRef = collection(db, "notifications");

/**
 * Create a notification when someone likes a post
 */
export const createLikeNotification = async (
  postId,
  postAuthorUID,
  postTitle
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === postAuthorUID) {
      // Don't notify if liking own post
      return { success: true };
    }

    // Get current user data for notification
    const userData = await getUserDataByUID(currentUser.uid);
    if (!userData) {
      console.error("Could not get user data for notification");
      return { success: false, error: "User data not found" };
    }

    // Create new notification with denormalized fields to avoid composite indexes
    const notificationData = {
      type: "like",
      postId: postId,
      postTitle: postTitle || "your post",
      fromUID: currentUser.uid,
      fromName: userData.name || "Someone",
      fromPhoto: userData.photoURL || null,
      toUID: postAuthorUID,
      timestamp: serverTimestamp(),
      clientTimestamp: new Date(), // Fallback for sorting
      read: false,
      createdAt: serverTimestamp(),
      // Denormalized fields to avoid composite queries
      [`recipient_${postAuthorUID}`]: true,
      [`sender_${currentUser.uid}`]: true,
      [`post_${postId}`]: true,
    };

    await addDoc(notificationsRef, notificationData);
    console.log("Like notification created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating like notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a notification when someone comments on a post
 */
export const createCommentNotification = async (
  postId,
  postAuthorUID,
  postTitle,
  commentText
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === postAuthorUID) {
      // Don't notify if commenting on own post
      return { success: true };
    }

    // Get current user data for notification
    const userData = await getUserDataByUID(currentUser.uid);
    if (!userData) {
      console.error("Could not get user data for notification");
      return { success: false, error: "User data not found" };
    }

    // Create notification with denormalized fields
    const notificationData = {
      type: "comment",
      postId: postId,
      postTitle: postTitle || "your post",
      commentText:
        commentText.length > 100
          ? commentText.substring(0, 100) + "..."
          : commentText,
      fromUID: currentUser.uid,
      fromName: userData.name || "Someone",
      fromPhoto: userData.photoURL || null,
      toUID: postAuthorUID,
      timestamp: serverTimestamp(),
      clientTimestamp: new Date(),
      read: false,
      createdAt: serverTimestamp(),
      // Denormalized fields
      [`recipient_${postAuthorUID}`]: true,
      [`sender_${currentUser.uid}`]: true,
      [`post_${postId}`]: true,
    };

    await addDoc(notificationsRef, notificationData);
    console.log("Comment notification created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating comment notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a notification when someone follows you
 */
export const createFollowNotification = async (targetUID) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUID) {
      return { success: true };
    }

    // Get current user data for notification
    const userData = await getUserDataByUID(currentUser.uid);
    if (!userData) {
      console.error("Could not get user data for notification");
      return { success: false, error: "User data not found" };
    }

    // Create new notification with denormalized fields
    const notificationData = {
      type: "follow",
      fromUID: currentUser.uid,
      fromName: userData.name || "Someone",
      fromPhoto: userData.photoURL || null,
      toUID: targetUID,
      timestamp: serverTimestamp(),
      clientTimestamp: new Date(),
      read: false,
      createdAt: serverTimestamp(),
      // Denormalized fields
      [`recipient_${targetUID}`]: true,
      [`sender_${currentUser.uid}`]: true,
    };

    await addDoc(notificationsRef, notificationData);
    console.log("Follow notification created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating follow notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notifications for current user with real-time updates - SIMPLIFIED VERSION
 */
export const getUsersNotifications = (setNotifications) => {
  console.log("🔔 Setting up notifications listener");

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("❌ No current user for notifications");
    setNotifications([]);
    return () => {}; // Return empty function to prevent errors
  }

  console.log("👤 Current user for notifications:", currentUser.uid);

  // Use simple query without composite index - just filter by recipient
  const q = query(
    notificationsRef,
    where(`recipient_${currentUser.uid}`, "==", true),
    limit(50) // Limit to last 50 notifications for performance
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("📨 Notifications snapshot received");
      console.log("📊 Notifications count:", snapshot.size);

      const notifications = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("🔔 Notification doc:", doc.id, data);

        notifications.push({
          id: doc.id,
          ...data,
          // Ensure we have a proper timestamp for sorting
          timestamp:
            data.timestamp?.toDate() || data.clientTimestamp || new Date(),
        });
      });

      // Sort by timestamp manually (newest first)
      notifications.sort((a, b) => {
        const aTime =
          a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const bTime =
          b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return bTime.getTime() - aTime.getTime();
      });

      console.log("✅ Processed notifications:", notifications.length);
      setNotifications(notifications);
    },
    (error) => {
      console.error("❌ Error in notifications listener:", error);
      setNotifications([]);
    }
  );

  console.log("✅ Notifications listener set up successfully");
  return unsubscribe; // Return the unsubscribe function
};

/**
 * Get unread notifications count - SIMPLIFIED VERSION
 */
export const getUnreadNotificationsCount = (setUnreadCount) => {
  console.log("🔔 Setting up unread notifications count listener");

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("❌ No current user for unread count");
    setUnreadCount(0);
    return () => {}; // Return empty function
  }

  // Use simple query without composite index
  const q = query(
    notificationsRef,
    where(`recipient_${currentUser.uid}`, "==", true),
    limit(100) // Limit for performance
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log("📊 Unread count snapshot received");

      let unreadCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.read === false || data.read === undefined) {
          unreadCount++;
        }
      });

      console.log("📊 Total unread notifications:", unreadCount);
      setUnreadCount(unreadCount);
    },
    (error) => {
      console.error("❌ Error in unread count listener:", error);
      setUnreadCount(0);
    }
  );

  return unsubscribe;
};

/**
 * Mark notification as read
 */
export const markNotificationsAsRead = async (notificationId) => {
  try {
    console.log("✅ Marking notification as read:", notificationId);

    const notificationRef = doc(notificationsRef, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });

    console.log("✅ Notification marked as read successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    console.log("🗑️ Deleting notification:", notificationId);

    await deleteDoc(doc(notificationsRef, notificationId));

    console.log("✅ Notification deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove like notification when user unlikes a post - SIMPLIFIED
 */
export const removeLikeNotification = async (postId, postAuthorUID) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: true };

    console.log("🗑️ Removing like notification for post:", postId);

    // Find and delete the like notification using simple query
    const q = query(
      notificationsRef,
      where(`recipient_${postAuthorUID}`, "==", true),
      where(`sender_${currentUser.uid}`, "==", true),
      where(`post_${postId}`, "==", true)
    );

    const querySnapshot = await getDocs(q);

    // Delete matching like notifications
    const deletePromises = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (
        data.type === "like" &&
        data.postId === postId &&
        data.fromUID === currentUser.uid
      ) {
        deletePromises.push(deleteDoc(doc(notificationsRef, docSnapshot.id)));
      }
    });

    await Promise.all(deletePromises);
    console.log("✅ Like notification removed successfully");

    return { success: true };
  } catch (error) {
    console.error("❌ Error removing like notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced toggleLike function that creates/removes notifications
 */
export const toggleLikeWithNotification = async (postId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to like posts");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.error("Post not found");
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];
    const isLiked = likedBy.some((like) => like.uid === currentUser.uid);

    if (isLiked) {
      // Unlike the post - remove the user's like object
      const updatedLikedBy = likedBy.filter(
        (like) => like.uid !== currentUser.uid
      );
      await updateDoc(postRef, {
        likedBy: updatedLikedBy,
        likes: Math.max(0, (postData.likes || 0) - 1),
      });

      // Remove like notification
      const postAuthorUID = postData.currUser?.uid || postData.authorUID;
      if (postAuthorUID && postAuthorUID !== currentUser.uid) {
        await removeLikeNotification(postId, postAuthorUID);
      }
    } else {
      // Like the post - get fresh user data and add like
      const userData = await getUserDataByUID(currentUser.uid);

      const userName =
        userData?.name ||
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "User";

      const likeObject = {
        uid: currentUser.uid,
        name: userName,
        email: currentUser.email || "No email",
        timestamp: new Date(),
        userPhoto: userData?.photoURL || currentUser.photoURL,
        userBio: userData?.bio || "",
      };

      await updateDoc(postRef, {
        likedBy: arrayUnion(likeObject),
        likes: (postData.likes || 0) + 1,
      });

      // Create like notification
      const postAuthorUID = postData.currUser?.uid || postData.authorUID;
      if (postAuthorUID && postAuthorUID !== currentUser.uid) {
        await createLikeNotification(
          postId,
          postAuthorUID,
          postData.title || postData.status
        );
      }
    }

    return { success: true, isLiked: !isLiked };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced addComment function that creates notifications
 */
export const addCommentWithNotification = async (postId, commentText) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to comment");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.error("Post not found");
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();

    // Get fresh user data
    const userData = await getUserDataByUID(currentUser.uid);

    const userEmail = currentUser.email || userData?.email || "";
    const userName =
      userData?.name ||
      currentUser.displayName ||
      (userEmail ? userEmail.split("@")[0] : "") ||
      "Anonymous User";

    // Create comment object
    const commentObject = {
      id: Date.now() + Math.random().toString(36).substring(2, 15),
      text: commentText.trim(),
      uid: currentUser.uid,
      author: userName,
      email: userEmail,
      timestamp: new Date(),
      likes: 0,
      likedBy: [],
      replies: [],
      userPhoto: userData?.photoURL || currentUser.photoURL || "",
    };

    const currentComments = postData.comments || 0;
    const commentsList = postData.commentsList || [];

    // Update post with new comment
    await updateDoc(postRef, {
      comments: currentComments + 1,
      commentsList: arrayUnion(commentObject),
    });

    // Create comment notification
    const postAuthorUID = postData.currUser?.uid || postData.authorUID;
    if (postAuthorUID && postAuthorUID !== currentUser.uid) {
      await createCommentNotification(
        postId,
        postAuthorUID,
        postData.title || postData.status,
        commentText
      );
    }

    console.log("Comment added successfully with notification:", commentObject);
    return { success: true, comment: commentObject };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: error.message };
  }
};

// Add this function to your existing FireStore.jsx file

/**
 * Delete a post from Firestore
 */
export const deletePost = async (postId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User must be logged in to delete posts");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const postRef = doc(docRef, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      console.error("Post not found");
      return { success: false, error: "Post not found" };
    }

    const postData = postSnap.data();

    // Check if the current user is the author of the post
    const canDelete =
      postData.currUser?.uid === currentUser.uid ||
      postData.authorId === currentUser.uid ||
      postData.currUser?.email === currentUser.email;

    if (!canDelete) {
      return {
        success: false,
        error: "You don't have permission to delete this post",
      };
    }

    // Delete the post document
    await deleteDoc(postRef);

    console.log("Post deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: error.message };
  }
};
