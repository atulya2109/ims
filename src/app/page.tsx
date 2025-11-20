"use client";
import { useRef, useState } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  interface HistoryItem {
    id: string;
    product: string;
    project: string;
    quantity: number;
    activity: string;
    date: string;
    by: string;
    checkoutId?: string;
    checkoutDate?: string;
  }

  const { data: historyData = [], isLoading } = useSWR<HistoryItem[]>(
    "/api/history",
    fetcher
  );

  const singleClick = useRef<NodeJS.Timeout | null>(null);

  const toggleSelect = (id: string) => {
    if (singleClick.current)
      clearTimeout(singleClick.current);

    singleClick.current = setTimeout(() => {
      setSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }, 250);
  };

  const openItemDialog = (id: string) => {
    if (singleClick.current)
      clearTimeout(singleClick.current);

    console.log("Open item dialog", id);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold">History</h1>
        <Card className="mt-4">
          <CardContent className="p-6">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading history...
                    </TableCell>
                  </TableRow>
                ) : historyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No checkout history found
                    </TableCell>
                  </TableRow>
                ) : (
                  historyData.map((item) => (
                    <TableRow
                      className="cursor-pointer"
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      onDoubleClick={() => openItemDialog(item.id)}
                    >
                      <TableCell>{item.product}</TableCell>
                      <TableCell>{item.project}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.activity}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
