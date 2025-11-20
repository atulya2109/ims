import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
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

export async function PUT(request: Request) {
    try {
        const db = await getDb();
        const collection = db.collection("equipments");

        const { id, name, location, quantity, available, unique } = await request.json();

        // Validate required fields
        if (!id || !name || !location || quantity === undefined || available === undefined) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400 }
            );
        }

        // Validate that available <= quantity
        if (available > quantity) {
            return new Response(
                JSON.stringify({ error: "Available quantity cannot exceed total quantity" }),
                { status: 400 }
            );
        }

        const result = await collection.updateOne(
            { id },
            {
                $set: {
                    name,
                    location,
                    quantity: parseInt(quantity),
                    available: parseInt(available),
                    unique: Boolean(unique)
                }
            }
        );

        if (result.matchedCount === 0) {
            return new Response(
                JSON.stringify({ error: "Equipment not found" }),
                { status: 404 }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Equipment updated successfully",
                modifiedCount: result.modifiedCount
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating equipment:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const db = await getDb();
    const collection = db.collection("equipments");

    const { items } = await request.json();

    // Delete the selected items from the database
    const result = await collection.deleteMany({ id: { $in: items } });

    return new Response(JSON.stringify(result), { status: 200 });
}