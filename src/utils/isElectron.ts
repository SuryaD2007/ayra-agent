export function isElectron() {
  return typeof window !== "undefined" &&
         // @ts-ignore
         window?.process?.type === "renderer";
}
