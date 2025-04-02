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