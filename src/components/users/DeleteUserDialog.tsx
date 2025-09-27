import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@ims/components/ui/dialog";
import { Button } from "@ims/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
}

interface DeleteUserDialogProps {
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: (userIds: string[]) => void;
}

export function DeleteUserDialog({ users, isOpen, onClose, onDelete }: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const userIds = users.map(user => user.id);
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });

      const result = await response.json();

      if (response.ok) {
        onDelete(userIds);
        onClose();
      } else {
        alert(`Failed to delete user(s): ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting users:", error);
      alert("Failed to delete user(s). Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isMultiple = users.length > 1;
  const userNames = users.map(user => `${user.firstName} ${user.lastName}`).join(", ");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete User{isMultiple ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {isMultiple ? "these users" : "this user"}?
            <br />
            <br />
            <strong>{userNames}</strong>
            <br />
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : `Delete ${isMultiple ? "Users" : "User"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}