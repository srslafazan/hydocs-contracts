import React, { useState } from "react";
import { ethers, BigNumber } from "ethers";
import { useDID } from "../contexts/DIDContext";
import { VerificationLevel } from "../interfaces/DIDRegistry";

interface VerificationPanelProps {
  didId: string;
}

export function VerificationPanel({ didId }: VerificationPanelProps) {
  const { actions, didState, verifierState } = useDID();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<VerificationLevel>(VerificationLevel.NONE);
  const [metadata, setMetadata] = useState("");

  const handleAddVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      // Set expiration to 1 year from now
      const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      // Encode metadata
      const encodedMetadata = ethers.utils.defaultAbiCoder.encode(
        ["string"],
        [metadata]
      );

      await actions.addVerification(
        didId,
        level,
        oneYearFromNow,
        encodedMetadata
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      await actions.revokeVerification(didId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!verifierState.isVerifier) {
    return null;
  }

  return (
    <div className="p-4 space-y-4 border rounded">
      <h3 className="text-lg font-bold">Verification Management</h3>

      <div className="space-y-2">
        <label className="block">
          <span className="text-gray-700">Verification Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full p-2 mt-1 border rounded"
          >
            <option value={VerificationLevel.NONE}>None</option>
            <option value={VerificationLevel.ACCOUNT}>Account</option>
            <option value={VerificationLevel.ID}>Identity</option>
            <option value={VerificationLevel.KYC}>Complete (KYC)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-gray-700">Metadata</span>
          <input
            type="text"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder="Enter verification metadata"
            className="w-full p-2 mt-1 border rounded"
          />
        </label>
      </div>

      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleAddVerification}
          disabled={loading}
          className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-300"
        >
          {loading ? "Processing..." : "Add Verification"}
        </button>

        <button
          onClick={handleRevokeVerification}
          disabled={loading}
          className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-red-300"
        >
          {loading ? "Processing..." : "Revoke Verification"}
        </button>
      </div>
    </div>
  );
}
