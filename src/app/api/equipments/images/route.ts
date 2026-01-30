import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { getDb } from "@ims/lib/mongodb";
import { logApiRequest, logApiResponse, logDatabaseOperation, logError } from "@ims/lib/logger";

/**
 * Equipment Images API Route
 *
 * Handles image upload and deletion for equipment items
 * - POST: Upload images (multipart/form-data)
 * - DELETE: Remove images
 */

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "equipment-images");
const ORIGINALS_DIR = path.join(UPLOAD_DIR, "originals");
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, "thumbnails");

// Ensure upload directories exist
async function ensureUploadDirs() {
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
}

/**
 * Convert Next.js Request to Node.js IncomingMessage for formidable
 */
async function convertToNodeRequest(request: NextRequest): Promise<Readable & { headers: Record<string, string>; method: string; url: string }> {
  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create a readable stream from the buffer
  const readable = Readable.from(buffer);

  // Mock IncomingMessage interface for formidable
  return Object.assign(readable, {
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: request.url,
  });
}

/**
 * Process image with Sharp: resize and optimize
 */
async function processImage(
  inputPath: string,
  outputPath: string,
  type: "original" | "thumbnail"
): Promise<void> {
  if (type === "thumbnail") {
    // Thumbnail: 300x300 cover crop, quality 80
    await sharp(inputPath)
      .resize(300, 300, { fit: "cover", position: "center" })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  } else {
    // Original: max 2000x2000, quality 90, strip EXIF
    await sharp(inputPath)
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(outputPath);
  }
}

