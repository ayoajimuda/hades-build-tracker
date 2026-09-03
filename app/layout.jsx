import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { interceptFetch } from "next/dist/experimental/testmode/fetch";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "Hades Build Tracker",
  description: "A site to keep track of your powerful builds",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
