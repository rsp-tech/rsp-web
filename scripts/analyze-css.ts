import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import zlib from "node:zlib";
import ts from "typescript";

const execAsync = promisify(exec);
const brotliCompressAsync = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);

const SRC_DIR = path.join(process.cwd(), "src");
const OUTPUT_FILE = path.join(process.cwd(), "classname-usage.json");
const OUTPUT_CSV = path.join(process.cwd(), "classname-usage.csv");

const CSS_ENTRY = "./src/app/globals.css";
const CSS_BASELINE_OUT = "./dist/tailwind-baseline.css";
const ABOUT_EDITORIAL_CSS = "./src/app/about/about-editorial.css";

interface ClassUsage {
  count: number;
  components: Set<string>;
}

const usageMap = new Map<string, ClassUsage>();
const filesUsingCn = new Set<string>();
const primitiveExports = new Map<string, Set<string>>();
const primitivesUsedWithClassName = new Map<string, Set<string>>();
const ignoredClasses = new Set<string>();

const loadIgnoredCustomCssClasses = async (): Promise<void> => {
  try {
    const cssPath = path.resolve(process.cwd(), ABOUT_EDITORIAL_CSS);
    const cssContent = await fs.readFile(cssPath, "utf-8");
    const matches = cssContent.matchAll(/\.([a-zA-Z0-9_-]+)/g);
    for (const match of matches) {
      const cls = match[1];
      if (cls && cls !== "dark") {
        ignoredClasses.add(cls);
      }
    }
  } catch (err) {
    console.warn(
      "⚠️ Warning: Could not load about-editorial.css for class ignoring:",
      err,
    );
  }
};

const loadExistingClasses = async (): Promise<Set<string>> => {
  const existing = new Set<string>();
  try {
    const raw = await fs.readFile(OUTPUT_FILE, "utf-8");
    const json = JSON.parse(raw);
    if (Array.isArray(json.data)) {
      for (const item of json.data) {
        if (item && typeof item.className === "string") {
          existing.add(item.className);
        }
      }
    }
  } catch {
    // If JSON read/parse fails, try loading from CSV
    try {
      const csvRaw = await fs.readFile(OUTPUT_CSV, "utf-8");
      const lines = csvRaw.split(/\r?\n/).slice(1);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const rawCls = trimmed.split(",")[0];
        const cls = rawCls.replace(/^\./, "").replace(/^"|"$/g, "");
        if (cls) existing.add(cls);
      }
    } catch {
      // Neither file exists yet
    }
  }
  return existing;
};

const pool = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = [];
  const copies = [...items];
  const run = async (): Promise<void> => {
    while (copies.length > 0) {
      const item = copies.shift();
      if (item) results.push(await fn(item));
    }
  };
  await Promise.all(Array.from({ length: limit }, run));
  return results;
};

const getAllFiles = async (dir: string): Promise<string[]> => {
  const fileList: string[] = [];
  const files = await fs.readdir(dir, { withFileTypes: true });

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        fileList.push(...(await getAllFiles(filePath)));
      } else if (file.name.endsWith(".tsx")) {
        fileList.push(filePath);
      }
    }),
  );
  return fileList;
};

const identifyPrimitives = async (filePath: string): Promise<void> => {
  const fileContent = await fs.readFile(filePath, "utf-8");
  if (!fileContent.includes("cn(")) return;

  const relativePath = path.relative(process.cwd(), filePath);
  filesUsingCn.add(relativePath);

  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );
  const exports = new Set<string>();

  const visit = (node: ts.Node) => {
    if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
      exports.add(node.expression.text);
    } else if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      node.exportClause.elements.forEach((el) => {
        exports.add(el.name.text);
      });
    } else if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      exports.add(node.name.text);
    } else if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      node.declarationList.declarations.forEach((d) => {
        if (ts.isIdentifier(d.name)) exports.add(d.name.text);
      });
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  primitiveExports.set(relativePath, exports);
};

