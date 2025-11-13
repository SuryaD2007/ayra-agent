import esbuild from "esbuild";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

esbuild.build({
  entryPoints: [join(__dirname, "main.cjs")],
  outfile: join(__dirname, "dist/main.cjs"),
  bundle: true,
  platform: "node",
  external: ["electron"],
}).catch(() => process.exit(1));
