import { readFile, writeFile } from "node:fs/promises";

const outputFile = new URL("../dist/index.js", import.meta.url);
const source = await readFile(outputFile, "utf8");
if (!source.startsWith('"use client";')) {
  await writeFile(outputFile, `"use client";\n${source}`, "utf8");
}
