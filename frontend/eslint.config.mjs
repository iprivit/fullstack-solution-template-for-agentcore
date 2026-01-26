import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const eslintConfig = [
  // Ignore patterns
  {
    ignores: ["node_modules/**", "build/**", "delete/**", "tmp/**", ".vite/**", "src/app/**"],
  },
]

export default eslintConfig


