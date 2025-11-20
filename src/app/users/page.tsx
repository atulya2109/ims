"use client";
import { useRef, useState } from "react";
import { Card, CardContent } from "@ims/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ims/components/ui/table";
import { Checkbox } from "@ims/components/ui/checkbox";
import { Button } from "@ims/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import ActionsBar from "@ims/components/users/actionsbar";
import { EditUserDialog } from "@ims/components/users/EditUserDialog";
import { DeleteUserDialog } from "@ims/components/users/DeleteUserDialog";
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
    const [users, setUsers] = useState<UserItem[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetcher = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch user data");
        }
        return response.json();
    };

    const { data, mutate } = useSWR<UserItem[]>("/api/users", fetcher);

    useEffect(() => {
        if (data) {
            setUsers(data);
        }
    }, [data]);

    const singleClick = useRef<NodeJS.Timeout | null>(null);

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    const toggleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleEditUser = (user: UserItem) => {
        setEditingUser(user);
        setIsEditDialogOpen(true);
    };

    const handleDeleteUsers = () => {
        if (selectedUsers.length === 0) return;
        setIsDeleteDialogOpen(true);
    };

    const onUserSaved = (updatedUser: UserItem) => {
        setUsers(prev => prev.map(user =>
            user.id === updatedUser.id ? updatedUser : user
        ));
        mutate(); // Refresh data from server
    };

    const onUsersDeleted = (deletedUserIds: string[]) => {
        setUsers(prev => prev.filter(user => !deletedUserIds.includes(user.id)));
        setSelectedUsers([]);
        mutate(); // Refresh data from server
    };

    const openItemDialog = (id: string) => {
        if (singleClick.current)
            clearTimeout(singleClick.current);

        const user = users.find(u => u.id === id);
        if (user) {
            handleEditUser(user);
        }
    };

    const selectedUsersData = users.filter(user => selectedUsers.includes(user.id));

    return (
        <div className="flex h-screen">
            <div className="flex-1 p-4">
                {/* Combined Actions Bar */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <ActionsBar />

                        {/* Dynamic Action Buttons */}
                        {selectedUsers.length > 0 && (
                            <>
                                {selectedUsers.length === 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditUser(selectedUsersData[0])}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit User
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteUsers}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete {selectedUsers.length > 1 ? `${selectedUsers.length} Users` : 'User'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <Card className="mt-4">
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedUsers.length === users.length && users.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Select all users"
                                        />
                                    </TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow
                                        className="cursor-pointer"
                                        key={user.id}
                                        onDoubleClick={() => openItemDialog(user.id)}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedUsers.includes(user.id)}
                                                onCheckedChange={() => toggleSelectUser(user.id)}
                                                aria-label={`Select ${user.firstName} ${user.lastName}`}
                                            />
                                        </TableCell>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                                        <TableCell>{user.position}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditUser(user);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedUsers([user.id]);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Dialogs */}
                <EditUserDialog
                    user={editingUser}
                    isOpen={isEditDialogOpen}
                    onClose={() => setIsEditDialogOpen(false)}
                    onSave={onUserSaved}
                />

                <DeleteUserDialog
                    users={selectedUsersData}
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onDelete={onUsersDeleted}
                />
            </div>
        </div>
    );
}
