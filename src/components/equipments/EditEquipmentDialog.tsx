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
import { ImageGallery } from "@ims/components/equipments/ImageGallery";
import { ImageUpload } from "@ims/components/equipments/ImageUpload";
import type { EquipmentImage } from "@ims/types/equipment";

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
  images?: EquipmentImage[]; // NEW: Array of images
}

interface EditEquipmentDialogProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: Equipment) => void;
  mutateEquipments?: () => void;
}

export function EditEquipmentDialog({ equipment, isOpen, onClose, onSave, mutateEquipments }: EditEquipmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [equipmentImages, setEquipmentImages] = useState<EquipmentImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

  // Reset form and load images when equipment changes OR when dialog opens
  useEffect(() => {
    if (equipment && isOpen) {
      form.reset({
        name: equipment.name,
        location: equipment.location,
        quantity: equipment.quantity,
        available: equipment.available,
        unique: equipment.unique,
        assetId: equipment.assetId || "",
      });

      // Load equipment images from database
      if (equipment.images && equipment.images.length > 0) {
        setEquipmentImages(equipment.images);
      } else {
        // No images for this equipment
        setEquipmentImages([]);
      }

      // Clear selected files for upload
      setSelectedFiles([]);
    }
  }, [equipment, isOpen, form]);

  const onSubmit = async (data: z.infer<typeof equipmentSchema>) => {
    if (!equipment) return;

    setIsLoading(true);
    try {
      // Step 1: Save equipment changes
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

      if (!response.ok) {
        alert(`Failed to update equipment: ${result.error}`);
        return;
      }

      // Step 2: Upload new images if any selected
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("equipmentId", equipment.id);
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });

        const uploadResponse = await fetch("/api/equipments/images", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          alert("Equipment saved, but failed to upload images. Please try again.");
          return;
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          // Update local state with new images
          setEquipmentImages((prev) => [...prev, ...uploadData.images]);
        }
      }

      // Step 3: Refresh equipment data and close dialog
      if (mutateEquipments) {
        mutateEquipments();
      }
      onSave({ ...equipment, ...data });
      onClose();
      form.reset();
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error updating equipment:", error);
      alert("Failed to update equipment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setEquipmentImages([]);
    setSelectedFiles([]);
    onClose();
  };

  /**
   * Handle image deletion
   * Note: ImageGallery component handles the API call, this updates local state and refreshes cache
   */
  const handleImageDelete = (imageIds: string[]) => {
    setEquipmentImages((prev) =>
      prev.filter((img) => !imageIds.includes(img.id))
    );
    // Refresh equipment data from server
    if (mutateEquipments) {
      mutateEquipments();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

            {/* Equipment Images Section - PHASE 2: MOCK DATA */}
            <div className="space-y-3 pt-4 border-t">
              <div>
                <FormLabel>Equipment Images</FormLabel>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage images for this equipment item
                </p>
              </div>

              {/* Existing Images Gallery */}
              {equipmentImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Images ({equipmentImages.length})</p>
                  <ImageGallery
                    images={equipmentImages}
                    onDelete={handleImageDelete}
                    equipmentId={equipment?.id}
                  />
                </div>
              )}

              {/* Upload More Images */}
              {equipmentImages.length < 5 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {equipmentImages.length > 0 ? "Add More Images" : "Upload Images"}
                  </p>
                  <ImageUpload
                    existingImages={equipmentImages}
                    selectedFiles={selectedFiles}
                    onFilesChange={setSelectedFiles}
                    maxImages={5}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? selectedFiles.length > 0
                    ? "Saving & Uploading..."
                    : "Saving..."
                  : selectedFiles.length > 0
                    ? `Save & Upload ${selectedFiles.length} Image${selectedFiles.length > 1 ? 's' : ''}`
                    : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}