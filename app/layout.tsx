import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "chemstem — Learn chemistry. Shape what's next.",
  description:
    "A modern home for chemistry learning and career opportunities. Build your knowledge and discover where chemistry can take you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
