import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import HomePage from "./pages/homePage";
import { ViewTable } from "./pages/viewTable";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <HomePage />,
    },
    {
        path: "/file/:tableName",
        element: <ViewTable />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
];

export default routes;
