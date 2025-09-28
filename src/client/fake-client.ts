import WebSocket from "ws";

const URL = process.env.URL || "ws://localhost:3000";
const nonce = Math.random().toString(36).slice(2);

const ws = new WebSocket(URL);

ws.on("open", () => {
  const envelope = {
    protocol_version: "1.0",
    type: "test.ping",
    payload: { nonce },
  };
  ws.send(JSON.stringify(envelope));
});

ws.on("message", (data) => {
  console.log("ack:", data.toString());
  ws.close();
});

ws.on("error", (err) => {
  console.error("client error", err);
});