const processFile = async (filePath: string): Promise<void> => {
  const fileContent = await fs.readFile(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );
  const relativePath = path.relative(process.cwd(), filePath);
  const importedPrimitives = new Map<string, string>();

  const visitImports = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const resolvedPath = moduleSpecifier.startsWith("@/")
        ? path.join("src", moduleSpecifier.replace("@/", ""))
        : path.relative(
            process.cwd(),
            path.resolve(path.dirname(filePath), moduleSpecifier),
          );

      let matchedPath = "";
      for (const ext of [".tsx", ".ts"]) {
        const p = resolvedPath + ext;
        if (filesUsingCn.has(p)) {
          matchedPath = p;
          break;
        }
        const pIndex = path.join(resolvedPath, `index${ext}`);
        if (filesUsingCn.has(pIndex)) {
          matchedPath = pIndex;
          break;
        }
      }

      if (
        matchedPath &&
        node.importClause?.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      ) {
        node.importClause.namedBindings.elements.forEach((element) => {
          const importName = element.propertyName?.text || element.name.text;
          if (primitiveExports.get(matchedPath)?.has(importName)) {
            importedPrimitives.set(element.name.text, matchedPath);
          }
        });
      }
    }
    ts.forEachChild(node, visitImports);
  };
  visitImports(sourceFile);

  const addClasses = (text: string, source: string) => {
    const classes = text.split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      if (ignoredClasses.has(cls)) continue;
      let entry = usageMap.get(cls);
      if (!entry) {
        entry = { count: 0, components: new Set() };
        usageMap.set(cls, entry);
      }
      entry.count++;
      entry.components.add(source);
    }
  };

  const extractStringsFromExpression = (node: ts.Node) => {
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      if (
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken
      ) {
        return; // Skip comparison conditions like align === "center"
      }
    }

    if (ts.isStringLiteral(node)) {
      addClasses(node.text, relativePath);
    } else if (ts.isTemplateExpression(node)) {
      if (node.head) addClasses(node.head.text, relativePath);
      for (const span of node.templateSpans) {
        if (span.literal) addClasses(span.literal.text, relativePath);
      }
    } else {
      ts.forEachChild(node, extractStringsFromExpression);
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText();
      const primitivePath = importedPrimitives.get(tagName);
      if (primitivePath) {
        const hasClassName = node.attributes.properties.some(
          (p) => ts.isJsxAttribute(p) && p.name.getText() === "className",
        );
        if (hasClassName) {
          const consumers =
            primitivesUsedWithClassName.get(primitivePath) || new Set();
          consumers.add(relativePath);
          primitivesUsedWithClassName.set(primitivePath, consumers);
        }
      }
    }
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText() === "className" &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer)) {
        addClasses(node.initializer.text, relativePath);
      } else if (
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression
      ) {
        extractStringsFromExpression(node.initializer.expression);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
};

const getBrotliSize = async (fileBuffer: Buffer): Promise<number> => {
  const compressed = await brotliCompressAsync(fileBuffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    },
  });
  return compressed.length;
};

const getGZipSize = async (fileBuffer: Buffer): Promise<number> => {
  const compressed = await gzip(fileBuffer);
  return compressed.length;
};

const compileCSS = async (input: string, output: string): Promise<Buffer> => {
  await execAsync(`pnpm tailwindcss -i ${input} -o ${output} --minify`);
  return fs.readFile(output);
};

