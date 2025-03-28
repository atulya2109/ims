"use client";
import { useRef, useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/ui/actionsbar";
import { Checkbox } from "@ims/components/ui/checkbox";
import { useEffect } from "react";
import useSWR from "swr";

export default function EquipmentsPage() {
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    interface InventoryItem {
        id: number;
        name: string;
        location: string;
        quantity: number;
        available: number;
    }

    const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

    const fetcher = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch inventory data");
        }
        return response.json();
    };

    const { data, error } = useSWR<InventoryItem[]>("/api/equipments", fetcher);

    useEffect(() => {
        if (data) {
            setInventoryData(data);
        }
    }, [data]);

    if (error) {
        console.error("Error fetching inventory data:", error);
    }

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
                                            checked={selectedItems.length === inventoryData.length && inventoryData.length > 0}
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
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.location}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
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
