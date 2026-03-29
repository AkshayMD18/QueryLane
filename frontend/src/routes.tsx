import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Home from "./pages/Home";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
];

export default routes;
