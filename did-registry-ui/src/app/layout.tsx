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
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask to use this application");
        }

        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        setAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedAccount(accounts[0]);
        }
      } catch (err: any) {
        console.error("Error loading accounts:", err);
        setError(err.message);
      }
    }

    loadAccounts();
  }, []);

  useEffect(() => {
    async function initializeService() {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask to use this application");
        }

        const contractAddress = process.env.NEXT_PUBLIC_DID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "Contract address not found. Please make sure the contract is deployed and .env.local is set up correctly."
          );
        }

        if (!ethers.utils.isAddress(contractAddress)) {
          throw new Error(
            "Invalid contract address format. Please check your .env.local file."
          );
        }

        if (!selectedAccount) {
          return; // Wait for account selection
        }

        // Create Web3Provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner(selectedAccount);

        // Create service instance
        const newService = new DIDRegistryService({
          contractAddress,
          provider,
          signer,
        });

        setService(newService);
        setError(null);
      } catch (err: any) {
        console.error("Service initialization error:", err);
        setError(err.message);
      }
    }

    initializeService();
  }, [selectedAccount]);

  const handleAccountChange = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to use this application");
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]);
      }
    } catch (err: any) {
      console.error("Error switching account:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
        setAccounts(newAccounts);
        if (newAccounts.length > 0) {
          setSelectedAccount(newAccounts[0]);
        } else {
          setSelectedAccount(null);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full p-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-red-600 mb-2">
              Connection Error
            </h2>
            <p className="text-sm text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full p-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-slate-900 mb-4">
              Connect Wallet
            </h2>
            <button
              onClick={handleAccountChange}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect MetaMask
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-600">Initializing service...</div>
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
          <div className="min-h-screen bg-slate-100">
            <TopNav />
            {children}
          </div>
        </DIDProviderWrapper>
      </body>
    </html>
  );
}
