import { Button } from "@ims/components/ui/button";
import { Input } from "@ims/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@ims/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ims/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface Equipment {
  id: string;
  name: string;
  location: string;
  quantity: number;
  available: number;
  unique: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface CheckoutFormData {
  userId: string;
  project: string;
}

interface CheckoutFormProps {
  selectedItems: Equipment[];
  users: User[];
  form: UseFormReturn<CheckoutFormData>;
  onSubmit: (data: CheckoutFormData) => void;
}

export function CheckoutForm({
  selectedItems,
  users,
  form,
  onSubmit,
}: CheckoutFormProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background border-t shadow-lg">
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-start gap-4">
              {/* Items Count */}
              <div className="flex flex-col">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Selected
                </p>
                <p className="font-semibold">
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? "s" : ""}
                </p>
              </div>

              {/* User Dropdown */}
              <div className="flex-1 min-w-0">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <div className="h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Project Field */}
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="project"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <div className="h-5">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Checkout Button */}
              <div className="flex flex-col">
                <Button type="submit" className="px-8">
                  Checkout
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
