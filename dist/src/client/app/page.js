"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import dynamic from "next/dynamic";
const Game = dynamic(() => import("../components/GameCanvas"), { ssr: false });
export default function Page() {
    return (_jsx("main", { style: { display: "grid", placeItems: "center", minHeight: "100vh" }, children: _jsxs("div", { children: [_jsx("h1", { style: { fontSize: 20, marginBottom: 8 }, children: "Flappy Multiplayer (Minimal)" }), _jsx("p", { style: { margin: 0, opacity: 0.8 }, children: "Press Space / Tap to flap" }), _jsx("div", { style: { marginTop: 12 }, children: _jsx(Game, { width: 800, height: 600 }) })] }) }));
}
