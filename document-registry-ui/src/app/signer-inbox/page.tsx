"use client";

import Navigation from "../../components/Navigation";
import DocumentList from "../../components/DocumentList";
import { useWeb3 } from "../../contexts/Web3Context";

export default function SignerInbox() {
  const { account } = useWeb3();

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <DocumentList showSignerInbox />
      </div>
    </main>
  );
}
