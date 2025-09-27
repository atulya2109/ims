import React from "react";
import { Button } from "@ims/components/ui/button";
import { Card, CardContent } from "@ims/components/ui/card";
import { Minus, Plus } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
}

interface CheckinSearchResultsProps {
  searchQuery: string;
  isLoading: boolean;
  filteredEquipments: Equipment[];
  onAddItem: (equipment: Equipment, quantity: number) => void;
}

export function CheckinSearchResults({
  searchQuery,
  isLoading,
  filteredEquipments,
  onAddItem,
}: CheckinSearchResultsProps) {
  if (searchQuery.trim() === "") return null;

  const getCheckedOutQuantity = (equipment: Equipment) => {
    return equipment.quantity - equipment.available;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Searching...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Search Results</h3>
        {filteredEquipments.length === 0 ? (
          <p className="text-muted-foreground">No equipment found</p>
        ) : (
          <div className="space-y-2">
            {filteredEquipments.map((equipment) => {
              const checkedOutQuantity = getCheckedOutQuantity(equipment);

              // Only show equipment that has items checked out
              if (checkedOutQuantity <= 0) return null;

              return (
                <CheckinItem
                  key={equipment.id}
                  equipment={equipment}
                  checkedOutQuantity={checkedOutQuantity}
                  onAddItem={onAddItem}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CheckinItemProps {
  equipment: Equipment;
  checkedOutQuantity: number;
  onAddItem: (equipment: Equipment, quantity: number) => void;
}

function CheckinItem({ equipment, checkedOutQuantity, onAddItem }: CheckinItemProps) {
  const [quantity, setQuantity] = React.useState(1);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(checkedOutQuantity, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleAdd = () => {
    onAddItem(equipment, quantity);
    setQuantity(1);
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <h4 className="font-medium">{equipment.name}</h4>
        <p className="text-sm text-muted-foreground">
          {equipment.location} • Checked out: {checkedOutQuantity}
          {equipment.unique ? " (Unique item)" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!equipment.unique && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= checkedOutQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </>
        )}
        <Button onClick={handleAdd}>Add</Button>
      </div>
    </div>
  );
}