export function getPagination(page = 1, limit = 10) {
    const take = Math.min(limit, 100); // cap limit
    const skip = (page - 1) * take;

    return {
        take,
        skip,
    };
}