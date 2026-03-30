import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import HomePage from "./pages/homePage";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <HomePage />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
];

export default routes;
