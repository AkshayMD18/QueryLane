import { useState } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup } from "@/components/ui/field"
import type { QueryModalProps } from "@/type/table";
import { Spinner } from "@/components/ui/spinner";

export const QueryModal = ({ trigger, onExecute, isLoading }: QueryModalProps) => {
    const [query, setQuery] = useState("")

    const handleExecute = (e: React.FormEvent) => {
        e.preventDefault()
        if (onExecute) {
            onExecute(query)
        }
    }

    return (
        <Dialog>
            <DialogTrigger render={trigger || <Button variant="outline">Open Query</Button>} />
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleExecute}>
                    <DialogHeader>
                        <DialogTitle>Execute SQLite Query</DialogTitle>
                        <DialogDescription>
                            Discribe your query in natural language and get the result.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="query">Query</Label>
                                <Input
                                    id="query"
                                    placeholder="Eg: Show all data from the table."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoComplete="off"
                                    disabled={isLoading}
                                />
                            </Field>
                        </FieldGroup>
                    </div>

                    <DialogFooter className="sm:justify-end">
                        <DialogClose render={<Button type="button" variant="outline" disabled={isLoading} />}>
                            Cancel
                        </DialogClose>
                        <Button type="submit" disabled={isLoading || !query.trim()}>
                            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                            {isLoading ? "Executing..." : "Execute Query"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
