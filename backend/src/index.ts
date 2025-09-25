import { createServer } from "./server.ts";

const port = process.env.PORT ? Number(process.env.PORT) : 19001;
const { wss } = createServer(port);
console.log(`[backend] WebSocket server listening on ws://localhost:${port}/ws`);

process.on("SIGINT", () => {
  console.log("\n[backend] shutting down...");
  wss.close();
  process.exit(0);
});
