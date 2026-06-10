// Create this as src/utils/profileImageUtils.js
// Utilities to ensure consistent profile image handling across all components

/**
 * Get the profile image URL from user data, handling different data structures
 * @param {Object} user - User data object
 * @returns {string|null} - Profile image URL or null if not found
 */
export const getProfileImageURL = (user) => {
  if (!user) return null;

  // Check various possible property names for profile images
  return (
    user.photoURL ||
    user.profilePicture ||
    user.avatar ||
    user.profileImage ||
    user.image ||
    null
  );
};

/**
 * Generate user initials from name
 * @param {string} name - User's name
 **/
