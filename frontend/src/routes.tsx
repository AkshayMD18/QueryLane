import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import HomePage from "./pages/homePage";
import { ViewTable } from "./pages/viewTableData";
import { Layout } from "./components/layout";

const routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "file/:tableName",
                element: <ViewTable />,
            },
        ]
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
];

export default routes;
