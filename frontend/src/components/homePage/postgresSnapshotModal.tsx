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
    const [host, setHost] = React.useState("");
    const [port, setPort] = React.useState("5432");
    const [user, setUser] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [connectionString, setConnectionString] = React.useState("");
    const [excludedTables, setExcludedTables] = React.useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!host.trim() || !port.trim() || !user.trim() || !password || !databaseName.trim() || !schemaName.trim()) return;

        await onSubmit({
            host: host.trim(),
            port: Number(port),
            user: user.trim(),
            password,
            databaseName: databaseName.trim(),
            schemaName: schemaName.trim(),
            connectionString: connectionString.trim() || undefined,
            excludedTables: excludedTables
                .split(",")
                .map((table) => table.trim())
                .filter(Boolean),
        });

        setOpen(false);
        setDatabaseName("");
        setSchemaName("public");
        setHost(""); setPort("5432"); setUser(""); setPassword(""); setConnectionString("");
        setExcludedTables("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline">Import PostgreSQL</Button>} />
            <DialogContent className="max-w-xl gap-3 p-3 sm:p-4">
                <DialogHeader>
                    <DialogTitle>Import PostgreSQL</DialogTitle>
                    <DialogDescription>
                        Create a snapshot of the tables in a PostgreSQL schema.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-3 py-2">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(100px,1fr)] sm:items-end sm:gap-3">
                        <div className="grid gap-2">
                        <Label htmlFor="postgres-host">Host</Label>
                        <Input id="postgres-host" placeholder="db.example.com" value={host} onChange={(event) => setHost(event.target.value)} required autoComplete="off" />
                        </div>
                        <div className="grid gap-2"><Label htmlFor="postgres-port">Port</Label><Input id="postgres-port" type="number" min="1" value={port} onChange={(event) => setPort(event.target.value)} required /></div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        <div className="grid gap-2"><Label htmlFor="postgres-user">Username</Label><Input id="postgres-user" value={user} onChange={(event) => setUser(event.target.value)} required autoComplete="username" /></div>
                        <div className="grid gap-2"><Label htmlFor="postgres-password">Password</Label><Input id="postgres-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
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
                    </div>
                    <div className="grid gap-2"><Label htmlFor="postgres-connection-string">Connection string <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="postgres-connection-string" placeholder="postgresql://..." value={connectionString} onChange={(event) => setConnectionString(event.target.value)} autoComplete="off" /></div>
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
                    <DialogFooter className="pt-3">
                        <Button type="submit" disabled={isSubmitting || !host.trim() || !user.trim() || !password || !databaseName.trim() || !schemaName.trim()}>
                            {isSubmitting ? "Snapshotting..." : "Create Snapshot"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
