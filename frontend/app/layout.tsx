import type { ReactNode } from "react";

export const metadata = {
  title: "Flappy Multiplayer",
  description: "Real-time Flappy multiplayer client",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
