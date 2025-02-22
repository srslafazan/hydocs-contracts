"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useDID } from "../contexts/DIDContext";
import { VerificationLevel } from "../types/DIDRegistry";

export function AdminPanel() {
  const { actions, verifierState } = useDID();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVerification, setCurrentVerification] = useState<any>(null);
  const [level, setLevel] = useState<VerificationLevel>(VerificationLevel.NONE);
  const [metadata, setMetadata] = useState("");
  const [addressToVerify, setAddressToVerify] = useState("");
  const [targetDidId, setTargetDidId] = useState<string | null>(null);

  // Load current verifier's verification for this DID
  useEffect(() => {
    async function loadVerification() {
      try {
        if (!window.ethereum?.selectedAddress || !targetDidId) return;
        const verification = await actions.service.getVerification(
          targetDidId,
          window.ethereum.selectedAddress
        );
        if (verification.verifier !== ethers.constants.AddressZero) {
          setCurrentVerification(verification);
          setLevel(verification.level);

          const tryDecodeAbiString = (encoded: string): string | null => {
            try {
              return ethers.utils.defaultAbiCoder.decode(
                ["string"],
                encoded
              )[0];
            } catch (e) {
              return null;
            }
          };

          const tryParseJson = (str: string): any | null => {
            try {
              return JSON.parse(str);
            } catch (e) {
              return null;
            }
          };

          let current = verification.metadata;
          let details = "";

          while (true) {
            const decoded = tryDecodeAbiString(current);
            if (!decoded) break;

            const parsed = tryParseJson(decoded);
            if (!parsed) {
              details = decoded;
              break;
            }

            if (parsed.details) {
              if (
                typeof parsed.details === "string" &&
                parsed.details.startsWith("0x")
              ) {
                current = parsed.details;
                continue;
              }
              details = parsed.details;
              break;
            }
            break;
          }

          setMetadata(details || "");
        }
      } catch (err) {
        console.error("Error loading verification:", err);
      }
    }
    loadVerification();
  }, [targetDidId, actions.service]);

  const formatDate = (timestamp: ethers.BigNumber) => {
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString();
  };

  const handleFindDID = async () => {
    setLoading(true);
    setError(null);
    try {
      let foundDidId: string | null = null;

      // First, check if input is a valid Ethereum address
      if (ethers.utils.isAddress(addressToVerify)) {
        foundDidId = await actions.service.getDIDByOwner(addressToVerify);
      }

      // If not found by address, try using the input directly as a DID
      if (!foundDidId && addressToVerify.startsWith("0x")) {
        try {
          // Verify the DID exists by trying to get its owner
          const owner = await actions.service.getDIDOwner(addressToVerify);
          if (owner !== ethers.constants.AddressZero) {
            foundDidId = addressToVerify;
          }
        } catch (err) {
          console.error("Error checking DID:", err);
        }
      }

      if (!foundDidId) {
        throw new Error(
          "No DID found. Please enter a valid Ethereum address or DID identifier."
        );
      }

      setTargetDidId(foundDidId);
      const verification = await actions.service.getVerification(
        foundDidId,
        window.ethereum?.selectedAddress || ""
      );
      if (verification.verifier !== ethers.constants.AddressZero) {
        setCurrentVerification(verification);
        setLevel(verification.level);
      } else {
        setCurrentVerification(null);
      }
    } catch (err: any) {
      setError(err.message);
      setTargetDidId(null);
      setCurrentVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVerification = async () => {
    if (!targetDidId) {
      setError("Please find a valid DID first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataObj = {
        details: metadata.trim(),
        timestamp: new Date().toISOString(),
      };

      const encodedMetadata = ethers.utils.defaultAbiCoder.encode(
        ["string"],
        [JSON.stringify(metadataObj)]
      );

      await actions.addVerification(
        targetDidId,
        level,
        oneYearFromNow,
        encodedMetadata
      );

      const newVerification = await actions.service.getVerification(
        targetDidId,
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
    if (!targetDidId) {
      setError("No DID selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await actions.revokeVerification(targetDidId);
      setCurrentVerification(null);
      setMetadata("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!verifierState.isVerifier) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          You do not have admin/verifier permissions to access this section.
        </p>
      </div>
    );
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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-blue-800 mb-4">
          DID Verification Management
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={addressToVerify}
              onChange={(e) => setAddressToVerify(e.target.value)}
              placeholder="Enter Ethereum address or DID identifier"
              className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleFindDID}
              disabled={loading || !addressToVerify}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Find DID"}
            </button>
          </div>

          {targetDidId && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                Found DID: <span className="font-mono">{targetDidId}</span>
              </p>
            </div>
          )}

          {currentVerification && isActive && !isExpired && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                Active verification at level{" "}
                {currentVerification.level.toString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Expires: {formatDate(currentVerification.expiration)}
              </p>
            </div>
          )}

          {targetDidId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>None - Default</option>
                  <option value={1}>
                    Account Verification - Verify account ownership
                  </option>
                  <option value={2}>
                    ID Verification - Government ID verification
                  </option>
                  <option value={3}>
                    KYC Verification - Full biometric verification
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

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddVerification}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
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
                    className="px-3 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Processing..." : "Revoke Verification"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
