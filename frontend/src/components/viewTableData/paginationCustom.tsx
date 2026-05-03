import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationCustomProps {
    page: number;
    totalPages: number;
    setPage: (page: number) => void;
}

export const PaginationCustom = ({ page, totalPages, setPage }: PaginationCustomProps) => {
    if (totalPages <= 1) return null;

    return (
        <Pagination className="py-4">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (page > 0) setPage(page - 1);
                        }}
                        className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }).map((_, i) => {
                    // Simple logic to show current, first, last and surrounding pages
                    if (
                        i === 0 ||
                        i === totalPages - 1 ||
                        (i >= page - 1 && i <= page + 1)
                    ) {
                        return (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    href="#"
                                    isActive={page === i}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPage(i);
                                    }}
                                    className="cursor-pointer"
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        );
                    } else if (
                        (i === 1 && page > 2) ||
                        (i === totalPages - 2 && page < totalPages - 3)
                    ) {
                        return (
                            <PaginationItem key={i}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        );
                    }
                    return null;
                })}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages - 1) setPage(page + 1);
                        }}
                        className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
