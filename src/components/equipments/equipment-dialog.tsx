import { Button } from "@ims/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@ims/components/ui/dialog";
import { Input } from "@ims/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@ims/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@ims/components/ui/select"
import { useState } from "react";
import { mutate } from "swr";

const formSchema = z.object({
    name: z.string().nonempty("Name is required"),
    type: z.enum(["unique", "multiple"]),
    location: z.string().nonempty("Location is required"),
    quantity: z.preprocess((val) => {
        // If the value is an empty string, treat it as undefined.
        if (typeof val === "string" && val.trim() === "") return undefined;
        // If it's already a number, use it directly.
        if (typeof val === "number") return val;
        // Otherwise, attempt to parse it as an integer.
        return parseInt(val as string, 10);
    }, z.number().min(1, "Quantity must be at least 1").optional()),

});

export function EquipmentDialog() {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "unique",
            location: "",
            quantity: 1,
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        await fetch("/api/equipments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: data.name,
                location: data.location,
                unique: data.type === "unique",
                quantity: data.type === "multiple" ? data.quantity : 1,
                available: data.type === "multiple" ? data.quantity : 1,
            }),
        }).then((res) => {
            if (!res.ok) {
                // Handle error response
                console.error("Failed to create equipment item");
                return;
            }

            // Invalidate the cache to refresh the data
            mutate("/api/equipments");

            // Optionally reset the form after successful submission
            form.reset({
                name: "",
                type: "unique",
                location: "",
                quantity: 1,
            });

            // Close the dialog after submission if needed
            setOpen(false); // Close the dialog after successful submission
        })
    };

    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="mr-2">New</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Item</DialogTitle>
                    <DialogDescription>
                        Please fill in all the required details below. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="w-full">
                                                <SelectItem value="unique">Unique</SelectItem>
                                                <SelectItem value="multiple">Multiple</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.watch("type") === "multiple" && (
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
