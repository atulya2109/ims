import { Button } from "@ims/components/ui/button";
import { QuantitySelector } from "./QuantitySelector";

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
  checkoutQuantity?: number;
}

interface SelectedItemsProps {
  selectedItems: Equipment[];
  onRemoveItem: (equipmentId: string) => void;
  onUpdateQuantity: (equipmentId: string, quantity: number) => void;
  onClearAll: () => void;
}

export function SelectedItems({
  selectedItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearAll,
}: SelectedItemsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="space-y-2">
        {selectedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.location}
                {item.unique && " (Unique item)"}
                {!item.unique && item.checkoutQuantity && (
                  <span> • Quantity: {item.checkoutQuantity}</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {!item.unique && (
                <QuantitySelector
                  quantity={item.checkoutQuantity || 1}
                  maxQuantity={item.available}
                  onQuantityChange={(qty) => onUpdateQuantity(item.id, qty)}
                  size="sm"
                />
              )}
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemoveItem(item.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button variant="outline" onClick={onClearAll} className="w-full">
          Clear All
        </Button>
      </div>
    </div>
  );
}