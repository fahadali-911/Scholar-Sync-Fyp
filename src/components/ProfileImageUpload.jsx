import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { uploadFile, validateFile } from "../services/uploadService";

const ProfileImageUpload = ({
  currentImage,
  onImageUpload,
  onImageRemove,
  type = "profile", // 'profile' or 'cover'
  className = "",
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const isProfile = type === "profile";
  const isCover = type === "cover";

  // Handle file selection
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(`Error: ${validation.errors.join(", ")}`);
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Check file size (max 5MB for profile images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload to specific folder based on type
      const folder = isProfile
        ? "research-hub/profiles"
        : "research-hub/covers";

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadFile(file, folder);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        const imageData = {
          url: result.url,
          publicId: result.publicId,
          originalName: file.name,
          size: result.size,
          uploadedAt: new Date(),
          previewUrl: preview,
        };

        // Notify parent component for preview
        if (onImageUpload) {
          onImageUpload(imageData);
        }

        // Small delay to show success state
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } else {
        alert(`Upload failed: ${result.error}`);
        setUploadProgress(0);
        // Clean up preview URL if upload failed
        URL.revokeObjectURL(preview);
        setPreviewUrl(null);
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
      setUploadProgress(0);
      // Clean up preview URL if upload failed
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  // Handle image removal
  const handleImageRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (onImageRemove) {
      onImageRemove();
    }
  };

  // Clear preview when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={uploading}
      />

      {/* Profile Picture Upload */}
      {isProfile && (
        <div className="relative group w-full h-full">
          <div
            className={`w-full h-full rounded-full overflow-hidden bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ${
              dragActive ? "bg-blue-500 bg-opacity-20" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            {uploading ? (
              <div className="text-white text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                <div className="text-xs">{uploadProgress}%</div>
              </div>
            ) : (
              <div className="text-white text-center">
                <Camera className="h-6 w-6 mx-auto mb-1" />
                <div className="text-xs">
                  {currentImage ? "Change" : "Upload"}
                </div>
              </div>
            )}
          </div>

          {/* Remove button for current image */}
          {currentImage && !uploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleImageRemove();
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Remove current image"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Cover Photo Upload */}
      {isCover && (
        <div className="relative group w-full h-full">
          <div
            className={`w-full h-full overflow-hidden bg-transparent flex items-center justify-center cursor-pointer transition-all duration-200 ${
              dragActive ? "bg-blue-500 bg-opacity-20" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Cover upload area clicked"); // Debug log
              triggerFileInput();
            }}
          >
            {uploading ? (
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <div className="text-sm font-medium">Uploading...</div>
                <div className="text-xs">{uploadProgress}%</div>
                <div className="w-32 h-2 bg-white bg-opacity-30 rounded-full mt-2">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-white text-center">
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-sm font-medium">
                      {currentImage ? "Change Cover" : "Add Cover Photo"}
                    </div>
                    <div className="text-xs opacity-75">
                      Click or drag to upload
                    </div>
                  </div>

                  {/* Remove button for cover photo */}
                  {currentImage && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Remove cover button clicked"); // Debug log
                        handleImageRemove();
                      }}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200"
                      title="Remove current cover"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload status messages */}
      {uploading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-xs">
          Uploading {isProfile ? "profile picture" : "cover photo"}...
        </div>
      )}

      {/* Success message */}
      {uploadProgress === 100 && !uploading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1">
          <Check className="h-3 w-3" />
          <span>Upload complete!</span>
        </div>
      )}

      {/* Upload instructions - Only show when no current image and not uploading */}
      {!currentImage && !uploading && !previewUrl && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            {isProfile
              ? "Click to upload profile picture"
              : "Click to upload cover photo"}
          </p>
          <p className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded mt-1">
            Max 5MB • JPG, PNG, GIF, WEBP
          </p>
        </div>
      )}

      {/* Drag overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-30 border-2 border-blue-400 border-dashed rounded-lg flex items-center justify-center">
          <div className="text-blue-800 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm font-medium">Drop image here</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
