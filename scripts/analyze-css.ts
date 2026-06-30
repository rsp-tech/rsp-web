import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

// import { processBuildCSS } from "./process-build-css";

const SRC_DIR = path.join(process.cwd(), "src");
const OUTPUT_FILE = path.join(process.cwd(), "classname-usage.json");
const OUTPUT_CSV = path.join(process.cwd(), "classname-usage.csv");
const OUTPUT_FULL_FILE = path.join(process.cwd(), "classname-usage-full.json");

interface ClassUsage {
  count: number;
  components: Set<string>;
}

const usageMap = new Map<string, ClassUsage>();
const filesUsingCn = new Set<string>();
const primitiveExports = new Map<string, Set<string>>(); // filePath -> Set<ExportedName>
const primitivesUsedWithClassName = new Map<string, Set<string>>(); // primitiveFilePath -> Set<ConsumerFilePath>

const getAllFiles = async (dir: string): Promise<string[]> => {
  let fileList: string[] = [];
  const files = await fs.readdir(dir);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        const subFiles = await getAllFiles(filePath);
        fileList = fileList.concat(subFiles);
      } else if (file.endsWith(".tsx")) {
        fileList.push(filePath);
      }
    }),
  );

  return fileList;
};

// Pass 1: Identify primitives and their exports
const identifyPrimitives = async (filePath: string) => {
  const fileContent = await fs.readFile(filePath, "utf-8");

  if (fileContent.includes("import { cn } from ")) {
    const relativePath = path.relative(process.cwd(), filePath);
    filesUsingCn.add(relativePath);

    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true,
    );

    const exports = new Set<string>();

    // Find exports
    const visit = (node: ts.Node) => {
      if (ts.isExportAssignment(node)) {
        // Default export
        if (ts.isIdentifier(node.expression)) {
          exports.add(node.expression.text);
        }
      } else if (ts.isExportDeclaration(node)) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          node.exportClause.elements.forEach((element) => {
            exports.add(element.name.text);
          });
        }
      } else if (
        ts.isFunctionDeclaration(node) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        if (node.name) exports.add(node.name.text);
      } else if (
        ts.isVariableStatement(node) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        node.declarationList.declarations.forEach((d) => {
          if (ts.isIdentifier(d.name)) {
            exports.add(d.name.text);
          }
        });
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    primitiveExports.set(relativePath, exports);
  }
};

// Pass 2: Analyze Usage
const processFile = async (filePath: string) => {
  const fileContent = await fs.readFile(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  const relativePath = path.relative(process.cwd(), filePath);

  // 2a. Identify Imported Primitives
  const importedPrimitives = new Map<string, string>(); // LocalName -> PrimitiveRelativePath

  const visitImports = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      let resolvedPath = "";

      if (moduleSpecifier.startsWith("@/")) {
        resolvedPath = path.join("src", moduleSpecifier.replace("@/", ""));
      } else if (moduleSpecifier.startsWith(".")) {
        resolvedPath = path.relative(
          process.cwd(),
          path.resolve(path.dirname(filePath), moduleSpecifier),
        );
      }

      // Try extensions
      const extensions = [".tsx", ".ts"];
      let matchedPath = "";

      // Check if resolvedPath is in filesUsingCn (ignoring extension mismatch for a sec)
      // We stored filesUsingCn with correct extension.
      // So we need to match "src/components/ui/button" -> "src/components/ui/button.tsx"

      for (const ext of extensions) {
        const p = resolvedPath + ext;
        if (filesUsingCn.has(p)) {
          matchedPath = p;
          break;
        }
        // Also check index?
        const pIndex = path.join(resolvedPath, `index${ext}`);
        if (filesUsingCn.has(pIndex)) {
          matchedPath = pIndex;
          break;
        }
      }

      if (matchedPath && node.importClause) {
        const namedBindings = node.importClause.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          namedBindings.elements.forEach((element) => {
            const importName = element.propertyName?.text || element.name.text;
            const localName = element.name.text;

            // Check if this importName is actually exported by the primitive
            const exports = primitiveExports.get(matchedPath);
            if (exports?.has(importName)) {
              importedPrimitives.set(localName, matchedPath);
            }
          });
        }
      }
    }
    ts.forEachChild(node, visitImports);
  };
  visitImports(sourceFile);

  // 2b. Scan for ClassName Usage and Class Extraction (Original Logic)
  const visit = (node: ts.Node) => {
    // Check for Primitive Usage with className
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

    if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
      if (node.initializer) {
        extractStrings(node.initializer);
      }
    }
    ts.forEachChild(node, visit);
  };

  const extractStrings = (node: ts.Node) => {
    if (ts.isStringLiteral(node)) {
      addClasses(node.text, relativePath);
    } else if (ts.isJsxExpression(node) && node.expression) {
      extractStringsFromExpression(node.expression);
    }
  };

  const extractStringsFromExpression = (node: ts.Node) => {
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

  const addClasses = (text: string, source: string) => {
    const classes = text.split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      const entry = usageMap.get(cls) || { count: 0, components: new Set() };
      entry.count++;
      entry.components.add(source);
      usageMap.set(cls, entry);
    }
  };

  visit(sourceFile);
};

