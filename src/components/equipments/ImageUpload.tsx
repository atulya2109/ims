"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@ims/lib/utils";
import type { ImageUploadProps } from "@ims/types/equipment";

/**
 * ImageUpload Component
 *
 * Provides drag-and-drop and file picker functionality for selecting equipment images.
 * Features:
 * - Drag and drop zone
 * - Multiple file selection (max 5 images)
 * - Image preview
 * - File validation (type, size)
 * - Remove from preview
 *
 * Note: This is a controlled component. Parent handles the actual upload.
 */
export function ImageUpload({
  existingImages = [],
  selectedFiles,
  onFilesChange,
  maxImages = 5,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate remaining upload slots
  const remainingSlots = maxImages - existingImages.length - selectedFiles.length;

  // Generate previews when selectedFiles change
  useEffect(() => {
    // Clean up old previews
    previews.forEach((url) => URL.revokeObjectURL(url));

    // Generate new previews
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup on unmount
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return `${file.name}: Only JPEG, PNG, and WebP images are allowed`;
    }

    if (file.size > maxSize) {
      return `${file.name}: File size must be less than 10MB`;
    }

    return null;
  };

  /**
   * Process selected files
   */
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      // Check total count
      if (selectedFiles.length + fileArray.length + existingImages.length > maxImages) {
        newErrors.push(`Maximum ${maxImages} images allowed`);
        setErrors(newErrors);
        return;
      }

      // Validate each file
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      if (newErrors.length > 0) {
        setErrors(newErrors);
      } else {
        setErrors([]);
      }

      // Update parent with new files
      onFilesChange([...selectedFiles, ...validFiles]);
    },
    [selectedFiles, existingImages, maxImages, onFilesChange]
  );

  /**
   * Handle drag and drop events
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  /**
   * Remove file from preview
   */
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    setErrors([]);
  };

  /**
   * Open file picker
   */
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      {remainingSlots > 0 && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFilePicker}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Drag and drop images here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WebP • Max 10MB per file • Up to {remainingSlots} more{" "}
            {remainingSlots === 1 ? "image" : "images"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      )}

      {/* Max images reached message */}
      {remainingSlots === 0 && selectedFiles.length === 0 && (
        <div className="border border-muted rounded-lg p-4 text-center">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Maximum of {maxImages} images reached
          </p>
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image Previews */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {selectedFiles.length} {selectedFiles.length === 1 ? "image" : "images"}{" "}
            ready to upload
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
              >
                <img
                  src={previews[index]}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
