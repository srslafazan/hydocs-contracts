import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../contexts/Web3Context";
import { DocumentRegistryProvider } from "../contexts/DocumentRegistryContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Document Registry",
  description: "Decentralized Document Registry",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <DocumentRegistryProvider>{children}</DocumentRegistryProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
