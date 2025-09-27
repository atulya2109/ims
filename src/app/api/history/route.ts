import { getDb } from "@ims/lib/mongodb";

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const checkoutsCollection = db.collection("checkouts");
    const usersCollection = db.collection("users");

    // Fetch all checkout records with user details
    const checkouts = await checkoutsCollection.find({}).sort({ checkoutDate: -1 }).toArray();

    // Get all unique user IDs from checkouts
    const userIds = [...new Set(checkouts.map(checkout => checkout.userId))];

    // Fetch user details
    const users = await usersCollection.find({ id: { $in: userIds } }).toArray();
    const userMap = new Map(users.map(user => [user.id, user]));

    // Transform checkout data into history format
    const history = checkouts.flatMap(checkout => {
      const user = userMap.get(checkout.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

      return checkout.items.map((item: any) => ({
        id: `${checkout.id}-${item.id}`,
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
        checkoutDate: checkout.checkoutDate
      }));
    });

    return new Response(JSON.stringify(history), { status: 200 });
  } catch (error) {
    console.error("Error fetching history:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch history" }),
      { status: 500 }
    );
  }
}