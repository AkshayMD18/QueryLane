import { BadRequestException } from "@nestjs/common";

export function validateSelectQuery(query: string): string {
    if (!query || typeof query !== "string") {
        throw new BadRequestException("Query must be a valid string");
    }

    const cleaned = query.trim().toLowerCase();


    if (cleaned.includes(";")) {
        throw new BadRequestException("Multiple statements are not allowed");
    }

    if (!cleaned.startsWith("select")) {
        throw new BadRequestException("Only SELECT queries are allowed");
    }

    const forbidden = [
        "insert",
        "update",
        "delete",
        "drop",
        "alter",
        "truncate",
        "create",
        "replace",
        "attach",
        "detach",
        "pragma",
        "vacuum"
    ];

    for (const keyword of forbidden) {
        const regex = new RegExp(`\\b${keyword}\\b`, "i");
        if (regex.test(cleaned)) {
            throw new BadRequestException(`Forbidden keyword detected: ${keyword}`);
        }
    }

    return query;
}