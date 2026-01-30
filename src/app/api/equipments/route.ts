import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';
import { logApiRequest, logApiResponse, logError, logDatabaseOperation } from "@ims/lib/logger";

export async function GET() {
    const startTime = Date.now();
    logApiRequest("GET", "/api/equipments");

    try {
        const db = await getDb();
        const collection = db.collection("equipments");

        const dbStart = Date.now();
        // Fetch all equipment items from the database
        const equipments = await collection.find({}).toArray();
        logDatabaseOperation("find", "equipments", Date.now() - dbStart, { count: equipments.length });

        const duration = Date.now() - startTime;
        logApiResponse("GET", "/api/equipments", 200, duration, { count: equipments.length });
        return new Response(JSON.stringify(equipments), { status: 200 });
    } catch (error) {
        logError(error, { method: "GET", path: "/api/equipments" });
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}

export async function POST(request: Request) {
    const startTime = Date.now();
    logApiRequest("POST", "/api/equipments");

    try {
        const db = await getDb();
        const collection = db.collection("equipments");

        const { name, location, quantity, unique, available, assetId } = await request.json();
        const id = uuidv4();

        const dbStart = Date.now();
        const result = await collection.insertOne({
            id,
            name,
            location,
            unique,
            quantity,
            available,
            ...(assetId && { assetId })
        });
        logDatabaseOperation("insertOne", "equipments", Date.now() - dbStart, { equipmentId: id, name });

        const duration = Date.now() - startTime;
        logApiResponse("POST", "/api/equipments", 200, duration, { equipmentId: id, name });
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        logError(error, { method: "POST", path: "/api/equipments" });
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}

export async function PUT(request: Request) {
    const startTime = Date.now();
    logApiRequest("PUT", "/api/equipments");

    try {
        const db = await getDb();
        const collection = db.collection("equipments");

        const { id, name, location, quantity, available, unique, assetId } = await request.json();

        // Validate required fields
        if (!id || !name || !location || quantity === undefined || available === undefined) {
            logApiResponse("PUT", "/api/equipments", 400, Date.now() - startTime, { error: "Missing required fields" });
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400 }
            );
        }

        // Validate that available <= quantity
        if (available > quantity) {
            logApiResponse("PUT", "/api/equipments", 400, Date.now() - startTime, { error: "Available > quantity" });
            return new Response(
                JSON.stringify({ error: "Available quantity cannot exceed total quantity" }),
                { status: 400 }
            );
        }

        const dbStart = Date.now();
        const updateData: Record<string, unknown> = {
            name,
            location,
            quantity: parseInt(quantity),
            available: parseInt(available),
            unique: Boolean(unique)
        };

        // Add assetId if provided, or remove it if explicitly set to empty
        if (assetId !== undefined) {
            if (assetId === "" || assetId === null) {
                updateData.assetId = null;
            } else {
                updateData.assetId = assetId;
            }
        }

        const result = await collection.updateOne(
            { id },
            { $set: updateData }
        );
        logDatabaseOperation("updateOne", "equipments", Date.now() - dbStart, { equipmentId: id, name });

        if (result.matchedCount === 0) {
            logApiResponse("PUT", "/api/equipments", 404, Date.now() - startTime, { equipmentId: id });
            return new Response(
                JSON.stringify({ error: "Equipment not found" }),
                { status: 404 }
            );
        }

        const duration = Date.now() - startTime;
        logApiResponse("PUT", "/api/equipments", 200, duration, { equipmentId: id, name, modified: result.modifiedCount });
        return new Response(
            JSON.stringify({
                success: true,
                message: "Equipment updated successfully",
                modifiedCount: result.modifiedCount
            }),
            { status: 200 }
        );
    } catch (error) {
        logError(error, { method: "PUT", path: "/api/equipments" });
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const startTime = Date.now();
    logApiRequest("DELETE", "/api/equipments");

    try {
        const db = await getDb();
        const collection = db.collection("equipments");

        const { items } = await request.json();

        const dbStart = Date.now();

        // Fetch equipment documents to get image paths before deletion
        const equipments = await collection.find({ id: { $in: items } }).toArray();

        // Collect all image paths for deletion
        const imagePaths: string[] = [];
        for (const equipment of equipments) {
            if (equipment.images && Array.isArray(equipment.images)) {
                for (const image of equipment.images) {
                    if (image.originalPath) imagePaths.push(image.originalPath);
                    if (image.thumbnailPath) imagePaths.push(image.thumbnailPath);
                }
            }
        }

        // Delete image files from filesystem (non-blocking, errors logged but not thrown)
        if (imagePaths.length > 0) {
            const fs = require('fs/promises');
            const path = require('path');

            await Promise.allSettled(
                imagePaths.map(async (relativePath) => {
                    try {
                        const fullPath = path.join(process.cwd(), relativePath);
                        await fs.unlink(fullPath);
                    } catch (err) {
                        console.error(`Failed to delete image file ${relativePath}:`, err);
                    }
                })
            );
        }

        // Delete the selected items from the database
        const result = await collection.deleteMany({ id: { $in: items } });
        logDatabaseOperation("deleteMany", "equipments", Date.now() - dbStart, { itemCount: items.length, deletedCount: result.deletedCount, imagesDeleted: imagePaths.length });

        const duration = Date.now() - startTime;
        logApiResponse("DELETE", "/api/equipments", 200, duration, { itemCount: items.length, deletedCount: result.deletedCount, imagesDeleted: imagePaths.length });
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        logError(error, { method: "DELETE", path: "/api/equipments" });
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}