const main = async (): Promise<void> => {
  console.log("🔍 Starting analysis...");
  const start = performance.now();

  try {
    console.log("🔍 Loading existing class data for comparison...");
    const existingClasses = await loadExistingClasses();

    const files = await getAllFiles(SRC_DIR);

    console.log(
      "🔍 Loading ignored custom classes from about-editorial.css...",
    );
    await loadIgnoredCustomCssClasses();

    console.log("🔍 Pass 1: Scanning primitives...");
    await pool(files, 15, identifyPrimitives);

    console.log("🔍 Pass 2: Processing usage tree...");
    await pool(files, 15, processFile);

    console.log("⚡ Triggering isolated production CSS compilation...");
    const baselineBuffer = await compileCSS(CSS_ENTRY, CSS_BASELINE_OUT);
    const baselineBrotliSize = await getBrotliSize(baselineBuffer);
    const baselineString = baselineBuffer.toString("utf-8");

    const sorted = Array.from(usageMap.entries())
      .map(([cls, usage]) => ({
        className: cls,
        count: usage.count,
        components: Array.from(usage.components),
      }))
      .sort((a, b) => a.className.localeCompare(b.className));

    const newlyAddedClasses =
      existingClasses.size > 0
        ? sorted
            .map((item) => item.className)
            .filter((cls) => !existingClasses.has(cls))
        : [];

    console.log("🧪 Processing total dataset footprint calculations...");

    const finalReportData: Array<{
      className: string;
      frequency: number;
      length: number;
      uncompressedBytes: number;
      brotliBytesUpperLimit: number;
      isNew?: boolean;
    }> = [];

    for (const item of sorted) {
      const clsName = item.className;

      // Strictly escape ALL non-alphanumeric characters to prevent RegExp engine syntax crashes
      const escapedSelector = clsName.replace(/([^a-zA-Z0-9_-])/g, "\\$1");

      // Handles exact class match blocks, ensuring structural variants don't throw syntax breaks
      const regex = new RegExp(`\\.${escapedSelector}\\s*\\{[^\\}]*\\}`, "g");
      const matches = baselineString.match(regex);

      let uncompressedBytes = 0;
      let brotliBytesUpperLimit = 0;

      if (matches && matches.length > 0) {
        const combinedRules = matches.join("\n");
        uncompressedBytes = Buffer.byteLength(combinedRules, "utf-8");
        brotliBytesUpperLimit = await getBrotliSize(
          Buffer.from(combinedRules, "utf-8"),
        );
      }

      finalReportData.push({
        className: clsName,
        frequency: item.count,
        length: clsName.length,
        uncompressedBytes,
        brotliBytesUpperLimit,
        isNew: existingClasses.size > 0 ? !existingClasses.has(clsName) : false,
      });
    }

    // --- Next.js Build Artifact Analysis Additions ---
    const nextCssDir = path.join(process.cwd(), ".next", "static", "css");
    const nextCssFilesData: Array<{
      file: string;
      rawBytes: number;
      brotliBytes: number;
      gZipBytes: number;
    }> = [];

    try {
      const nextFiles = await fs.readdir(nextCssDir);
      const cssChunks = nextFiles.filter((f) => f.endsWith(".css"));

      for (const file of cssChunks) {
        const fullPath = path.join(nextCssDir, file);
        const buf = await fs.readFile(fullPath);
        nextCssFilesData.push({
          file,
          rawBytes: buf.length,
          brotliBytes: await getBrotliSize(buf),
          gZipBytes: await getGZipSize(buf),
        });
      }

      nextCssFilesData.sort((a, b) => b.rawBytes - a.rawBytes);
    } catch {
      console.warn(
        "⚠️ Warning: Could not locate '.next/static/css'. Run 'next build' first.",
      );
    }
    // ------------------------------------------------

    // Write structured JSON
    const primitiveUsageOutput: Record<string, string[]> = {};
    for (const [prim, consumers] of primitivesUsedWithClassName.entries()) {
      primitiveUsageOutput[prim] = Array.from(consumers).sort();
    }

    const jsonOutput = {
      totalClasses: sorted.length,
      timestamp: new Date().toISOString(),
      baselineCSSBytes: baselineBuffer.length,
      baselineBrotliBytes: baselineBrotliSize,
      newlyAddedClasses,
      nextGeneratedCss: nextCssFilesData, // Injected Next.js output array
      primitiveUsage: primitiveUsageOutput,
      data: finalReportData,
    };
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(jsonOutput, null, 2));

    // Write comprehensive CSV with all data rows
    const csvRows = [
      "classname,frequency,cls_length,uncompressed_css_bytes,brotli_css_bytes_saving_limit",
    ];
    for (const row of finalReportData) {
      // Escape strings containing quotes or commas for safe CSV formats
      const safeCls = /^-/.test(row.className)
        ? `.${row.className}`
        : /[,"]/.test(row.className)
          ? `"${row.className.replace(/"/g, '""')}"`
          : row.className;

      csvRows.push(
        `${safeCls},${row.frequency},${row.length},${row.uncompressedBytes},${row.brotliBytesUpperLimit}`,
      );
    }
    await fs.writeFile(OUTPUT_CSV, csvRows.join("\n"));

    console.log(
      `\n✅ Done. Generated report mapping all ${sorted.length} classes.`,
    );
    if (newlyAddedClasses.length > 0) {
      console.log(`\n✨ Newly added classes (${newlyAddedClasses.length}):`);
      for (const cls of newlyAddedClasses) {
        console.log(`  + ${cls}`);
      }
    } else if (existingClasses.size > 0) {
      console.log(
        "\n✨ Newly added classes: None (all matched existing dataset)",
      );
    }
    console.log(`\n📂 JSON data stored at: ${OUTPUT_FILE}`);
    console.log(`📂 CSV records written to: ${OUTPUT_CSV}`);
    console.log(
      `\n⏱️ Total Execution Pipeline Time: ${((performance.now() - start) / 1000).toFixed(2)}s`,
    );
  } catch (err) {
    console.error("Critical execution breakdown:", err);
  }
};

main();
