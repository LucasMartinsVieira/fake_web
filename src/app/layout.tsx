import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/state/app-context";

export const metadata: Metadata = {
  title: "Fake Web",
  description: "High-fidelity social media mockup generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
