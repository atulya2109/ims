import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@ims/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ims/components/ui/form";
import { Input } from "@ims/components/ui/input";
import { Button } from "@ims/components/ui/button";
import { Checkbox } from "@ims/components/ui/checkbox";

const equipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  location: z.string().min(1, "Location is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  available: z.number().min(0, "Available quantity cannot be negative"),
  unique: z.boolean(),
  assetId: z.string().optional(),
}).refine((data) => data.available <= data.quantity, {
  message: "Available quantity cannot exceed total quantity",
  path: ["available"],
});

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
  assetId?: string;
}

interface EditEquipmentDialogProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: Equipment) => void;
}

export function EditEquipmentDialog({ equipment, isOpen, onClose, onSave }: EditEquipmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: equipment?.name || "",
      location: equipment?.location || "",
      quantity: equipment?.quantity || 1,
      available: equipment?.available || 0,
      unique: equipment?.unique || false,
      assetId: equipment?.assetId || "",
    },
  });

  // Reset form when equipment changes
  useEffect(() => {
    if (equipment) {
      form.reset({
        name: equipment.name,
        location: equipment.location,
        quantity: equipment.quantity,
        available: equipment.available,
        unique: equipment.unique,
        assetId: equipment.assetId || "",
      });
    }
  }, [equipment, form]);

  const onSubmit = async (data: z.infer<typeof equipmentSchema>) => {
    if (!equipment) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/equipments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: equipment.id,
          ...data,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSave({ ...equipment, ...data });
        onClose();
        form.reset();
      } else {
        alert(`Failed to update equipment: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating equipment:", error);
      alert("Failed to update equipment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Equipment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter equipment name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter university asset ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter total quantity"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter available quantity"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unique"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Unique Item
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if the equipment is a unique item (quantity always 1)
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}