"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DIDProvider } from "../contexts/DIDContext";
import { DIDRegistryService } from "../services/DIDRegistryService";
import { TopNav } from "../components/TopNav";
import { ethers } from "ethers";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "DID Registry",
//   description: "A decentralized identity registry",
// };

function DIDProviderWrapper({ children }: { children: React.ReactNode }) {
  const [service, setService] = useState<DIDRegistryService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeService() {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask to use this application");
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Check if already connected
        const accounts = await provider.listAccounts();
        const signer = accounts.length > 0 ? provider.getSigner() : provider;

        const contractAddress = process.env.NEXT_PUBLIC_DID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error("DID Registry contract address not configured");
        }

        const newService = new DIDRegistryService({
          contractAddress,
          provider,
          signer,
        });

        // Set up event listeners for account changes
        window.ethereum.on("accountsChanged", async (accounts: string[]) => {
          if (accounts.length > 0) {
            const newSigner = provider.getSigner();
            await newService.connect(newSigner);
          } else {
            await newService.disconnect();
          }
        });

        // Set up event listener for chain changes
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });

        setService(newService);
      } catch (err: any) {
        console.error("Error initializing service:", err);
        setError(err.message);
      }
    }

    initializeService();

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading</h2>
          <p className="text-gray-500">Initializing DID Registry...</p>
        </div>
      </div>
    );
  }

  return <DIDProvider service={service}>{children}</DIDProvider>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DIDProviderWrapper>
          <div className="min-h-screen bg-gray-50">
            <TopNav />
            {children}
          </div>
        </DIDProviderWrapper>
      </body>
    </html>
  );
}
