const fs = require("fs");
const path = require("path");

const standalone = path.join(".next", "standalone");
if (!fs.existsSync(standalone)) {
  console.error("No existe .next/standalone. Ejecuta next build antes.");
  process.exit(1);
}

fs.cpSync("public", path.join(standalone, "public"), { recursive: true });
fs.cpSync(path.join(".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});
console.log("Standalone listo con public y static.");
