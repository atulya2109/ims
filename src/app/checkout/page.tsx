"use client";
import { useEffect, useRef, useState } from "react";

export default function CheckoutPage() {
    const scannedCodeRef = useRef("");
    const [scannedCode, setScannedCode] = useState("");
    useEffect(() => {
        // Timeout can be used to clear buffer if typing is too slow (optional)
        let clearBufferTimeout: NodeJS.Timeout;

        const handleKeyDown = (e: { key: string; }) => {
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
    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="text-sm text-muted-foreground">Scanned Code: {scannedCode}</p>
        </div>
    )
}