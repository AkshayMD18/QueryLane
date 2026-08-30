import React from "react";
import { useGroups, useCreateGroup, useCreatePostgresSnapshot, useDeleteGroup } from "@/hook";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/pageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PostgresSnapshotModal } from "@/components/homePage/postgresSnapshotModal";
import type { PostgresSnapshotRequest } from "@/type/groups";
import type { Group } from "@/type/groups";
import { Trash2 } from "lucide-react";

const HomePage = () => {
    const { data: groups, isLoading } = useGroups();
    const { mutateAsync: createGroup, isPending: isCreating } = useCreateGroup();
    const { mutateAsync: createPostgresSnapshot, isPending: isSnapshotting } = useCreatePostgresSnapshot();
    const { mutateAsync: deleteGroup, isPending: isDeleting } = useDeleteGroup();
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

    const handlePostgresSnapshot = async (request: PostgresSnapshotRequest) => {
        try {
            const snapshot = await createPostgresSnapshot(request);
            console.log("PostgreSQL snapshot response:", snapshot);
            console.log("Tables received:", snapshot?.tables?.length ?? 0);
            alert(`PostgreSQL snapshot completed. Tables received: ${snapshot?.tables?.length ?? 0}`);
        } catch (error) {
            console.error("PostgreSQL snapshot failed", error);
            alert("Failed to create PostgreSQL snapshot.");
        }
    };

    const handleDeleteGroup = async (event: React.MouseEvent, groupId: number) => {
        event.stopPropagation();
        if (!window.confirm("Delete this group and all of its tables?")) return;

        try {
            await deleteGroup(groupId);
        } catch (error) {
            console.error("Failed to delete group", error);
            alert("Failed to delete group.");
        }
    };

    return (
        <div className="space-y-6 md:space-y-8">
            <PageHeader
                heading="Groups"
                description="List of available data groups"
                actions={
                    <div className="flex flex-wrap items-center gap-2">
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
                        <PostgresSnapshotModal onSubmit={handlePostgresSnapshot} isSubmitting={isSnapshotting} />
                    </div>
                }
            />

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : groups && groups.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                    {groups.map((group: Group) => (
                        <Card 
                            key={group.id} 
                            className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
                            onClick={() => navigate(`/group/${group.id}`)}
                        >
                            <CardHeader className="relative">
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>ID: {group.id}</CardDescription>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                                    onClick={(event) => handleDeleteGroup(event, Number(group.id))}
                                    disabled={isDeleting}
                                    aria-label={`Delete ${group.name}`}
                                >
                                    <Trash2 />
                                </Button>
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
