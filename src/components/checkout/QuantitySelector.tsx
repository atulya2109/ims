import { Button } from "@ims/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
  size?: "sm" | "default";
}

export function QuantitySelector({
  quantity,
  maxQuantity,
  onQuantityChange,
  size = "default",
}: QuantitySelectorProps) {
  const buttonSize = size === "sm" ? "sm" : "sm";
  const inputClass = size === "sm" ? "h-8 w-12 text-sm" : "h-9 w-16";

  return (
    <div className="flex items-center gap-1">
      <Button
        size={buttonSize}
        variant="outline"
        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="h-8 w-8 p-0"
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <div className={`${inputClass} flex items-center justify-center border border-input rounded-md bg-background text-center font-medium`}>
        {quantity}
      </div>
      
      <Button
        size={buttonSize}
        variant="outline"
        onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
        disabled={quantity >= maxQuantity}
        className="h-8 w-8 p-0"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}