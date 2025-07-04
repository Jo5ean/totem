import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Reglas específicas para API
      "no-unused-vars": "warn",
      "no-console": "off", // Permitir console.log en API
      "prefer-const": "error"
    }
  }
];

export default eslintConfig;
