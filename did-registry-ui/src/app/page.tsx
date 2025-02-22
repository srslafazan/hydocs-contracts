"use client";

import { useState } from "react";
import { useDID } from "../contexts/DIDContext";
import { DIDForm } from "../components/DIDForm";

export default function Home() {
  const { selectedAccount } = useDID();

  if (!selectedAccount) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to DID Registry
          </h2>
          <p className="text-gray-500">
            Please connect your wallet to create or manage your DID
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Create DID</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a new decentralized identity
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <DIDForm mode="create" />
      </div>
    </div>
  );
}
