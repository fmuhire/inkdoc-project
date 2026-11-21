import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { About } from "./pages/About";
import { Convert } from "./pages/Convert";
import { Editor } from "./pages/Editor";
import { History } from "./pages/History";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="convert" element={<Convert />} />
            <Route path="documents/:id" element={<Editor />} />
            <Route path="history" element={<History />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
