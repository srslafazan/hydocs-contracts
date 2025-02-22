"use client";

import Navigation from "../../components/Navigation";
import DocumentList from "../../components/DocumentList";
import { useWeb3 } from "../../contexts/Web3Context";

export default function SignerInbox() {
  const { account } = useWeb3();

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
            Documents that require your signature
          </p>
        </div>
        <DocumentList showSignerInbox />
      </div>
    </main>
  );
}
