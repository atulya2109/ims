import { getDb } from "@ims/lib/mongodb";
import { logApiRequest, logApiResponse, logError, logDatabaseOperation } from "@ims/lib/logger";

interface CheckoutRecord {
  id: string;
  userId: string;
  project: string;
  checkoutDate: Date;
  items: Array<{
    id: string;
    name: string;
    checkoutQuantity: number;
  }>;
}

interface CheckinRecord {
  id: string;
  userId: string;
  project: string;
  checkinDate: Date;
  items: Array<{
    id: string;
    name: string;
    checkinQuantity: number;
  }>;
}

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
}

export async function GET() {
  const startTime = Date.now();
  logApiRequest("GET", "/api/history");

  try {
    const db = await getDb();
    const checkoutsCollection = db.collection<CheckoutRecord>("checkouts");
    const checkinsCollection = db.collection<CheckinRecord>("checkins");
    const usersCollection = db.collection<UserRecord>("users");

    const dbStart = Date.now();
    // Fetch all checkout and check-in records
    const [checkouts, checkins] = await Promise.all([
      checkoutsCollection.find({}).toArray(),
      checkinsCollection.find({}).toArray()
    ]);
    logDatabaseOperation("find", "checkouts,checkins", Date.now() - dbStart, {
      checkouts: checkouts.length,
      checkins: checkins.length
    });

    // Get all unique user IDs from both checkouts and check-ins
    const userIds = [...new Set([
      ...checkouts.map((checkout) => checkout.userId),
      ...checkins.map((checkin) => checkin.userId)
    ])];

    const userDbStart = Date.now();
    // Fetch user details
    const users = await usersCollection.find({ id: { $in: userIds } }).toArray();
    logDatabaseOperation("find", "users", Date.now() - userDbStart, { count: users.length });

    const userMap = new Map(users.map((user) => [user.id, user]));

    // Transform checkout data into history format
    const checkoutHistory = checkouts.flatMap((checkout) => {
      const user = userMap.get(checkout.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

      return checkout.items.map((item) => ({
        id: `checkout-${checkout.id}-${item.id}`,
        product: item.name,
        project: checkout.project,
        quantity: item.checkoutQuantity,
        activity: "Check-Out",
        date: new Date(checkout.checkoutDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        by: userName,
        checkoutId: checkout.id,
        timestamp: new Date(checkout.checkoutDate).getTime()
      }));
    });

    // Transform check-in data into history format
    const checkinHistory = checkins.flatMap((checkin) => {
      const user = userMap.get(checkin.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

      return checkin.items.map((item) => ({
        id: `checkin-${checkin.id}-${item.id}`,
        product: item.name,
        project: checkin.project,
        quantity: item.checkinQuantity,
        activity: "Check-In",
        date: new Date(checkin.checkinDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        by: userName,
        checkinId: checkin.id,
        timestamp: new Date(checkin.checkinDate).getTime()
      }));
    });

    // Combine and sort by timestamp (most recent first)
    const allHistory = [...checkoutHistory, ...checkinHistory]
      .sort((a, b) => b.timestamp - a.timestamp);

    const duration = Date.now() - startTime;
    logApiResponse("GET", "/api/history", 200, duration, { totalRecords: allHistory.length });

    return new Response(JSON.stringify(allHistory), { status: 200 });
  } catch (error) {
    logError(error, { method: "GET", path: "/api/history" });
    return new Response(
      JSON.stringify({ error: "Failed to fetch history" }),
      { status: 500 }
    );
  }
}
