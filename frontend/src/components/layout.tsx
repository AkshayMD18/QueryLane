import { Link, Outlet } from "react-router-dom";

export const Layout = () => {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            {/* Simple Header */}
            <header className="sticky top-0 z-50 w-full border-sidebar-border bg-sidebar/95 text-sidebar-foreground backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
                <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 md:px-6">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="bg-primary rounded-lg p-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5 text-primary-foreground"
                            >
                                <path d="M3 3v18h18" />
                                <path d="M7 16l4-4 4 4 5-5" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold tracking-tight">
                            CsvInsight
                        </span>
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
                <Outlet />
            </main>
        </div>
    );
};
