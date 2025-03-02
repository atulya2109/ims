import { Button } from "@ims/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@ims/components/ui/dialog"
import { Input } from "@ims/components/ui/input"
import { Label } from "@ims/components/ui/label"

export function DialogDemo() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">New</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Item</DialogTitle>
                    <DialogDescription>
                        Please fill in all the required details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="product-name" value="Pedro Duarte" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">
                            Location
                        </Label>
                        <Input id="location" value="@peduarte" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="on-hand" className="text-right">
                            Quantity
                        </Label>
                        <Input id="on-hand" value="@peduarte" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
