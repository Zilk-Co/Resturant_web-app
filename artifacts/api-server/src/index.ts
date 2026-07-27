import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initDatabase } from "./init-db.js";
import { seedDatabase } from "./seed.js";

const rawPort = process.env["PORT"] || "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  try {
    await initDatabase();
    await seedDatabase();
    console.log("Database ready");
  } catch (err) {
    console.error("Database init failed:", err);
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

main();
