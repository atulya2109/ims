import { getDb } from "@ims/lib/mongodb";
import { logApiRequest, logApiResponse, logError, logDatabaseOperation } from "@ims/lib/logger";

export async function GET() {
    const startTime = Date.now();
    logApiRequest("GET", "/api/users");

    try {
        const db = await getDb();
        const collection = db.collection("users");

        const dbStart = Date.now();
        // Fetch all users from the database
        const users = await collection.find({}).toArray();
        logDatabaseOperation("find", "users", Date.now() - dbStart, { count: users.length });

        const duration = Date.now() - startTime;
        logApiResponse("GET", "/api/users", 200, duration, { count: users.length });
        return new Response(JSON.stringify(users), { status: 200 });
    } catch (error) {
        logError(error, { method: "GET", path: "/api/users" });
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}

export async function POST(request: Request) {
    const startTime = Date.now();
    logApiRequest("POST", "/api/users");

    try {
        const db = await getDb();
        const collection = db.collection("users");

        const { id, firstName, lastName, position, email } = await request.json();

        const dbStart = Date.now();
        const result = await collection.insertOne({
            id,
            firstName,
            lastName,
            position,
            email
        });
        logDatabaseOperation("insertOne", "users", Date.now() - dbStart, { userId: id, email });

        const duration = Date.now() - startTime;
        logApiResponse("POST", "/api/users", 200, duration, { userId: id, email });
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        logError(error, { method: "POST", path: "/api/users" });
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}

export async function PUT(request: Request) {
    const startTime = Date.now();
    logApiRequest("PUT", "/api/users");

    try {
        const db = await getDb();
        const collection = db.collection("users");

        const { id, firstName, lastName, position, email } = await request.json();

        // Validate required fields
        if (!id || !firstName || !lastName || !position || !email) {
            logApiResponse("PUT", "/api/users", 400, Date.now() - startTime, { error: "Missing required fields" });
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400 }
            );
        }

        const dbStart = Date.now();
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
        logDatabaseOperation("updateOne", "users", Date.now() - dbStart, { userId: id, email });

        if (result.matchedCount === 0) {
            logApiResponse("PUT", "/api/users", 404, Date.now() - startTime, { userId: id });
            return new Response(
                JSON.stringify({ error: "User not found" }),
                { status: 404 }
            );
        }

        const duration = Date.now() - startTime;
        logApiResponse("PUT", "/api/users", 200, duration, { userId: id, email, modified: result.modifiedCount });
        return new Response(
            JSON.stringify({
                success: true,
                message: "User updated successfully",
                modifiedCount: result.modifiedCount
            }),
            { status: 200 }
        );
    } catch (error) {
        logError(error, { method: "PUT", path: "/api/users" });
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const startTime = Date.now();
    logApiRequest("DELETE", "/api/users");

    try {
        const db = await getDb();
        const collection = db.collection("users");

        const { userIds } = await request.json();

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            logApiResponse("DELETE", "/api/users", 400, Date.now() - startTime, { error: "No user IDs provided" });
            return new Response(
                JSON.stringify({ error: "No user IDs provided" }),
                { status: 400 }
            );
        }

        const dbStart = Date.now();
        const result = await collection.deleteMany({
            id: { $in: userIds }
        });
        logDatabaseOperation("deleteMany", "users", Date.now() - dbStart, { count: userIds.length, deletedCount: result.deletedCount });

        const duration = Date.now() - startTime;
        logApiResponse("DELETE", "/api/users", 200, duration, { count: userIds.length, deletedCount: result.deletedCount });
        return new Response(
            JSON.stringify({
                success: true,
                message: `${result.deletedCount} user(s) deleted successfully`,
                deletedCount: result.deletedCount
            }),
            { status: 200 }
        );
    } catch (error) {
        logError(error, { method: "DELETE", path: "/api/users" });
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
        );
    }
}
