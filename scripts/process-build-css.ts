import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

// Helper to generate short names: --a, --b, ... --z, --a0, --a1 ...
const generateShortName = (index: number): string => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let name = "--";
  let i = index;
  do {
    name += chars[i % chars.length];
    i = Math.floor(i / chars.length);
  } while (i > 0);
  return name;
};

// Recursive file walker
// const getFiles = async (dir: string): Promise<string[]> => {
//   if (!existsSync(dir)) return [];
//   if (dir.includes(".next/cache") || dir.includes(".next\\cache")) return []; // Skip cache

//   const entries = await fs.readdir(dir, { withFileTypes: true });
//   const files = await Promise.all(
//     entries.map((entry) => {
//       const res = path.resolve(dir, entry.name);
//       return entry.isDirectory() ? getFiles(res) : res;
//     })
//   );
//   return Array.prototype.concat(...files);
// };

// Escape regex helper
// const escapeRegExp = (string: string) => {
//   return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// };

export const processBuildCSS = async () => {
  const chunksDir = path.join(process.cwd(), ".next", "static", "chunks");
  if (!existsSync(chunksDir)) return;

  const files = await fs.readdir(chunksDir, { recursive: true });
  const cssFiles = await Promise.all(
    (files as string[])
      .filter((f) => f.endsWith(".css"))
      .map(async (f) => {
        const fullPath = path.join(chunksDir, f);
        return [fullPath, (await fs.stat(fullPath)).size] as const;
      }),
  );

  if (cssFiles.length === 0) return;

  // Process the largest file
  cssFiles.sort((a, b) => b[1] - a[1]);
  const targetFile = cssFiles[0][0];
  const cssContent = await fs.readFile(targetFile, "utf-8");

  // 1. Analyze Variables & Frequency
  const varsMap = new Map<string, number>();
  // Match variable declarations and usages
  // Note: We need to be careful. A simple regex might catch false positives, but for CSS vars structure it's usually safe.
  // We match usages `var(--foo)` and declarations `--foo:`
  // Actually, simplest is to just find all strings starting with `--` that look like variables.
  const allVars = cssContent.match(/--[\w-]+/g) || [];

  for (const v of allVars) {
    varsMap.set(v, (varsMap.get(v) || 0) + 1);
  }

  const unusedVars: string[] = [];
  const usedVars: [string, number][] = [];
  for (const [v, count] of varsMap.entries()) {
    if (v.startsWith("--m-")) continue;
    if (count === 1) unusedVars.push(v);
    else usedVars.push([v, count]);
  }

  // 2. Sort by frequency (descending) to give shortest names to most used vars
  const sortedVars = usedVars.sort((a, b) => b[1] - a[1]);

  console.log(
    `Found ${varsMap.size} unique variables. ${unusedVars.length} unused.`,
  );

  // 3. Generate Replacements
  const replacementMap = new Map<string, string>();
  // We need to avoid colliding with any existing variables if we don't replace ALL of them.
  // But here we plan to replace ALL of them found.
  // The only risk is if we generate a name that is NOT a variable but syntactically valid and present?
  // CSS vars always start with --. Our generator produces --a, --b etc.
  // These are valid.

  sortedVars.forEach(([originalVar], index) => {
    replacementMap.set(originalVar, generateShortName(index));
  });

  unusedVars.forEach((v) => {
    replacementMap.set(v, "");
  });

  // 4. Replace Variables in Content
  // We must replace longest names first? Or just exact matches?
  // Since some names might be substrings of others (e.g. --font-bold and --font-bold-2),
  // we should be careful.
  // Regex replacement with boundary is safer.
  // Custom replacer function matching the variable pattern is best.

  const optimizedContent = cssContent.replace(/--[\w-]+/g, (match) => {
    return replacementMap.get(match) || match;
  });

  // Calculate savings from variables
  const midSize = Buffer.byteLength(optimizedContent, "utf8");
  const oldSize = cssFiles[0][1];
  console.log(
    `📉 Vars Size reduced from ${(oldSize / 1024).toFixed(2)}KB to ${(midSize / 1024).toFixed(2)}KB`,
  );

  await Promise.all(
    cssFiles.slice(1).map(async ([file]) => {
      const content = await fs.readFile(file, "utf-8");
      const optimizedContent = content.replace(/--[\w-]+/g, (match) => {
        return replacementMap.get(match) || match;
      });
      await fs.writeFile(file, optimizedContent);
    }),
  );

  // 5. Analyze Classes from the Variable-Optimized CSS
  // We do this AFTER variable replacement so we have the final content structure?
  // Actually, class names (.flex) are distinct from variables (--flex).
  // But let's follow the flow.
  const classesMap = new Map<string, number>();
  const classes = optimizedContent.matchAll(/\.[\w_-]+/g);
  for (const cls of classes)
    classesMap.set(cls[0], (classesMap.get(cls[0]) || 0) + 1);

  const sortedClasses = Array.from(classesMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  console.log(`📦 Identified ${sortedClasses.length} unique classes.`);

  // const classReplacementMap = new Map<string, string>();
  // sortedClasses.forEach(([originalClass], index) => {
  //   classReplacementMap.set(originalClass, `.${generateShortName(index).slice(2)}`);
  // });

  // 6. Apply Class Replacements to Main CSS Content
  // We need to apply classes to `optimizedContent` before writing it.

  // console.log("⚡ Applying class mangling to Main CSS...");
  // optimizedContent = optimizedContent.replace(/\.[\w_-]+/g, (match) => {
  //   return classReplacementMap.get(match) || match;
  // });

  // const finalSize = Buffer.byteLength(optimizedContent, "utf8");

  // console.log(
  //   `📉 Classes Size reduced from ${(oldSize / 1024).toFixed(2)}KB to ${(finalSize / 1024).toFixed(2)}KB`,
  // );

  // Write changes to Main CSS (Variables + Classes)
  await fs.writeFile(targetFile, optimizedContent);
  console.log(
    `✅ Optimized Main CSS file: ${path.relative(process.cwd(), targetFile)}`,
  );

  const output = {
    totalClasses: classesMap.size,
    totalVariables: varsMap.size,
    timestamp: new Date().toISOString(),
    data: {
      classes: sortedClasses.reduce(
        (acc: Record<string, number>, [cls, count]) => {
          acc[cls] = count;
          return acc;
        },
        {},
      ),
      usedVars: sortedVars.reduce(
        (acc: Record<string, number>, [cls, count]) => {
          acc[cls] = count;
          return acc;
        },
        {},
      ),
      unusedVars,
    },
  };

  await fs.writeFile(
    path.join(process.cwd(), "build-css.json"),
    JSON.stringify(output, null, 2),
  );

  // 6. Apply Replacements to Recursive Build Artifacts (JS, HTML, RSC)
  // Exclude CSS files as default, since we handled the main one.
  // If there are other CSS files, we might skip them or handle them?
  // User said "we are updating only one css file", so we skip .css in loop.

  // console.log("⚡ Replacing classes in other build artifacts (JS, HTML, RSC)...");

  // const targetFiles = await getFiles(path.join(process.cwd(), ".next"));
  // // Include .rsc, .htm, .html, .js, .json (maybe? RSC payload can be json-like text but usually .rsc)
  // const processableFiles = targetFiles.filter((f: string) =>
  //   /\.(js|html|htm|rsc)$/.test(f)
  // );

  // console.log(`📦 Found ${processableFiles.length} processable files.`);

  // let totalClassSavings = 0;

  // // Pre-compute regexes for performance
  // const replacers = Array.from(classReplacementMap.entries()).map(([originalClass, shortName]) => {
  //   // Classes in JS/HTML/RSC are space-separated strings without dot.
  //   const cleanOriginal = originalClass.startsWith('.') ? originalClass.slice(1) : originalClass;
  //   const finalShort = shortName.replace(/^--/, '');

  //   const escOriginal = escapeRegExp(cleanOriginal);
  //   // Lookbehind/Lookahead for delimiters: space, quote, backtick, colon (for json keys?), escaping backslash
  //   // We stick to standard delimiters.
  //   const regex = new RegExp(`(?<=[\\s"'\\\`])${escOriginal}(?=[\\s"'\\\`])`, "g");

  //   return { regex, short: finalShort };
  // });

  // for (const file of processableFiles) {
  //   const originalContent = await fs.readFile(file, "utf-8");
  //   let content = originalContent;

  //   // Replace classes based on pre-computed regexes
  //   for (const { regex, short } of replacers) {
  //     content = content.replace(regex, short);
  //   }

  //   if (content !== originalContent) {
  //     // Apply variable replacements as well
  //     content = content.replace(/--[\w-]+/g, (match) => {
  //       return replacementMap.get(match) || match;
  //     });

  //     await fs.writeFile(file, content);
  //     totalClassSavings += Buffer.byteLength(originalContent) - Buffer.byteLength(content);
  //   }
  // }

  // console.log(`📉 Total Mangling Reductions: ${(totalClassSavings / 1024).toFixed(2)}KB`);
};

processBuildCSS();
