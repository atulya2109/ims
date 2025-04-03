"use client";
import { useRef, useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import ActionsBar from "@ims/components/users/actionsbar";
import useSWR from "swr";
import { useEffect } from "react";

interface UserItem {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    email: string;
}

export default function UsersPage() {

    const userData: UserItem[] = [
        { id: "1", firstName: "Atulya", lastName: "Bist", position: "Directed Research", email: "bist@usc.edu" },
        { id: "2", firstName: "Atulya", lastName: "Bist", position: "Directed Research", email: "bist@usc.edu" },
        { id: "3", firstName: "Atulya", lastName: "Bist", position: "Directed Research", email: "bist@usc.edu" },
    ];

    const [users, setUsers] = useState<UserItem[]>([]);

    const fetcher = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch user data");
        }
        return response.json();
    };

    const { data, error } = useSWR<UserItem[]>("/api/users", fetcher);

    useEffect(() => {
        if (data) {
            setUsers(data);
        }
    }, [data]);

    const singleClick = useRef<NodeJS.Timeout | null>(null);

    const openItemDialog = (id: string) => {

        if (singleClick.current)
            clearTimeout(singleClick.current);

        console.log("Open item dialog", id);
    };

    return (
        <div className="flex h-screen">
            <div className="flex-1 p-4">
                <ActionsBar />
                <Card className="mt-4">
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Email</TableHead>

                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow className="cursor-pointer" key={user.id} onDoubleClick={() => openItemDialog(user.id)}>
                                        <TableCell>
                                            {user.id}
                                        </TableCell>
                                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                                        <TableCell>{user.position}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
