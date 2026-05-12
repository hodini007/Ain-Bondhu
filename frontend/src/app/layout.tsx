import type { Metadata } from "next";
import { Noto_Serif_Bengali, Lexend } from "next/font/google";
import "./globals.css";

const bengaliSerif = Noto_Serif_Bengali({
  variable: "--font-bn-serif",
  subsets: ["bengali"],
});

const lexend = Lexend({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ain-Bondhu",
  description: "বাংলাদেশের শ্রমিক অধিকার সহায়ক",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${bengaliSerif.variable} ${lexend.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
