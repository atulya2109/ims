import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';

interface CheckinItem {
  id: string;
  name: string;
  checkinQuantity: number;
  checkoutId?: string;
}

interface CheckinRequest {
  userId: string;
  project: string;
  items: CheckinItem[];
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const equipmentsCollection = db.collection("equipments");
    const checkinsCollection = db.collection("checkins");
    const checkoutsCollection = db.collection("checkouts");

    const { userId, project, items }: CheckinRequest = await request.json();

    // Validate request
    if (!userId || !project || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Create check-in record
    const checkinId = uuidv4();
    const checkinDate = new Date();

    const checkin = {
      id: checkinId,
      userId,
      project,
      items,
      checkinDate,
      status: "completed"
    };

    try {
      // Update equipment availability (add back to inventory)
      for (const item of items) {
        await equipmentsCollection.updateOne(
          { id: item.id },
          {
            $inc: { available: item.checkinQuantity }
          }
        );
      }

      // Insert check-in record
      await checkinsCollection.insertOne(checkin);

      return new Response(
        JSON.stringify({
          success: true,
          checkinId,
          message: "Check-in completed successfully"
        }),
        { status: 200 }
      );

    } catch (operationError) {
      console.error("Check-in operation failed:", operationError);
      return new Response(
        JSON.stringify({ error: "Check-in failed. Please try again." }),
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Check-in error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const collection = db.collection("checkins");

    // Fetch all check-in records
    const checkins = await collection.find({}).sort({ checkinDate: -1 }).toArray();
    return new Response(JSON.stringify(checkins), { status: 200 });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch check-ins" }),
      { status: 500 }
    );
  }
}