import { Inter, Space_Grotesk } from "next/font/google";

export const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});
