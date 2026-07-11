import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const displayFont = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display-google",
  weight: ["500", "600", "700", "800"],
});
const sansFont = Nunito({
  subsets: ["latin"],
  variable: "--font-sans-google",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "recommendmeafragrance",
  description: "Play a game, discover your next fragrance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${sansFont.variable} antialiased min-h-screen flex flex-col`}
      >
        <SiteHeader />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-16 pt-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