/**
 * POST - Upload images for equipment
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  logApiRequest("POST", "/api/equipments/images");

  try {
    // Ensure upload directories exist
    await ensureUploadDirs();

    // Convert Next.js Request to Node.js request for formidable
    const nodeReq = await convertToNodeRequest(request);

    // Parse multipart form data
    const form = formidable({
      maxFiles: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: (part) => {
        return part.mimetype?.startsWith("image/") || false;
      },
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(nodeReq, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    // Extract equipment ID
    const equipmentIdArray = fields.equipmentId;
    const equipmentId = Array.isArray(equipmentIdArray)
      ? equipmentIdArray[0]
      : equipmentIdArray;

    if (!equipmentId) {
      return NextResponse.json(
        { success: false, error: "Equipment ID is required" },
        { status: 400 }
      );
    }

    // Get uploaded files
    const uploadedFiles = files.images;
    if (!uploadedFiles || (Array.isArray(uploadedFiles) && uploadedFiles.length === 0)) {
      return NextResponse.json(
        { success: false, error: "No images provided" },
        { status: 400 }
      );
    }

    const imageFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

    // Validate files
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const errors: string[] = [];

    for (const file of imageFiles) {
      if (!file.mimetype || !validTypes.includes(file.mimetype)) {
        errors.push(`${file.originalFilename}: Invalid file type`);
      }
      if (!file.size || file.size > 10 * 1024 * 1024) {
        errors.push(`${file.originalFilename}: File too large (max 10MB)`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const db = await getDb();
    const collection = db.collection("equipments");

    // Verify equipment exists
    const equipment = await collection.findOne({ id: equipmentId });
    if (!equipment) {
      return NextResponse.json(
        { success: false, error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Process and save images
    const processedImages = [];
    const savedPaths: string[] = [];

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const imageId = uuidv4();
        const timestamp = Date.now();

        // Create equipment-specific directory
        const equipmentDir = equipmentId;
        const originalEquipmentDir = path.join(ORIGINALS_DIR, equipmentDir);
        const thumbnailEquipmentDir = path.join(THUMBNAILS_DIR, equipmentDir);

        await fs.mkdir(originalEquipmentDir, { recursive: true });
        await fs.mkdir(thumbnailEquipmentDir, { recursive: true });

        // Generate filenames
        const ext = ".jpg"; // Always save as JPEG
        const originalFilename = `${timestamp}-${imageId}${ext}`;
        const thumbnailFilename = `${timestamp}-${imageId}${ext}`;

        const originalPath = path.join(originalEquipmentDir, originalFilename);
        const thumbnailPath = path.join(thumbnailEquipmentDir, thumbnailFilename);

        // Process images with Sharp
        await processImage(file.filepath, originalPath, "original");
        await processImage(file.filepath, thumbnailPath, "thumbnail");

        // Track saved paths for cleanup on error
        savedPaths.push(originalPath, thumbnailPath);

        // Create image metadata
        const imageMetadata = {
          id: imageId,
          filename: file.originalFilename || `image-${i + 1}.jpg`,
          originalPath: path.relative(process.cwd(), originalPath),
          thumbnailPath: path.relative(process.cwd(), thumbnailPath),
          mimeType: file.mimetype || "image/jpeg",
          size: file.size || 0,
          uploadedAt: new Date(),
          order: (equipment.images?.length || 0) + i,
        };

        processedImages.push(imageMetadata);

        // Clean up temp file
        try {
          await fs.unlink(file.filepath);
        } catch (err) {
          console.error("Failed to delete temp file:", err);
        }
      }

      // Update MongoDB with new images
      const updateResult = await collection.updateOne(
        { id: equipmentId },
        {
          $push: {
            images: { $each: processedImages },
          },
        }
      );

      logDatabaseOperation(
        "updateOne",
        "equipments",
        Date.now() - startTime,
        { modifiedCount: updateResult.modifiedCount }
      );

      const duration = Date.now() - startTime;
      logApiResponse("POST", "/api/equipments/images", 200, duration, {
        uploadedCount: processedImages.length,
      });

      return NextResponse.json({
        success: true,
        images: processedImages,
      });
    } catch (error) {
      // Cleanup on failure
      logError(error as Error, {
        endpoint: "/api/equipments/images",
        method: "POST",
        equipmentId,
      });

      for (const filePath of savedPaths) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error("Failed to cleanup file:", err);
        }
      }

      throw error;
    }
  } catch (error) {
    logError(error as Error, {
      endpoint: "/api/equipments/images",
      method: "POST",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove images from equipment
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  logApiRequest("DELETE", "/api/equipments/images");

  try {
    const body = await request.json();
    const { equipmentId, imageIds } = body;

    if (!equipmentId || !imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const db = await getDb();
    const collection = db.collection("equipments");

    // Get equipment to find image paths
    const equipment = await collection.findOne({ id: equipmentId });
    if (!equipment) {
      return NextResponse.json(
        { success: false, error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Find images to delete
    const imagesToDelete = (equipment.images || []).filter((img: { id: string; originalPath: string; thumbnailPath: string }) =>
      imageIds.includes(img.id)
    );

    // Delete files from filesystem
    for (const image of imagesToDelete) {
      try {
        const originalFullPath = path.join(process.cwd(), image.originalPath);
        const thumbnailFullPath = path.join(process.cwd(), image.thumbnailPath);

        await fs.unlink(originalFullPath).catch(() => {});
        await fs.unlink(thumbnailFullPath).catch(() => {});
      } catch (err) {
        console.error("Failed to delete image files:", err);
      }
    }

    // Update MongoDB to remove image metadata
    const updateResult = await collection.updateOne(
      { id: equipmentId },
      {
        $pull: {
          images: { id: { $in: imageIds } },
        },
      }
    );

    logDatabaseOperation(
      "updateOne",
      "equipments",
      Date.now() - startTime,
      { modifiedCount: updateResult.modifiedCount }
    );

    const duration = Date.now() - startTime;
    logApiResponse("DELETE", "/api/equipments/images", 200, duration, {
      deletedCount: imagesToDelete.length,
    });

    return NextResponse.json({
      success: true,
      deletedCount: imagesToDelete.length,
    });
  } catch (error) {
    logError(error as Error, {
      endpoint: "/api/equipments/images",
      method: "DELETE",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
