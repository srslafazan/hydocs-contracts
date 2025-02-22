import React, { useState } from "react";
import { ethers } from "ethers";
import { useDID } from "../contexts/DIDContext";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Hash the identifiers
      const hashedIdentifiers = identifiers.map((id) =>
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(id))
      );

      if (mode === "create") {
        const newDidId = await actions.createDID(hashedIdentifiers);
        onSuccess?.(newDidId);
      } else if (didId) {
        await actions.updateDID(didId, hashedIdentifiers);
        onSuccess?.(didId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addIdentifier = () => {
    setIdentifiers([...identifiers, ""]);
  };

  const removeIdentifier = (index: number) => {
    setIdentifiers(identifiers.filter((_, i) => i !== index));
  };

  const updateIdentifier = (index: number, value: string) => {
    const newIdentifiers = [...identifiers];
    newIdentifiers[index] = value;
    setIdentifiers(newIdentifiers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">
          {mode === "create" ? "Create New DID" : "Update DID"}
        </h2>

        {identifiers.map((id, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={id}
              onChange={(e) => updateIdentifier(index, e.target.value)}
              placeholder="Enter identifier (email, phone, etc.)"
              className="flex-1 p-2 border rounded"
              required
            />
            {identifiers.length > 1 && (
              <button
                type="button"
                onClick={() => removeIdentifier(index)}
                className="px-3 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addIdentifier}
          className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
        >
          Add Identifier
        </button>
      </div>

      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading
          ? "Processing..."
          : mode === "create"
          ? "Create DID"
          : "Update DID"}
      </button>
    </form>
  );
}
