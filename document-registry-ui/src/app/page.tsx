"use client";

import { useState, useEffect } from "react";
import DocumentList from "../components/DocumentList";
import CreateDocumentModal from "../components/CreateDocumentModal";
import Navigation from "../components/Navigation";
import { useWeb3 } from "../contexts/Web3Context";
import {
  DocumentsTabType,
  getDocumentsTab,
  setDocumentsTab,
} from "../utils/storage";

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { account, connectWallet, disconnectWallet, isConnecting, error } =
    useWeb3();
  const [activeTab, setActiveTab] = useState<DocumentsTabType>(() =>
    getDocumentsTab()
  );

  // Update local storage when tab changes
  const handleTabChange = (tab: DocumentsTabType) => {
    setActiveTab(tab);
    setDocumentsTab(tab);
  };

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
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your documents
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange("my-documents")}
              className={`${
                activeTab === "my-documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Documents
            </button>
            <button
              onClick={() => handleTabChange("all-documents")}
              className={`${
                activeTab === "all-documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Documents
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "my-documents" ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                My Documents
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                View and manage documents you've created
              </p>
            </div>
            <DocumentList showMyDocuments />
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                All Documents
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                View all documents in the registry
              </p>
            </div>
            <DocumentList showAllDocuments />
          </div>
        )}
      </div>

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  );
}
