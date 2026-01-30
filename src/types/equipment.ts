/**
 * Equipment Image Upload Feature - Type Definitions
 *
 * These types extend the existing equipment schema to support image uploads.
 */

/**
 * Represents a single image associated with equipment
 */
export interface EquipmentImage {
  /** Unique identifier for the image (UUID) */
  id: string;

  /** Original filename uploaded by the user */
  filename: string;

  /** Server path to the full-size image */
  originalPath: string;

  /** Server path to the thumbnail image */
  thumbnailPath: string;

  /** MIME type of the image (e.g., 'image/jpeg', 'image/png', 'image/webp') */
  mimeType: string;

  /** File size in bytes */
  size: number;

  /** Timestamp when the image was uploaded */
  uploadedAt: Date;

  /** Display order (0-indexed, for image reordering feature) */
  order: number;
}

/**
 * Extended Equipment interface with image support
 */
export interface Equipment {
  /** Unique equipment identifier (UUID) */
  id: string;

  /** Equipment name/product name */
  name: string;

  /** Storage or deployment location */
  location: string;

  /** Total quantity in inventory */
  quantity: number;

  /** Currently available for checkout */
  available: number;

  /** Marks single-item equipment (quantity always 1) */
  unique: boolean;

  /** Optional university asset ID */
  assetId?: string;

  /** Array of images associated with this equipment (NEW) */
  images?: EquipmentImage[];
}

/**
 * API Response for image upload endpoint
 * POST /api/equipments/images
 */
export interface ImageUploadResponse {
  /** Whether the upload was successful */
  success: boolean;

  /** Array of successfully uploaded images with metadata */
  images: EquipmentImage[];

  /** Optional array of error messages for failed uploads */
  errors?: string[];
}

/**
 * API Request for image deletion endpoint
 * DELETE /api/equipments/images
 */
export interface ImageDeleteRequest {
  /** Equipment ID that owns the images */
  equipmentId: string;

  /** Array of image IDs to delete */
  imageIds: string[];
}

/**
 * API Response for image deletion endpoint
 * DELETE /api/equipments/images
 */
export interface ImageDeleteResponse {
  /** Whether the deletion was successful */
  success: boolean;

  /** Number of images successfully deleted */
  deletedCount: number;
}

/**
 * Props for ImageUpload component
 */
export interface ImageUploadProps {
  /** Existing images for this equipment */
  existingImages: EquipmentImage[];

  /** Selected files (controlled component) */
  selectedFiles: File[];

  /** Callback to update selected files */
  onFilesChange: (files: File[]) => void;

  /** Maximum number of images allowed (default: 5) */
  maxImages?: number;
}

/**
 * Props for ImageGallery component
 */
export interface ImageGalleryProps {
  /** Array of images to display */
  images: EquipmentImage[];

  /** Callback when images are deleted */
  onDelete: (imageIds: string[]) => void;

  /** Optional callback for image reordering */
  onReorder?: (newOrder: string[]) => void;

  /** Whether the gallery is read-only (no delete button) */
  readOnly?: boolean;

  /** Equipment ID (for constructing image URLs) */
  equipmentId?: string;
}
