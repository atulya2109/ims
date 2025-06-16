import { Button } from "@ims/components/ui/button";
import { QuantitySelector } from "./QuantitySelector";
import { useState } from "react";

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
}

interface SearchResultsProps {
  searchQuery: string;
  isLoading: boolean;
  filteredEquipments: Equipment[];
  onAddItem: (equipment: Equipment, quantity?: number) => void;
}

export function SearchResults({
  searchQuery,
  isLoading,
  filteredEquipments,
  onAddItem,
}: SearchResultsProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!searchQuery) return null;

  const getQuantity = (equipmentId: string) => quantities[equipmentId] || 1;

  const setQuantity = (equipmentId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [equipmentId]: quantity }));
  };

  const handleAddItem = (equipment: Equipment) => {
    const quantity = equipment.unique ? 1 : getQuantity(equipment.id);
    onAddItem(equipment, quantity);
    // Reset quantity after adding
    if (!equipment.unique) {
      setQuantity(equipment.id, 1);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Search Results</h3>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filteredEquipments.length === 0 ? (
        <p className="text-muted-foreground">No equipment found</p>
      ) : (
        <div className="space-y-2">
          {filteredEquipments.map((equipment) => (
            <div
              key={equipment.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div className="flex-1">
                <p className="font-medium">{equipment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {equipment.location} • Available: {equipment.available}
                  {equipment.unique && " (Unique item)"}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {!equipment.unique && equipment.available > 1 && (
                  <QuantitySelector
                    quantity={getQuantity(equipment.id)}
                    maxQuantity={equipment.available}
                    onQuantityChange={(qty) => setQuantity(equipment.id, qty)}
                    size="sm"
                  />
                )}
                
                <Button
                  size="sm"
                  onClick={() => handleAddItem(equipment)}
                  disabled={equipment.available === 0}
                >
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}