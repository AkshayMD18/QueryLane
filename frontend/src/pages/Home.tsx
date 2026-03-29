import React from "react";

const Home: React.FC = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                Home Page
            </h1>
            <p className="mt-4 text-muted-foreground">
                Welcome to your new CsvAnalysis application.
            </p>
        </div>
    );
};

export default Home;
