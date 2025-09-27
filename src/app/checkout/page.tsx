"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchBar } from "@ims/components/checkout/SearchBar";
import { SearchResults } from "@ims/components/checkout/SearchResults";
import { SelectedItems } from "@ims/components/checkout/SelectedItems";
import { CheckoutForm } from "@ims/components/checkout/CheckoutForm";

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
  checkoutQuantity?: number; // For tracking selected quantity in checkout
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const checkoutFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  project: z.string().min(1, "Project is required"),
});

export default function CheckoutPage() {
  const scannedCodeRef = useRef("");
  const [scannedCode, setScannedCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Equipment[]>([]);

  const { data: equipments = [], isLoading, mutate: mutateEquipments } = useSWR<Equipment[]>(
    "/api/equipments",
    fetcher
  );
  const { data: users = [] } = useSWR("/api/users", fetcher);

  const checkoutForm = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      userId: "",
      project: "",
    },
  });

  const filteredEquipments = equipments.filter(
    (equipment) =>
      equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect(() => {
    // Timeout can be used to clear buffer if typing is too slow (optional)
    let clearBufferTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: { key: string }) => {
      // Clear the timeout on every key event to ensure continuous scanning is captured.
      clearTimeout(clearBufferTimeout);

      if (e.key === "Enter") {
        // When Enter is pressed, process the scanned code.
        const scannedCode = scannedCodeRef.current.trim();
        if (scannedCode) {
          console.log("Scanned code:", scannedCode);
          setScannedCode(scannedCode);
          // Here, you can trigger your checkout logic with the scanned code.
          // For example, add the scanned item to your checkout list.
        }
        // Reset the buffer.
        scannedCodeRef.current = "";
      } else {
        // Accumulate the characters.
        scannedCodeRef.current += e.key;
      }

      // Optionally, clear the buffer if no key is pressed for a short period.
      clearBufferTimeout = setTimeout(() => {
        scannedCodeRef.current = "";
      }, 10); // Adjust delay as needed
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(clearBufferTimeout);
    };
  }, []);

  const addItemToCheckout = (equipment: Equipment, quantity: number = 1) => {
    const existingItem = selectedItems.find((item) => item.id === equipment.id);
    if (existingItem) {
      // If item already exists, don't add it again for unique items
      if (equipment.unique) return;
      // For multiple items, update the quantity
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.id === equipment.id
            ? { ...item, checkoutQuantity: Math.min((item.checkoutQuantity || 0) + quantity, item.available) }
            : item
        )
      );
      return;
    }
    setSelectedItems((prev) => [...prev, { ...equipment, checkoutQuantity: quantity }]);
  };

  const updateItemQuantity = (equipmentId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromCheckout(equipmentId);
      return;
    }
    
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === equipmentId
          ? { ...item, checkoutQuantity: Math.min(newQuantity, item.available) }
          : item
      )
    );
  };

  const removeItemFromCheckout = (equipmentId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== equipmentId));
  };

  const onCheckoutSubmit = async (data: z.infer<typeof checkoutFormSchema>) => {
    try {
      const checkoutData = {
        userId: data.userId,
        project: data.project,
        items: selectedItems.map(item => ({
          id: item.id,
          name: item.name,
          checkoutQuantity: item.checkoutQuantity || 1
        }))
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Checkout successful! Checkout ID: ${result.checkoutId}`);
        // Reset form and selected items
        checkoutForm.reset();
        setSelectedItems([]);
        // Refresh equipment data to show updated availability
        mutateEquipments();
      } else {
        alert(`Checkout failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 pb-32">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Scanned Code: {scannedCode}
        </p>

        <SearchBar 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
        />

        <SearchResults
          searchQuery={searchQuery}
          isLoading={isLoading}
          filteredEquipments={filteredEquipments}
          onAddItem={addItemToCheckout}
        />

        <SelectedItems
          selectedItems={selectedItems}
          onRemoveItem={removeItemFromCheckout}
          onUpdateQuantity={updateItemQuantity}
          onClearAll={() => setSelectedItems([])}
        />
      </div>

      <CheckoutForm
        selectedItems={selectedItems}
        users={users}
        form={checkoutForm}
        onSubmit={onCheckoutSubmit}
      />
    </div>
  );
}
