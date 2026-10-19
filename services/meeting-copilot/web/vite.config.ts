import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, the API runs on :8000 (uvicorn) and Vite proxies /api (HTTP and live WebSockets) to it.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": { target: "http://localhost:8000", ws: true } } },
});
