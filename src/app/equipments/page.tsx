"use client";
import { useRef, useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/equipments/actionsbar";
import { Checkbox } from "@ims/components/ui/checkbox";
import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@ims/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@ims/components/ui/dialog";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import { Button } from "@ims/components/ui/button";

interface QRDialogProps {
    item: InventoryItem | undefined;
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface InventoryItem {
    id: number;
    name: string;
    location: string;
    quantity: number;
    available: number;
}


function QRDialog({ item, open, setOpen }: QRDialogProps) {
    const qrRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ contentRef: qrRef });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>QR Code</DialogTitle>
                </DialogHeader>
                <div className="w-full flex justify-center items-center flex-col bg-white h-96" ref={qrRef}>
                    {item && <QRCode value={item.id.toString()} />}
                    {item && <p className="text-sm text-black">{item.name}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={() => handlePrint()}>Print</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function EquipmentsPage() {
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogItem, setDialogItem] = useState<InventoryItem>();

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

        setShowDialog(false)
    }

    return (
        <div className="flex h-screen">
            <div className="flex-1 p-4">
                <QRDialog item={dialogItem} open={showDialog} setOpen={setShowDialog} />
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
                                    <ContextMenu key={item.id}>
                                        <ContextMenuTrigger asChild>
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
                                        </ContextMenuTrigger>
                                        <ContextMenuContent>
                                            <ContextMenuItem onClick={(e) => { setShowDialog(true); setDialogItem(item) }}>
                                                View QR Code
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
