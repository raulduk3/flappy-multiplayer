export const metadata = {
  title: "Flappy Multiplayer (Minimal)",
  description: "Barebones client to visualize the multiplayer loop",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0d10", color: "#e5e7eb", fontFamily: "ui-sans-serif, system-ui" }}>
        {children}
      </body>
    </html>
  );
}
