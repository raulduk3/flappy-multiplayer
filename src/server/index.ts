import { startServer } from "./server.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

startServer({ port: PORT }).then(({ port }) => {
  console.log(`WebSocket server listening on port ${port}`);
});
