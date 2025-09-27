import { getDb } from "@ims/lib/mongodb";

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const checkoutsCollection = db.collection("checkouts");
    const checkinsCollection = db.collection("checkins");
    const usersCollection = db.collection("users");

    // Fetch all checkout and check-in records
    const [checkouts, checkins] = await Promise.all([
      checkoutsCollection.find({}).toArray(),
      checkinsCollection.find({}).toArray()
    ]);

    // Get all unique user IDs from both checkouts and check-ins
    const userIds = [...new Set([
      ...checkouts.map(checkout => checkout.userId),
      ...checkins.map(checkin => checkin.userId)
    ])];

    // Fetch user details
    const users = await usersCollection.find({ id: { $in: userIds } }).toArray();
    const userMap = new Map(users.map(user => [user.id, user]));

    // Transform checkout data into history format
    const checkoutHistory = checkouts.flatMap(checkout => {
      const user = userMap.get(checkout.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

      return checkout.items.map((item: any) => ({
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
    const checkinHistory = checkins.flatMap(checkin => {
      const user = userMap.get(checkin.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

      return checkin.items.map((item: any) => ({
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

    return new Response(JSON.stringify(allHistory), { status: 200 });
  } catch (error) {
    console.error("Error fetching history:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch history" }),
      { status: 500 }
    );
  }
}