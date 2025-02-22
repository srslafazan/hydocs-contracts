"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useDID } from "../../contexts/DIDContext";
import Link from "next/link";
import { DIDDocument } from "../../types/DIDRegistry";

export default function DIDsPage() {
  const { service, selectedAccount } = useDID();
  const [dids, setDids] = useState<DIDDocument[]>([]);
  const [verifications, setVerifications] = useState<{
    [key: string]: { level: number; status: string };
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedDID, setCopiedDID] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDID(text);
      setTimeout(() => setCopiedDID(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  useEffect(() => {
    async function loadDIDs() {
      setIsLoading(true);
      try {
        const allDIDs = await service.getAllDIDs();
        setDids(allDIDs);

        // Get verifications for each DID
        const verificationPromises = allDIDs.map(async (did) => {
          try {
            const verifierRole = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
            );
            const verifiers = await service.getRoleMemberArray(verifierRole);

            // Get highest level verification for each DID
            let highestLevel = 0;
            let activeStatus = "None";

            for (const verifier of verifiers) {
              const verification = await service.getVerification(
                did.id,
                verifier
              );
              if (verification.verifier !== ethers.constants.AddressZero) {
                const level = Number(verification.level);
                if (level > highestLevel) {
                  highestLevel = level;
                  const isActive =
                    verification.status ===
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"));
                  activeStatus = isActive ? "Active" : "Inactive";
                }
              }
            }

            return {
              didId: did.id,
              level: highestLevel,
              status: activeStatus,
            };
          } catch (err) {
            console.error(
              `Error getting verifications for DID ${did.id}:`,
              err
            );
            return { didId: did.id, level: 0, status: "None" };
          }
        });

        const verificationResults = await Promise.all(verificationPromises);
        const verificationMap = verificationResults.reduce((acc, curr) => {
          acc[curr.didId] = { level: curr.level, status: curr.status };
          return acc;
        }, {} as { [key: string]: { level: number; status: string } });

        setVerifications(verificationMap);
      } catch (err) {
        console.error("Error loading DIDs:", err);
        setError(err instanceof Error ? err.message : "Failed to load DIDs");
      } finally {
        setIsLoading(false);
      }
    }

    loadDIDs();
  }, [service]);

  const getVerificationLevel = (level: number) => {
    switch (level) {
      case 1:
        return "Account";
      case 2:
        return "ID";
      case 3:
        return "KYC";
      default:
        return "None";
    }
  };

  if (!selectedAccount) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            View DIDs
          </h2>
          <p className="text-gray-500">
            Please connect your wallet to view DIDs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">All Identities</h2>
        <p className="mt-1 text-sm text-gray-500">
          Showing {dids.length} registered identities
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading DIDs...</p>
          </div>
        ) : dids.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No DIDs found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dids.map((did) => (
                <tr key={did.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="group relative flex items-center space-x-2">
                      <span className="cursor-help font-mono">
                        {`${did.id.slice(0, 10)}...${did.id.slice(-8)}`}
                      </span>
                      <button
                        onClick={() => copyToClipboard(did.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy DID"
                      >
                        {copiedDID === did.id ? (
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                        )}
                      </button>
                      <span className="invisible group-hover:visible absolute z-10 bg-black text-white text-xs rounded py-1 px-2 -mt-8">
                        {did.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {`${did.owner.slice(0, 6)}...${did.owner.slice(-4)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        did.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {did.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        verifications[did.id]?.level === 3
                          ? "bg-green-100 text-green-800"
                          : verifications[did.id]?.level === 2
                          ? "bg-yellow-100 text-yellow-800"
                          : verifications[did.id]?.level === 1
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getVerificationLevel(verifications[did.id]?.level || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        verifications[did.id]?.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {verifications[did.id]?.status || "None"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/dids/${did.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
