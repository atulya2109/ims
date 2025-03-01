"use client";
import { useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/ui/actionsbar";
import { Checkbox } from "@ims/components/ui/checkbox";

const inventoryData = [
  { id: 1, product: "Large Desk", location: "WH/Stock", onHand: 4, forecast: -1, toOrder: 1 },
  { id: 2, product: "Flipover", location: "WH/Stock", onHand: 5, forecast: -6, toOrder: 6 },
  { id: 3, product: "Office Lamp", location: "WH/Stock/Asse...", onHand: 8, forecast: 0, toOrder: 2 },
];

export default function Home() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  interface InventoryItem {
    id: number;
    product: string;
    location: string;
    onHand: number;
    project: string;
    checkedOutBy?: string;
  }

  const inventoryData: InventoryItem[] = [
    { id: 1, product: "Large Desk", location: "WH/Stock", onHand: 4, checkedOutBy: "John Doe", project: "Project A" },
    { id: 2, product: "Flipover", location: "WH/Stock", onHand: 5, checkedOutBy: "Jane Doe", project: "Project B" },
    { id: 3, product: "Office Lamp", location: "WH/Stock/Asse...", onHand: 8, checkedOutBy: "John Doe", project: "Project A" },
  ];

  const toggleSelect = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4">
        <ActionsBar selectedItems={selectedItems} />
        <Card className="mt-4">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={selectedItems.length === inventoryData.length}
                      onCheckedChange={() => {
                        if (selectedItems.length === inventoryData.length) {
                          setSelectedItems([]);
                        } else {
                          setSelectedItems(inventoryData.map((item) => item.id));
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Checked Out By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.onHand}</TableCell>
                    <TableCell>{item.project}</TableCell>
                    <TableCell>{item.checkedOutBy}</TableCell>
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
