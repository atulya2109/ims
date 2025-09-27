import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    const db = await getDb();
    const collection = db.collection("users");

    // Fetch all users from the database
    const users = await collection.find({}).toArray();
    return new Response(JSON.stringify(users), { status: 200 });
}

export async function POST(request: Request) {
    const db = await getDb();
    const collection = db.collection("users");

    const { id, firstName, lastName, position, email } = await request.json();

    const result = await collection.insertOne({
        id,
        firstName,
        lastName,
        position,
        email
    });

    return new Response(JSON.stringify(result), { status: 200 });
}

export async function PUT(request: Request) {
    try {
        const db = await getDb();
        const collection = db.collection("users");

        const { id, firstName, lastName, position, email } = await request.json();

        // Validate required fields
        if (!id || !firstName || !lastName || !position || !email) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400 }
            );
        }

        const result = await collection.updateOne(
            { id },
            {
                $set: {
                    firstName,
                    lastName,
                    position,
                    email
                }
            }
        );

        if (result.matchedCount === 0) {
            return new Response(
                JSON.stringify({ error: "User not found" }),
                { status: 404 }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "User updated successfully",
                modifiedCount: result.modifiedCount
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating user:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const db = await getDb();
        const collection = db.collection("users");

        const { userIds } = await request.json();

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return new Response(
                JSON.stringify({ error: "No user IDs provided" }),
                { status: 400 }
            );
        }

        const result = await collection.deleteMany({
            id: { $in: userIds }
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: `${result.deletedCount} user(s) deleted successfully`,
                deletedCount: result.deletedCount
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting users:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
        );
    }
}