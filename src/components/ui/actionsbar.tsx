import * as React from "react";
import { Button } from "./button";
import { DialogDemo } from "../equipment-dialog";

interface ActionsBarProps {
  selectedItems: any[];
}

export default function ActionsBar({ selectedItems }: ActionsBarProps) {
  return (
    <div className="flex justify-between mb-4">
      <div>
        <DialogDemo />
        <Button variant="outline" className="mr-2" disabled={!selectedItems.length}>Checkin</Button>
        <Button variant="outline" disabled={!selectedItems.length}>Checkout</Button>
      </div>
      <div>
        {selectedItems.length > 0 && (
          <span className="text-sm text-gray-500">{selectedItems.length} selected</span>
        )}
      </div>
    </div>
  );
}