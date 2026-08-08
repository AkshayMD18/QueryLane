import React from "react";
import { useGroups, useCreateGroup, useCreatePostgresSnapshot } from "@/hook";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/pageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HomePage = () => {
    const { data: groups, isLoading } = useGroups();
    const { mutateAsync: createGroup, isPending: isCreating } = useCreateGroup();
    const { mutateAsync: createPostgresSnapshot, isPending: isSnapshotting } = useCreatePostgresSnapshot();
    const [open, setOpen] = React.useState(false);
    const [groupName, setGroupName] = React.useState("");
    const navigate = useNavigate();

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) return;
        try {
            await createGroup(groupName);
            setOpen(false);
            setGroupName("");
        } catch (error) {
            console.error("Failed to create group", error);
        }
    };

    const handlePostgresSnapshot = async () => {
        const databaseName = window.prompt("PostgreSQL database name:");
        if (!databaseName?.trim()) return;

        const schemaName = window.prompt("PostgreSQL schema name:", "public");
        if (!schemaName?.trim()) return;

        const excludedInput = window.prompt("Tables to exclude (comma-separated):", "");
        const excludedTables = excludedInput
            ? excludedInput.split(",").map((table) => table.trim()).filter(Boolean)
            : [];

        try {
            const snapshot = await createPostgresSnapshot({ databaseName, schemaName, excludedTables });
            console.log("PostgreSQL snapshot response:", snapshot);
            console.log("Tables received:", snapshot?.tables?.length ?? 0);
            alert(`PostgreSQL snapshot completed. Tables received: ${snapshot?.tables?.length ?? 0}`);
        } catch (error) {
            console.error("PostgreSQL snapshot failed", error);
            alert("Failed to create PostgreSQL snapshot.");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                heading="Groups"
                description="List of available data groups"
                actions={
                    <div className="flex items-center gap-3">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger render={<Button>Create Group</Button>} />
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Group</DialogTitle>
                                    <DialogDescription>
                                        Create a new group to organize your database tables.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateGroup} className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="groupName">Group Name</Label>
                                        <Input
                                            id="groupName"
                                            placeholder="Enter group name"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                    <DialogFooter className="pt-4">
                                        <Button type="submit" disabled={isCreating || !groupName.trim()}>
                                            {isCreating ? "Creating..." : "Create"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Button variant="outline" onClick={handlePostgresSnapshot} disabled={isSnapshotting}>
                            {isSnapshotting ? "Snapshotting..." : "Import PostgreSQL"}
                        </Button>
                    </div>
                }
            />

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : groups && groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {groups.map((group: any) => (
                        <Card 
                            key={group.id} 
                            className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
                            onClick={() => navigate(`/group/${group.id}`)}
                        >
                            <CardHeader>
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>ID: {group.id}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No groups available. Create one to get started.</p>
            )}
        </div>
    );
};

export default HomePage;
