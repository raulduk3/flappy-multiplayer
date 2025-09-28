# Quickstart — Barebones communication system

This quickstart validates the minimal client↔server communication round-trip using the shared protocol envelope and schemas.

## Prerequisites
- Node.js ≥ 20
- npm available on PATH

## Install
```bash
npm install
```

## Run the server
```bash
npm run dev
```
This starts a WebSocket server on port 3000 by default. To change the port:
```bash
PORT=4000 npm run dev
```

## Run the fake client
In another terminal:
```bash
node --loader ts-node/esm src/client/fake-client.ts
```
Optionally target a custom URL:
```bash
URL=ws://localhost:4000 node --loader ts-node/esm src/client/fake-client.ts
```

You should see an acknowledgement like:
```
ack: {"status":"ok","nonce":"<nonce>","message_id":"<uuid>"}
```

## Run tests
Contract tests (JSON Schemas) and integration tests:
```bash
npm test
```
Use watch mode during development:
```bash
npm run test:watch
```

## Notes
- Non-production can use ws://; production must use wss:// with TLS.
- Client waits up to 3 seconds for the acknowledgement in this step.