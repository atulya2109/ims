import { Input } from "@ims/components/ui/input";
import { Search, X } from "lucide-react";

interface CheckinSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function CheckinSearchBar({ searchQuery, onSearchChange }: CheckinSearchBarProps) {
  const handleClear = () => {
    onSearchChange("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search equipment to check-in by name or location..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          type="button"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}