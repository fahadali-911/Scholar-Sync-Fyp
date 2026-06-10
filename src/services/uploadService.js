// 🚨 Get credentials from environment variables (more secure)
const CLOUD_NAME = "du9atobjy";
const UPLOAD_PRESET = "ResearchHub";

// Validation: Check if environment variables are set
if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.error("❌ Missing Cloudinary configuration!");
  console.error(
    "Please set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET in your .env file"
  );
}

// Cloudinary upload URL
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

// Upload file to Cloudinary
export const uploadFile = async (file, folder = "research-hub") => {
  try {
    // Check if configuration is valid
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        "Cloudinary configuration missing. Check your .env file."
      );
    }

    // Validate file
    if (!file) {
      throw new Error("No file provided");
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB");
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not supported");
    }

    console.log("🚀 Uploading file:", file.name);
    console.log("📁 To folder:", folder);
    console.log("☁️ Cloud name:", CLOUD_NAME);
    console.log("🔧 Upload preset:", UPLOAD_PRESET);

    // Create form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", folder);

    // Add resource type based on file type
    if (file.type.startsWith("image/")) {
      formData.append("resource_type", "image");
    } else {
      formData.append("resource_type", "raw"); // For PDFs and documents
    }

    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Upload failed:", errorData);
      throw new Error(
        `Upload failed: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    console.log("✅ Upload successful:", data.secure_url);

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      originalName: file.name,
      size: data.bytes,
      type: data.resource_type,
      format: data.format,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("❌ Upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Rest of functions remain the same...
export const validateFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push("No file selected");
    return { valid: false, errors };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push("File size must be less than 10MB");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push("File type not supported");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Debug function to check configuration
export const debugConfig = () => {
  console.log("🔍 Cloudinary Configuration Debug:");
  console.log("Cloud Name:", CLOUD_NAME || "❌ Missing");
  console.log("Upload Preset:", UPLOAD_PRESET || "❌ Missing");
  console.log("Upload URL:", CLOUDINARY_UPLOAD_URL);

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.log("");
    console.log("🚨 Configuration Issues:");
    console.log("1. Create a .env file in your project root");
    console.log("2. Add these lines to your .env file:");
    console.log("   REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name");
    console.log("   REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-upload-preset");
    console.log("3. Restart your development server");
  } else {
    console.log("✅ Configuration looks good!");
  }
};
export const getFileTypeIcon = (fileType) => {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType === "application/pdf") return "📄";
  if (fileType.includes("word")) return "📝";
  if (fileType === "text/plain") return "📋";
  return "📁";
};
