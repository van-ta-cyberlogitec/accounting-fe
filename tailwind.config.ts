import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx,html}"],
  theme: { extend: {} },
  plugins: [forms],
} satisfies Config;
