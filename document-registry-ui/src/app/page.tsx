"use client";

import { useState } from "react";
import DocumentList from "../components/DocumentList";
import CreateDocumentModal from "../components/CreateDocumentModal";
import Navigation from "../components/Navigation";
import { useWeb3 } from "../contexts/Web3Context";

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { account, connectWallet, disconnectWallet, isConnecting, error } =
    useWeb3();

  const formatAddress = (address: string | null | undefined) => {
    if (!address || typeof address !== "string") return "";
    try {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    } catch (err) {
      console.error("Error formatting address:", err);
      return "";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-end items-center">
            <div className="flex items-center space-x-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              {account ? (
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600">
                    {formatAddress(account)}
                  </p>
                  <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Navigation />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <DocumentList showAllDocuments />
      </div>

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  );
}
