import * as React from "react";
import { Button } from "../ui/button";
import { EquipmentDialog } from "./equipment-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ims/components/ui/dialog";

interface ActionsBarProps {
  selectedItems: any[];
  onDelete: () => void;
}

interface DeleteDialogProps {
  selectedItems: any[];
  onDelete: () => void;
}

function DeleteDialog({ selectedItems, onDelete }: DeleteDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="mr-2"
          disabled={!selectedItems.length}
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Items</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the selected items?<br></br>Click <strong>Confirm</strong> to Delete.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={() => { onDelete(); setOpen(false) }}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ActionsBar({ selectedItems, onDelete }: ActionsBarProps) {
  return (
    <div className="flex justify-between mb-4">
      <div>
        <EquipmentDialog />
        <DeleteDialog selectedItems={selectedItems} onDelete={onDelete} />
        {selectedItems.length > 0 && (
          <span className="text-sm text-gray-500">{selectedItems.length} selected</span>
        )}
      </div>
    </div>
  );
}