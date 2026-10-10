import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "The Sophia Way — Member Portal",
  description: "Board and staff document portal for The Sophia Way",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 p-8 max-w-5xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
