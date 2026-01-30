"use client";

import React, { useState } from "react";
import { Trash2, X, Image as ImageIcon, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@ims/components/ui/dialog";
import { Button } from "@ims/components/ui/button";
import type { ImageGalleryProps } from "@ims/types/equipment";

/**
 * ImageGallery Component
 *
 * Displays equipment images in a thumbnail grid with lightbox viewing and delete functionality.
 * Features:
 * - Thumbnail grid display
 * - Click to view full size in modal (lightbox)
 * - Delete confirmation dialog
 * - Empty state when no images
 * - Loading states
 * - Keyboard navigation in lightbox
 *
 * PHASE 2: Using MOCK image URLs and hardcoded states
 * API integration will be added in Phase 3
 */
export function ImageGallery({
  images = [],
  onDelete,
  onReorder,
  readOnly = false,
  equipmentId,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  /**
   * Open lightbox with selected image
   */
  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  /**
   * Close lightbox
   */
  const closeLightbox = () => {
    setSelectedImage(null);
  };

  /**
   * Navigate to next image in lightbox
   */
  const nextImage = () => {
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  /**
   * Navigate to previous image in lightbox
   */
  const prevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  /**
   * Open delete confirmation dialog
   */
  const openDeleteDialog = (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteDialogOpen(true);
  };

  /**
   * Handle image deletion
   *
   * DELETE /api/equipments/images
   * - Request: { equipmentId: string, imageIds: string[] }
   * - Response: { success: boolean, deletedCount: number }
   */
  const handleDelete = async () => {
    if (!imageToDelete) return;

    try {
      const response = await fetch("/api/equipments/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipmentId: equipmentId,
          imageIds: [imageToDelete],
        }),
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      const data = await response.json();

      if (data.success) {
        onDelete([imageToDelete]);
        setDeleteDialogOpen(false);
        setImageToDelete(null);
      } else {
        alert("Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete image. Please try again.");
    }
  };

  /**
   * Get image URL for display
   *
   * GET /api/equipments/images/[imageId]?type=thumbnail|original
   * - Returns binary image data with proper Content-Type headers
   */
  const getImageUrl = (imageId: string, type: "thumbnail" | "original" = "thumbnail"): string => {
    return `/api/equipments/images/${imageId}?type=${type}`;
  };

  // Empty state
  if (images.length === 0) {
    return (
      <div className="border border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <img
              src={getImageUrl(image.id, "thumbnail")}
              alt={image.filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(index);
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                aria-label="View full size"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>

              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(image.id);
                  }}
                  className="p-2 bg-destructive/80 hover:bg-destructive rounded-full transition-colors"
                  aria-label="Delete image"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white truncate">{image.filename}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      {selectedImage !== null && (
        <Dialog open={selectedImage !== null} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {images[selectedImage].filename}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedImage + 1} of {images.length})
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="relative">
              <img
                src={getImageUrl(images[selectedImage].id, "original")}
                alt={images[selectedImage].filename}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />

              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  {selectedImage > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={prevImage}
                    >
                      ←
                    </Button>
                  )}

                  {selectedImage < images.length - 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={nextImage}
                    >
                      →
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Image metadata */}
            <div className="text-sm text-muted-foreground">
              <p>
                Uploaded:{" "}
                {new Date(images[selectedImage].uploadedAt).toLocaleDateString()}
              </p>
            </div>

            <DialogFooter>
              {!readOnly && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    openDeleteDialog(images[selectedImage].id);
                    closeLightbox();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Image
                </Button>
              )}
              <Button variant="outline" onClick={closeLightbox}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this image? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setImageToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
