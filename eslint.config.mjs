import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Cargamos los horarios disponibles con un fetch reactivo dentro de un
      // useEffect (mostrando "Cargando…" antes de pedirlos). Es un patrón
      // legítimo —la propia documentación de React lo usa— pero esta regla
      // experimental de React 19 lo marca como falso positivo. La apagamos.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
