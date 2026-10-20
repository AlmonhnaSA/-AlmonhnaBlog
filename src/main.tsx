import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initStorageGuard } from "./lib/storageGuard";
import { installImageOptimizer } from "./lib/imageOptimizer";

// يجب أن يعمل قبل تحميل عميل Supabase حتى يعترض عمليات setItem الفاشلة
initStorageGuard();
installImageOptimizer();

createRoot(document.getElementById("root")!).render(<App />);