const main = async () => {
  console.log("🔍 Starting analysis...");
  const start = performance.now();

  try {
    // await processBuildCSS(); // skipping for speed in this iter if not needed, but keeping for consistency
    // Actually user asked to update script, assume full run

    console.log("🔍 Pass 1: scanning for cn usage...");
    const files = await getAllFiles(SRC_DIR);

    // Pass 1
    await Promise.all(files.map((file) => identifyPrimitives(file)));
    console.log(`Found ${filesUsingCn.size} UI primitives using cn.`);

    console.log("🔍 Pass 2: analyzing class usage and primitive consumers...");
    // Pass 2
    await Promise.all(
      files.map(async (file) => {
        try {
          await processFile(file);
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }),
    );

    const sorted = Array.from(usageMap.entries())
      .map(([cls, usage]) => ({
        className: cls,
        count: usage.count,
        components: Array.from(usage.components),
      }))
      .sort((a, b) => b.className.localeCompare(a.className));

    // Convert primitivesUsedWithClassName to array for JSON
    const primitiveUsageOutput: Record<string, string[]> = {};
    for (const [prim, consumers] of primitivesUsedWithClassName.entries()) {
      primitiveUsageOutput[prim] = Array.from(consumers).sort();
    }

    const oldClasses = new Set<string>();
    try {
      const oldContent = await fs.readFile(OUTPUT_FILE, "utf-8");
      const oldData = JSON.parse(oldContent);
      if (oldData?.data) {
        Object.keys(oldData.data).forEach((cls) => {
          oldClasses.add(cls);
        });
      }
    } catch {
      // Ignore if file doesn't exist
    }

    const newClasses = sorted
      .filter((item) => !oldClasses.has(item.className))
      .map((item) => item.className);

    const output = {
      totalClasses: sorted.length,
      timestamp: new Date().toISOString(),
      filesUsingCn: Array.from(filesUsingCn).sort(),
      primitiveUsage: primitiveUsageOutput,
      newClasses,
      data: sorted.reduce(
        // biome-ignore lint/performance/noAccumulatingSpread: ok
        (acc, item) => ({ ...acc, [item.className]: item.count }),
        {},
      ),
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

    const rows = [",,,", ",classname,frequency,cls-length"];
    Object.entries(output.data).forEach(([cls, count]) => {
      rows.push(`,${cls.replace(/^-/, ".-")},${count},${cls.length}`);
    });
    await fs.writeFile(OUTPUT_CSV, rows.join("\n"));

    // Also save full version
    await fs.writeFile(
      OUTPUT_FULL_FILE,
      JSON.stringify(
        {
          ...output,
          newClasses,
          data: sorted,
        },
        null,
        2,
      ),
    );

    console.log(`✅ Analysis complete. found ${sorted.length} unique classes.`);
    console.log(`📂 Output saved to ${OUTPUT_FILE}`);

    // console.log("\n🏆 Top 10 Most Used Classes:");
    // sorted.slice(0, 10).forEach((item) => {
    //   console.log(`  ${item.className}: ${item.count}`);
    // });

    console.log("\n🔍 Primitives with className overrides:");
    Object.entries(primitiveUsageOutput).forEach(([prim, consumers]) => {
      console.log(`  ${prim}: Used in ${consumers.length} files`);
    });

    const end = performance.now();
    console.log(`\n⏱️  Time taken: ${(end - start).toFixed(2)}ms`);
  } catch (err) {
    console.error("An error occurred:", err);
    process.exit(1);
  }
};

main();
