import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "/": pages have their own addresses (/mijozlar), so files are always loaded from the site root.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
