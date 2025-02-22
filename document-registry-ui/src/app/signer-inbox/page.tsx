"use client";

import { useState } from "react";
import Navigation from "../../components/Navigation";
import DocumentList from "../../components/DocumentList";
import { useWeb3 } from "../../contexts/Web3Context";
import { SignerTabType, getSignerTab, setSignerTab } from "../../utils/storage";

export default function SignerInbox() {
  const { account } = useWeb3();
  const [activeTab, setActiveTab] = useState<SignerTabType>(() =>
    getSignerTab()
  );

  // Update local storage when tab changes
  const handleTabChange = (tab: SignerTabType) => {
    setActiveTab(tab);
    setSignerTab(tab);
  };

  if (!account) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Signer Inbox
            </h2>
            <p className="text-gray-500">
              Please connect your wallet to view documents requiring your
              signature
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Signer Inbox</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your document signatures
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange("to-sign")}
              className={`${
                activeTab === "to-sign"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Documents to Sign
            </button>
            <button
              onClick={() => handleTabChange("signed")}
              className={`${
                activeTab === "signed"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Previously Signed
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "to-sign" ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Documents Requiring Your Signature
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Review and sign pending documents
              </p>
            </div>
            <DocumentList showSignerInbox />
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Previously Signed Documents
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                View your signature history
              </p>
            </div>
            <DocumentList showSignedDocuments />
          </div>
        )}
      </div>
    </main>
  );
}
