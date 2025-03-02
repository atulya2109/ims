"use client";
import { useRef, useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/ui/actionsbar";
import { Checkbox } from "@ims/components/ui/checkbox";

export default function EquipmentsPage() {
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    interface InventoryItem {
        id: number;
        product: string;
        location: string;
        total: number;
        available: number;

    }

    const inventoryData: InventoryItem[] = [
        { id: 1, product: "Large Desk", location: "WH/Stock", total: 4, available: 2 },
        { id: 2, product: "Flipover", location: "WH/Stock", total: 5, available: 3 },
        { id: 3, product: "Office Lamp", location: "WH/Stock/Asse...", total: 8, available: 5 },
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
                <ActionsBar selectedItems={selectedItems} />
                <Card className="mt-4">
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Checkbox
                                            className="cursor-pointer"
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
                                    <TableHead>Total</TableHead>
                                    <TableHead>Available</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventoryData.map((item) => (
                                    <TableRow className="cursor-pointer" key={item.id} onDoubleClick={() => openItemDialog(item.id)} onClick={(e) => toggleSelect(item.id)}>
                                        <TableCell>
                                            <Checkbox
                                                className="cursor-pointer"
                                                checked={selectedItems.includes(item.id)}
                                                onCheckedChange={(e) => toggleSelect(item.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
                                        <TableCell>{item.product}</TableCell>
                                        <TableCell>{item.location}</TableCell>
                                        <TableCell>{item.total}</TableCell>
                                        <TableCell>{item.available}</TableCell>
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
