"use client";
import { useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/equipments/actionsbar";
import { Checkbox } from "@ims/components/ui/checkbox";
import { useEffect } from "react";
import useSWR, { mutate } from "swr";

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

    const toggleSelect = (id: number) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const deleteSelectedItems = () => {
        fetch('/api/equipments', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: selectedItems }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to delete items');
                }
                mutate('/api/equipments');
                setSelectedItems([]);
            })
    }

    return (
        <div className="flex h-screen">
            <div className="flex-1 p-4">
                <ActionsBar selectedItems={selectedItems} onDelete={deleteSelectedItems} />
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
                                    <TableRow className="cursor-pointer" key={item.id} onClick={(e) => toggleSelect(item.id)}>
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
