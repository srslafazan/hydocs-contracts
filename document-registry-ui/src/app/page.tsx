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
