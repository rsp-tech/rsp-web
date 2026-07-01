import fs from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
});

const UI_DIR = path.join(process.cwd(), "src", "components", "ui"); // Adjust path to match your setup

const purgeUnusedUiComponents = (): void => {
  const _sourceFiles = project.getSourceFiles();
  const uiFiles = fs
    .readdirSync(UI_DIR)
    .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
    .map((file) => path.join(UI_DIR, file));

  console.log(`🔍 Scanning ${uiFiles.length} UI components...`);

  const unusedFiles = uiFiles.filter((uiFilePath) => {
    const uiSourceFile = project.getSourceFile(uiFilePath);
    if (!uiSourceFile) return false;

    // Find all referencing source files across the project
    const referencingFiles = uiSourceFile.getReferencingSourceFiles();

    // If 0 files reference it, it's completely dead code
    return referencingFiles.length === 0;
  });

  if (unusedFiles.length === 0) {
    console.log("✨ No dead UI components found. Your bundle is lean!");
    return;
  }

  console.log(`\n❌ Found ${unusedFiles.length} unused UI components:`);
  unusedFiles.forEach((file) => {
    console.log(`  - ${path.relative(process.cwd(), file)}`);
    // Uncomment the line below to automatically delete the files
    // fs.unlinkSync(file);
  });
};

purgeUnusedUiComponents();
