"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckinSearchBar } from "@ims/components/checkin/CheckinSearchBar";
import { CheckinSearchResults } from "@ims/components/checkin/CheckinSearchResults";
import { CheckinSelectedItems } from "@ims/components/checkin/CheckinSelectedItems";
import { CheckinForm } from "@ims/components/checkin/CheckinForm";

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
  checkinQuantity?: number; // For tracking selected quantity in check-in
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const checkinFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  project: z.string().min(1, "Project is required"),
});

export default function CheckinPage() {
  const scannedCodeRef = useRef("");
  const [scannedCode, setScannedCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Equipment[]>([]);

  const { data: equipments = [], isLoading, mutate: mutateEquipments } = useSWR<Equipment[]>(
    "/api/equipments",
    fetcher
  );
  const { data: users = [] } = useSWR("/api/users", fetcher);

  const checkinForm = useForm<z.infer<typeof checkinFormSchema>>({
    resolver: zodResolver(checkinFormSchema),
    defaultValues: {
      userId: "",
      project: "",
    },
  });

  const filteredEquipments = equipments.filter(
    (equipment) =>
      (equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (equipment.quantity - equipment.available) > 0 // Only show equipment that has items checked out
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
          // Here, you can trigger your check-in logic with the scanned code.
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

  const addItemToCheckin = (equipment: Equipment, quantity: number = 1) => {
    const existingItem = selectedItems.find((item) => item.id === equipment.id);
    const maxAvailable = equipment.quantity - equipment.available; // Max that can be checked in

    if (existingItem) {
      // If item already exists, don't add it again for unique items
      if (equipment.unique) return;
      // For multiple items, update the quantity
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.id === equipment.id
            ? { ...item, checkinQuantity: Math.min((item.checkinQuantity || 0) + quantity, maxAvailable) }
            : item
        )
      );
      return;
    }
    setSelectedItems((prev) => [...prev, { ...equipment, checkinQuantity: quantity }]);
  };

  const updateItemQuantity = (equipmentId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromCheckin(equipmentId);
      return;
    }

    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.id === equipmentId) {
          const maxAvailable = item.quantity - item.available;
          return { ...item, checkinQuantity: Math.min(newQuantity, maxAvailable) };
        }
        return item;
      })
    );
  };

  const removeItemFromCheckin = (equipmentId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== equipmentId));
  };

  const onCheckinSubmit = async (data: z.infer<typeof checkinFormSchema>) => {
    try {
      const checkinData = {
        userId: data.userId,
        project: data.project,
        items: selectedItems.map(item => ({
          id: item.id,
          name: item.name,
          checkinQuantity: item.checkinQuantity || 1
        }))
      };

      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkinData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Check-in successful! Check-in ID: ${result.checkinId}`);
        // Reset form and selected items
        checkinForm.reset();
        setSelectedItems([]);
        // Refresh equipment data to show updated availability
        mutateEquipments();
      } else {
        alert(`Check-in failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Check-in failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 pb-32">
        <h1 className="text-2xl font-bold">Check-In</h1>
        <p className="text-sm text-muted-foreground">
          Scanned Code: {scannedCode}
        </p>

        <CheckinSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <CheckinSearchResults
          searchQuery={searchQuery}
          isLoading={isLoading}
          filteredEquipments={filteredEquipments}
          onAddItem={addItemToCheckin}
        />

        <CheckinSelectedItems
          selectedItems={selectedItems}
          onRemoveItem={removeItemFromCheckin}
          onUpdateQuantity={updateItemQuantity}
          onClearAll={() => setSelectedItems([])}
        />
      </div>

      <CheckinForm
        selectedItems={selectedItems}
        users={users}
        form={checkinForm}
        onSubmit={onCheckinSubmit}
      />
    </div>
  );
}