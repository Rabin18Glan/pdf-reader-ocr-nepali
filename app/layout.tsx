import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nepali PDF to Word (.docx) & Editable Converter | Rust + WASM Engine",
  description: "Fast, 100% private, client-side Nepali PDF converter. Supports legacy Preeti fonts, Kantipur, Kalimati, and Unicode Devanagari into editable Microsoft Word (.docx).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ne">
      <body>{children}</body>
    </html>
  );
}
