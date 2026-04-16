import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";
import prettierRecommended from "eslint-plugin-prettier/recommended";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwind.configs["flat/recommended"],
  prettierRecommended,
  {
    settings: {
      tailwindcss: {
        config: "tailwind.config.ts",
        whitelist: [
          "text-brand",
          "text-brand-100",
          "bg-brand",
          "bg-brand-100",
          "text-red",
          "text-error",
          "text-green",
          "text-blue",
          "text-pink",
          "text-orange",
          "text-light",
          "text-dark",
          "font-poppins",
          "shadow-drop-1",
          "shadow-drop-2",
          "shadow-drop-3",
          "animate-caret-blink",
        ],
      },
    },
    rules: {
      "tailwindcss/no-custom-classname": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
