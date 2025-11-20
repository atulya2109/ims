import { getDb } from "@ims/lib/mongodb";
import { v4 as uuidv4 } from 'uuid';

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
  try {
    const db = await getDb();
    const equipmentsCollection = db.collection("equipments");
    const checkoutsCollection = db.collection("checkouts");

    const { userId, project, items }: CheckoutRequest = await request.json();

    // Validate request
    if (!userId || !project || !items || items.length === 0) {
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

      return new Response(
        JSON.stringify({
          success: true,
          checkoutId,
          message: "Checkout completed successfully"
        }),
        { status: 200 }
      );

    } catch (operationError) {
      console.error("Operation failed:", operationError);
      return new Response(
        JSON.stringify({ error: "Checkout failed. Please try again." }),
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection("checkouts");

    // Fetch all checkout records
    const checkouts = await collection.find({}).sort({ checkoutDate: -1 }).toArray();
    return new Response(JSON.stringify(checkouts), { status: 200 });
  } catch (error) {
    console.error("Error fetching checkouts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch checkouts" }),
      { status: 500 }
    );
  }
}