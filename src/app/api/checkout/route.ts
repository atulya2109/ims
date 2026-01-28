import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';
import { logApiRequest, logApiResponse, logError, logDatabaseOperation } from "@ims/lib/logger";

interface CheckoutItem {
  id: string;
  name: string;
  checkoutQuantity: number;
}

interface CheckoutRequest {
  userId: string;
  project: string;
  items: CheckoutItem[];
}

export async function POST(request: Request) {
  const startTime = Date.now();
  logApiRequest("POST", "/api/checkout");

  try {
    const db = await getDb();
    const equipmentsCollection = db.collection("equipments");
    const checkoutsCollection = db.collection("checkouts");

    const { userId, project, items }: CheckoutRequest = await request.json();

    // Validate request
    if (!userId || !project || !items || items.length === 0) {
      logApiResponse("POST", "/api/checkout", 400, Date.now() - startTime, { error: "Missing required fields" });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Create checkout record
    const checkoutId = uuidv4();
    const checkoutDate = new Date();

    const checkout = {
      id: checkoutId,
      userId,
      project,
      items,
      checkoutDate,
      status: "active"
    };

    // Update equipment availability and insert checkout record
    // For simplicity, we'll do this without transactions for now
    // In production, you might want to implement proper transaction handling

    try {
      const dbStart = Date.now();
      // Update equipment availability
      for (const item of items) {
        await equipmentsCollection.updateOne(
          { id: item.id },
          {
            $inc: { available: -item.checkoutQuantity }
          }
        );
      }

      // Insert checkout record
      await checkoutsCollection.insertOne(checkout);
      logDatabaseOperation("checkout-transaction", "equipments,checkouts", Date.now() - dbStart, {
        checkoutId,
        userId,
        project,
        itemCount: items.length
      });

      const duration = Date.now() - startTime;
      logApiResponse("POST", "/api/checkout", 200, duration, {
        checkoutId,
        userId,
        project,
        itemCount: items.length
      });

      return new Response(
        JSON.stringify({
          success: true,
          checkoutId,
          message: "Checkout completed successfully"
        }),
        { status: 200 }
      );

    } catch (operationError) {
      logError(operationError, { method: "POST", path: "/api/checkout", operation: "database-transaction", userId, project });
      return new Response(
        JSON.stringify({ error: "Checkout failed. Please try again." }),
        { status: 500 }
      );
    }

  } catch (error) {
    logError(error, { method: "POST", path: "/api/checkout" });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  const startTime = Date.now();
  logApiRequest("GET", "/api/checkout");

  try {
    const db = await getDb();
    const collection = db.collection("checkouts");

    const dbStart = Date.now();
    // Fetch all checkout records
    const checkouts = await collection.find({}).sort({ checkoutDate: -1 }).toArray();
    logDatabaseOperation("find", "checkouts", Date.now() - dbStart, { count: checkouts.length });

    const duration = Date.now() - startTime;
    logApiResponse("GET", "/api/checkout", 200, duration, { count: checkouts.length });
    return new Response(JSON.stringify(checkouts), { status: 200 });
  } catch (error) {
    logError(error, { method: "GET", path: "/api/checkout" });
    return new Response(
      JSON.stringify({ error: "Failed to fetch checkouts" }),
      { status: 500 }
    );
  }
}