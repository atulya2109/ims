import { Button } from "@ims/components/ui/button";
import { Card, CardContent } from "@ims/components/ui/card";
import { Minus, Plus, X } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
  checkinQuantity?: number;
}

interface CheckinSelectedItemsProps {
  selectedItems: Equipment[];
  onRemoveItem: (equipmentId: string) => void;
  onUpdateQuantity: (equipmentId: string, newQuantity: number) => void;
  onClearAll: () => void;
}

export function CheckinSelectedItems({
  selectedItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearAll,
}: CheckinSelectedItemsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Items to Check-In</h3>
          <Button variant="outline" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
        <div className="space-y-2">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.location} • Quantity: {item.checkinQuantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!item.unique && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.id, (item.checkinQuantity || 1) - 1)
                      }
                      disabled={(item.checkinQuantity || 1) <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.checkinQuantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.id, (item.checkinQuantity || 1) + 1)
                      }
                      disabled={(item.checkinQuantity || 0) >= (item.quantity - item.available)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}