// scripts/prune-supabase-types.ts

import { Project, SyntaxKind } from "ts-morph";

const TABLES_TO_OMIT = [
  "cat_meta",
  "images",
  "rec_meta",
  "roles",
  "query_replies",
  "user_edit_audit",
  "user_edit_requests",
  "user_whitelist",
  "users",
] as const;

const FIELDS_TO_OMIT: Record<string, string[]> = {
  materials: ["is_generic"],
};

const project = new Project();

const sourceFile = project.addSourceFileAtPath("src/database.types.ts");

const databaseType = sourceFile.getTypeAliasOrThrow("Database");

const databaseText = databaseType.getTypeNodeOrThrow().getText();

const tempDbFile = project.createSourceFile(
  "__database.ts",
  `type Database = ${databaseText}`,
  { overwrite: true },
);

const tempDbType = tempDbFile.getTypeAliasOrThrow("Database");
const dbNode = tempDbType.getTypeNodeOrThrow();

if (!dbNode.isKind(SyntaxKind.TypeLiteral)) {
  throw new Error("Database must be a type literal");
}

const prodSchema = dbNode.getProperty("prod");

if (!prodSchema) {
  throw new Error("public schema not found");
}

const publicType = prodSchema.getFirstDescendantByKindOrThrow(
  SyntaxKind.TypeLiteral,
);

const tablesProperty = publicType.getProperty("Tables");

if (!tablesProperty) {
  throw new Error("public.Tables not found");
}

const tablesType = tablesProperty.getFirstDescendantByKindOrThrow(
  SyntaxKind.TypeLiteral,
);

// ------------------------------------------------------------------
// Remove entire tables
// ------------------------------------------------------------------

for (const tableName of TABLES_TO_OMIT) {
  tablesType.getProperty(tableName)?.remove();
}

// ------------------------------------------------------------------
// Remove fields from Row / Insert / Update
// ------------------------------------------------------------------

for (const [tableName, fields] of Object.entries(FIELDS_TO_OMIT)) {
  const tableProperty = tablesType.getProperty(tableName);

  if (!tableProperty) {
    continue;
  }

  const tableType = tableProperty.getFirstDescendantByKindOrThrow(
    SyntaxKind.TypeLiteral,
  );

  for (const section of ["Row", "Insert", "Update"] as const) {
    const sectionProperty = tableType.getProperty(section);

    if (!sectionProperty) {
      continue;
    }

    const sectionType = sectionProperty.getFirstDescendantByKindOrThrow(
      SyntaxKind.TypeLiteral,
    );

    for (const field of fields) {
      sectionType.getProperty(field)?.remove();
    }
  }
}

databaseType.setType(dbNode.getText());

tempDbFile.delete();

await sourceFile.save();

console.log("✅ Supabase types pruned");
