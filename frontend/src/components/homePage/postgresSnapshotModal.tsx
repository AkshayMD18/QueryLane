import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PostgresSnapshotRequest } from "@/type/groups";

type PostgresSnapshotModalProps = {
    onSubmit: (request: PostgresSnapshotRequest) => Promise<void>;
    isSubmitting: boolean;
};

export const PostgresSnapshotModal = ({ onSubmit, isSubmitting }: PostgresSnapshotModalProps) => {
    const [open, setOpen] = React.useState(false);
    const [databaseName, setDatabaseName] = React.useState("");
    const [schemaName, setSchemaName] = React.useState("public");
    const [excludedTables, setExcludedTables] = React.useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!databaseName.trim() || !schemaName.trim()) return;

        await onSubmit({
            databaseName: databaseName.trim(),
            schemaName: schemaName.trim(),
            excludedTables: excludedTables
                .split(",")
                .map((table) => table.trim())
                .filter(Boolean),
        });

        setOpen(false);
        setDatabaseName("");
        setSchemaName("public");
        setExcludedTables("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline">Import PostgreSQL</Button>} />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import PostgreSQL</DialogTitle>
                    <DialogDescription>
                        Create a snapshot of the tables in a PostgreSQL schema.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="postgres-database-name">Database Name</Label>
                        <Input
                            id="postgres-database-name"
                            value={databaseName}
                            onChange={(event) => setDatabaseName(event.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="postgres-schema-name">Schema Name</Label>
                        <Input
                            id="postgres-schema-name"
                            value={schemaName}
                            onChange={(event) => setSchemaName(event.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="postgres-excluded-tables">Tables to Exclude</Label>
                        <Input
                            id="postgres-excluded-tables"
                            placeholder="table_one, table_two"
                            value={excludedTables}
                            onChange={(event) => setExcludedTables(event.target.value)}
                            autoComplete="off"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isSubmitting || !databaseName.trim() || !schemaName.trim()}>
                            {isSubmitting ? "Snapshotting..." : "Create Snapshot"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
