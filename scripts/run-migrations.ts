import { readdir } from "node:fs/promises";
import { join } from "node:path";

const MIGRATIONS_DIR = join(import.meta.dir, "..", "migrations");

const run = async () => {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log("=== Migrations Ready to Apply ===");
  for (const file of files) {
    console.log(`- ${file}`);
  }

  console.log(
    "\nApply these SQL files using the Supabase SQL editor or psql against your project.",
  );
};

run().catch((error) => {
  console.error("Failed to inspect migrations", error);
  process.exit(1);
});
