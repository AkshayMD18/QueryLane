import { BrowserRouter, useRoutes } from "react-router-dom";
import routes from "./routes";

const AppRoutes = () => {
  const content = useRoutes(routes);
  return content;
};

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
