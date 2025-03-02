"use client";
import { useRef, useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/ui/actionsbar";

export default function Home() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  interface InventoryItem {
    id: number;
    product: string;
    project: string;
    quantity: number;
    activity: string;
    date: string;
    by: string;
  }

  const inventoryData: InventoryItem[] = [
    { id: 1, product: "Large Desk", project: "WiFi Measurement", quantity: 4, activity: "Check-In", date: "01 Mar 2025", by: "Yuning Zhang" },
    { id: 2, product: "Flipover", project: "WiFi Measurement", quantity: 5, activity: "Check-Out", date: "15 Feb 2025", by: "Yuning Zhang" },
    { id: 3, product: "Office Lamp", project: "WiFi Measurement", quantity: 8, activity: "Check-In", date: "25 Dec 2024", by: "Nikhil Koushika" },
  ];

  const singleClick = useRef<NodeJS.Timeout | null>(null);

  const toggleSelect = (id: number) => {

    if (singleClick.current)
      clearTimeout(singleClick.current);

    singleClick.current = setTimeout(() => {
      setSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }, 250);
  };

  const openItemDialog = (id: number) => {

    if (singleClick.current)
      clearTimeout(singleClick.current);

    console.log("Open item dialog", id);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold">History</h1>
        <Card className="mt-4">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow className="cursor-pointer" key={item.id}>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>{item.project}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.activity}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
