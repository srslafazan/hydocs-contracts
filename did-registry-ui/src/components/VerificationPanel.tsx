"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useDID } from "../contexts/DIDContext";
import { VerificationLevel } from "../types/DIDRegistry";

interface VerificationPanelProps {
  didId: string;
}

export function VerificationPanel({ didId }: VerificationPanelProps) {
  const { actions, verifierState } = useDID();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVerification, setCurrentVerification] = useState<any>(null);
  const [level, setLevel] = useState<VerificationLevel>(
    VerificationLevel.BASIC
  );
  const [metadata, setMetadata] = useState("");

  // Load current verifier's verification for this DID
  useEffect(() => {
    async function loadVerification() {
      try {
        if (!window.ethereum?.selectedAddress) return;
        const verification = await actions.service.getVerification(
          didId,
          window.ethereum.selectedAddress
        );
        if (verification.verifier !== ethers.constants.AddressZero) {
          setCurrentVerification(verification);
          setLevel(verification.level);
          try {
            const parsed = JSON.parse(verification.metadata);
            setMetadata(parsed.details || "");
          } catch (e) {
            setMetadata(verification.metadata || "");
          }
        }
      } catch (err) {
        console.error("Error loading verification:", err);
      }
    }
    loadVerification();
  }, [didId, actions.service]);

  // Format a BigNumber timestamp to a readable date string
  const formatDate = (timestamp: ethers.BigNumber) => {
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString();
  };

  const handleAddVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      // Set expiration to 1 year from now
      const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

      // Encode metadata with verification details
      const metadataObj = {
        details: metadata,
        timestamp: new Date().toISOString(),
      };

      const encodedMetadata = ethers.utils.defaultAbiCoder.encode(
        ["string"],
        [JSON.stringify(metadataObj)]
      );

      await actions.addVerification(
        didId,
        level,
        oneYearFromNow,
        encodedMetadata
      );

      // Reload verification after adding
      const newVerification = await actions.service.getVerification(
        didId,
        window.ethereum?.selectedAddress || ""
      );
      setCurrentVerification(newVerification);
    } catch (err: any) {
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
      setCurrentVerification(null);
      setMetadata("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!verifierState.isVerifier) {
    return null;
  }

  const isActive =
    currentVerification?.status ===
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"));
  const isExpired =
    currentVerification?.expiration &&
    ethers.BigNumber.from(currentVerification.expiration).lt(
      ethers.BigNumber.from(Math.floor(Date.now() / 1000))
    );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-blue-800">Verifier Actions</h3>
        <p className="text-gray-600 mt-2">
          {currentVerification && isActive
            ? "You have an active verification for this DID. You can update or revoke it."
            : "You can verify this DID's identity by adding a verification."}
        </p>
      </div>

      <div className="space-y-4">
        {currentVerification && isActive && !isExpired && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-sm text-blue-800">
              You currently have an active verification at level{" "}
              {currentVerification.level.toString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Expires: {formatDate(currentVerification.expiration)}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Level
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>Basic - Email and phone verification</option>
            <option value={2}>Enhanced - Government ID verification</option>
            <option value={3}>
              Premium - Full KYC with biometric verification
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Notes
          </label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder="Enter details about the verification process and documents checked"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-24"
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAddVerification}
            disabled={loading}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Processing..."
              : currentVerification && isActive
              ? "Update Verification"
              : "Add Verification"}
          </button>

          {currentVerification && isActive && (
            <button
              onClick={handleRevokeVerification}
              disabled={loading}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Revoke Verification"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
