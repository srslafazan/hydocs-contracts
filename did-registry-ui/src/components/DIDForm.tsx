"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useDID } from "../contexts/DIDContext";
import { DIDViewer } from "./DIDViewer";

interface DIDFormProps {
  mode: "create" | "update";
  didId?: string;
  onSuccess?: (didId: string) => void;
}

export function DIDForm({ mode, didId, onSuccess }: DIDFormProps) {
  const { actions, didState } = useDID();
  const [identifiers, setIdentifiers] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingDID, setHasExistingDID] = useState(false);

  useEffect(() => {
    // Only load user's DID in create mode
    if (mode === "create") {
      actions.loadUserDID();
    }
  }, [mode, actions]);

  useEffect(() => {
    setHasExistingDID(!!didState.did);
  }, [didState.did]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const validIdentifiers = identifiers.filter((id) => id.trim() !== "");
      if (validIdentifiers.length === 0) {
        throw new Error("Please add at least one identifier");
      }

      if (mode === "create" && hasExistingDID) {
        throw new Error(
          "This address already has a DID. Please use a different address or update the existing DID."
        );
      }

      const hashedIdentifiers = validIdentifiers.map((id) =>
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(id))
      );

      if (mode === "create") {
        const newDidId = await actions.createDID(hashedIdentifiers);
        onSuccess?.(newDidId);
      } else if (didId) {
        await actions.updateDID(didId, hashedIdentifiers);
        // After updating, reload the user's DID to refresh the display
        await actions.loadUserDID();
        onSuccess?.(didId);
      }
    } catch (err: any) {
      console.error("Form error:", err);
      if (err.message.includes("Address already has a DID")) {
        setError(
          "This address already has a DID. Please use a different address or update the existing DID."
        );
      } else if (err.message.includes("user rejected")) {
        setError("Transaction was rejected. Please try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (didState.loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (mode === "create" && hasExistingDID && didState.did) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            You Already Have a DID
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            This Ethereum address already has a DID registered. You can:
          </p>
          <ul className="list-disc pl-5 text-sm text-yellow-700 mb-4">
            <li>Switch to a different address in MetaMask</li>
            <li>Update your existing DID using the form below</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-yellow-800 hover:text-yellow-900 underline"
          >
            Refresh page after switching address
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Your Current DID
          </h3>
          <DIDViewer
            did={didState.did}
            verifications={didState.verifications}
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {identifiers.map((id, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={id}
              onChange={(e) => {
                const newIdentifiers = [...identifiers];
                newIdentifiers[index] = e.target.value;
                setIdentifiers(newIdentifiers);
              }}
              placeholder={`Email, phone, or other identifier`}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
            {identifiers.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setIdentifiers(identifiers.filter((_, i) => i !== index))
                }
                className="px-2.5 py-1.5 text-sm border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIdentifiers([...identifiers, ""])}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add another identifier
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Processing..."
            : mode === "create"
            ? "Create Identity"
            : "Update Identity"}
        </button>
      </div>
    </form>
  );
}
