"use client";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/equipments/actionsbar";
import { Checkbox } from "@ims/components/ui/checkbox";
import { Button } from "@ims/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import useSWR, { mutate } from "swr";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@ims/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@ims/components/ui/dialog";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import { EditEquipmentDialog } from "@ims/components/equipments/EditEquipmentDialog";

interface QRDialogProps {
    item: InventoryItem | undefined;
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface InventoryItem {
    id: string;
    name: string;
    location: string;
    quantity: number;
    available: number;
    unique: boolean;
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
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogItem, setDialogItem] = useState<InventoryItem>();
    const [editingEquipment, setEditingEquipment] = useState<InventoryItem | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

    const fetcher = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch inventory data");
        }
        return response.json();
    };

    const { data, error, mutate: mutateEquipments } = useSWR<InventoryItem[]>("/api/equipments", fetcher);

    useEffect(() => {
        if (data) {
            setInventoryData(data);
        }
    }, [data]);

    if (error) {
        console.error("Error fetching inventory data:", error);
    }

    const singleClick = useRef<NodeJS.Timeout | null>(null);

    const toggleSelectAll = () => {
        if (selectedItems.length === inventoryData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(inventoryData.map(item => item.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleEditEquipment = (equipment: InventoryItem) => {
        setEditingEquipment(equipment);
        setIsEditDialogOpen(true);
    };

    const openItemDialog = (id: string) => {
        if (singleClick.current)
            clearTimeout(singleClick.current);

        const equipment = inventoryData.find(item => item.id === id);
        if (equipment) {
            handleEditEquipment(equipment);
        }
    };

    const onEquipmentSaved = (updatedEquipment: InventoryItem) => {
        setInventoryData(prev => prev.map(item =>
            item.id === updatedEquipment.id ? updatedEquipment : item
        ));
        mutateEquipments();
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

    const selectedEquipmentsData = inventoryData.filter(item => selectedItems.includes(item.id));

    return (
        <div className="flex h-screen">
            <div className="flex-1 p-4">
                <QRDialog item={dialogItem} open={showDialog} setOpen={setShowDialog} />

                {/* Combined Actions Bar */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <ActionsBar />

                        {/* Dynamic Action Buttons */}
                        {selectedItems.length > 0 && (
                            <>
                                {selectedItems.length === 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditEquipment(selectedEquipmentsData[0])}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Equipment
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={deleteSelectedItems}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete {selectedItems.length > 1 ? `${selectedItems.length} Items` : 'Item'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <Card className="mt-4">
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedItems.length === inventoryData.length && inventoryData.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Select all equipment"
                                        />
                                    </TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventoryData.map((item) => (
                                    <ContextMenu key={item.id}>
                                        <ContextMenuTrigger asChild>
                                            <TableRow
                                                className="cursor-pointer"
                                                key={item.id}
                                                onDoubleClick={() => openItemDialog(item.id)}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedItems.includes(item.id)}
                                                        onCheckedChange={() => toggleSelect(item.id)}
                                                        aria-label={`Select ${item.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>{item.location}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{item.available}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditEquipment(item);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedItems([item.id]);
                                                                deleteSelectedItems();
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
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

                {/* Dialogs */}
                <EditEquipmentDialog
                    equipment={editingEquipment}
                    isOpen={isEditDialogOpen}
                    onClose={() => setIsEditDialogOpen(false)}
                    onSave={onEquipmentSaved}
                />
            </div>
        </div>
    );
}
