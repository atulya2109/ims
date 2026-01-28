import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';
import { logApiRequest, logApiResponse, logError, logDatabaseOperation } from "@ims/lib/logger";

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
  const startTime = Date.now();
  logApiRequest("POST", "/api/checkin");

  try {
    const db = await getDb();
    const equipmentsCollection = db.collection("equipments");
    const checkinsCollection = db.collection("checkins");

    const { userId, project, items }: CheckinRequest = await request.json();

    // Validate request
    if (!userId || !project || !items || items.length === 0) {
      logApiResponse("POST", "/api/checkin", 400, Date.now() - startTime, { error: "Missing required fields" });
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
      const dbStart = Date.now();
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
      logDatabaseOperation("checkin-transaction", "equipments,checkins", Date.now() - dbStart, {
        checkinId,
        userId,
        project,
        itemCount: items.length
      });

      const duration = Date.now() - startTime;
      logApiResponse("POST", "/api/checkin", 200, duration, {
        checkinId,
        userId,
        project,
        itemCount: items.length
      });

      return new Response(
        JSON.stringify({
          success: true,
          checkinId,
          message: "Check-in completed successfully"
        }),
        { status: 200 }
      );

    } catch (operationError) {
      logError(operationError, { method: "POST", path: "/api/checkin", operation: "database-transaction", userId, project });
      return new Response(
        JSON.stringify({ error: "Check-in failed. Please try again." }),
        { status: 500 }
      );
    }

  } catch (error) {
    logError(error, { method: "POST", path: "/api/checkin" });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  const startTime = Date.now();
  logApiRequest("GET", "/api/checkin");

  try {
    const db = await getDb();
    const collection = db.collection("checkins");

    const dbStart = Date.now();
    // Fetch all check-in records
    const checkins = await collection.find({}).sort({ checkinDate: -1 }).toArray();
    logDatabaseOperation("find", "checkins", Date.now() - dbStart, { count: checkins.length });

    const duration = Date.now() - startTime;
    logApiResponse("GET", "/api/checkin", 200, duration, { count: checkins.length });
    return new Response(JSON.stringify(checkins), { status: 200 });
  } catch (error) {
    logError(error, { method: "GET", path: "/api/checkin" });
    return new Response(
      JSON.stringify({ error: "Failed to fetch check-ins" }),
      { status: 500 }
    );
  }
}
