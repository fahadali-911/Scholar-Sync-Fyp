import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  uploadFile,
  validateFile,
  formatFileSize,
  getFileTypeIcon,
} from "../services/uploadService";

const FileUpload = ({
  onFileUpload,
  onFileRemove,
  accept = "*",
  maxFiles = 1,
  className = "",
}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);

    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }

    setUploading(true);

    for (const file of fileArray) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(`Error with ${file.name}: ${validation.errors.join(", ")}`);
        continue;
      }

      // Set initial progress
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: { progress: 0, status: "uploading" },
      }));

      try {
        // Upload file
        const result = await uploadFile(file, "research-hub/posts");

        if (result.success) {
          const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: result.url,
            publicId: result.publicId,
            uploadedAt: new Date(),
          };

          setUploadedFiles((prev) => [...prev, fileData]);
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { progress: 100, status: "completed" },
          }));

          // Notify parent component
          if (onFileUpload) {
            onFileUpload(fileData);
          }

          // Remove progress after delay
          setTimeout(() => {
            setUploadProgress((prev) => {
              const updated = { ...prev };
              delete updated[file.name];
              return updated;
            });
          }, 2000);
        } else {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { progress: 0, status: "error", error: result.error },
          }));
          alert(`Upload failed for ${file.name}: ${result.error}`);
        }
      } catch (error) {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: { progress: 0, status: "error", error: error.message },
        }));
        alert(`Upload failed for ${file.name}: ${error.message}`);
      }
    }

    setUploading(false);
  };

  // Handle file removal
  const handleFileRemove = (fileId) => {
    const fileToRemove = uploadedFiles.find((f) => f.id === fileId);
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));

    if (onFileRemove && fileToRemove) {
      onFileRemove(fileToRemove);
    }
  };

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

  // Get file icon
  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (fileType === "application/pdf") return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
              Click to upload
            </span>{" "}
            or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            Images, PDFs, Word documents (max 10MB each)
          </p>
          {maxFiles > 1 && (
            <p className="text-xs text-gray-500 mt-1">
              Maximum {maxFiles} files
            </p>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {fileName}
                </span>
                <div className="flex items-center space-x-2">
                  {progress.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {progress.status === "completed" && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {progress.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              {progress.status === "uploading" && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
              )}

              {progress.status === "error" && (
                <p className="text-xs text-red-600 mt-1">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files:</h4>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-500">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} •{" "}
                    {file.type.split("/")[1].toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.open(file.url, "_blank")}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="View file"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleFileRemove(file.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
