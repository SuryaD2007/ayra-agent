import esbuild from "esbuild";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

console.log('🔨 Building Electron main process...');

esbuild.build({
  entryPoints: [join(__dirname, "main.cjs")],
  outfile: join(__dirname, "dist/main.cjs"),
  bundle: true,
  platform: "node",
  external: ["electron"],
}).then(() => {
  console.log('✅ Build complete!');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
