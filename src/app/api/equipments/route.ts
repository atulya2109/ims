import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    const db = await getDb();
    const collection = db.collection("equipments");

    // Fetch all equipment items from the database
    const equipments = await collection.find({}).toArray();
    return new Response(JSON.stringify(equipments), { status: 200 });
}

export async function POST(request: Request) {
    const db = await getDb();
    const collection = db.collection("equipments");

    const { name, location, quantity, unique, available } = await request.json();
    const id = uuidv4();

    const result = await collection.insertOne({
        id,
        name,
        location,
        unique,
        quantity,
        available
    });

    return new Response(JSON.stringify(result), { status: 200 });
}

export async function DELETE(request: Request) {
    const db = await getDb();
    const collection = db.collection("equipments");

    const { items } = await request.json();

    // Delete the selected items from the database
    const result = await collection.deleteMany({ id: { $in: items } });

    return new Response(JSON.stringify(result), { status: 200 });
}