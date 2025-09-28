import { jsx as _jsx } from "react/jsx-runtime";
export const metadata = {
    title: "Flappy Multiplayer (Minimal)",
    description: "Barebones client to visualize the multiplayer loop",
};
export default function RootLayout({ children }) {
    return (_jsx("html", { lang: "en", children: _jsx("body", { style: { margin: 0, background: "#0b0d10", color: "#e5e7eb", fontFamily: "ui-sans-serif, system-ui" }, children: children }) }));
}
