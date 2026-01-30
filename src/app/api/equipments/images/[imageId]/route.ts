import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getDb } from "@ims/lib/mongodb";
import { logApiRequest, logApiResponse, logError } from "@ims/lib/logger";

/**
 * Image Serving API Route
 *
 * Serves equipment images (original or thumbnail)
 * GET /api/equipments/images/[imageId]?type=thumbnail|original
 */

/**
 * GET - Serve image file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  const startTime = Date.now();
  const imageId = params.imageId;
  logApiRequest("GET", `/api/equipments/images/${imageId}`);

  try {
    // Get query parameter for image type
    const searchParams = request.nextUrl.searchParams;
    const imageType = searchParams.get("type") || "original";

    if (imageType !== "original" && imageType !== "thumbnail") {
      return NextResponse.json(
        { error: "Invalid image type. Use 'original' or 'thumbnail'" },
        { status: 400 }
      );
    }

    // Connect to MongoDB to find image metadata
    const db = await getDb();
    const collection = db.collection("equipments");

    // Find equipment with this image
    const equipment = await collection.findOne({
      "images.id": imageId,
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Find the specific image
    const image = equipment.images?.find((img: any) => img.id === imageId);
    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Get file path
    const imagePath =
      imageType === "thumbnail" ? image.thumbnailPath : image.originalPath;
    const fullPath = path.join(process.cwd(), imagePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      logError(new Error("Image file not found on filesystem"), {
        imageId,
        imagePath,
        fullPath,
      });

      return NextResponse.json(
        { error: "Image file not found" },
        { status: 404 }
      );
    }

    // Read file
    const imageBuffer = await fs.readFile(fullPath);

    // Determine content type
    const contentType = image.mimeType || "image/jpeg";

    const duration = Date.now() - startTime;
    logApiResponse("GET", `/api/equipments/images/${imageId}`, 200, duration, {
      imageType,
      size: imageBuffer.length,
    });

    // Return image with cache headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": imageId,
      },
    });
  } catch (error) {
    logError(error as Error, {
      endpoint: `/api/equipments/images/${imageId}`,
      method: "GET",
    });

    return NextResponse.json(
      {
        error: "Failed to serve image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
