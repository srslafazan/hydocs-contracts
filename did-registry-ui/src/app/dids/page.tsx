"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useDID } from "../../contexts/DIDContext";
import Link from "next/link";

interface DIDInfo {
  id: string;
  owner: string;
  verificationLevel: number;
  isVerified: boolean;
  verificationStatus: string;
  active: boolean;
}

function DIDList() {
  const { actions } = useDID();
  const [dids, setDids] = useState<DIDInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDIDs() {
      try {
        setLoading(true);
        // Get all DID created events
        const events = await actions.service.getAllDIDEvents();

        // Get unique DIDs (in case of duplicates)
        const uniqueDIDs = [
          ...new Set(events.map((event) => event.args?.didId)),
        ].filter(Boolean);

        // Fetch details for each DID
        const didDetails = await Promise.all(
          uniqueDIDs.map(async (didId): Promise<DIDInfo | null> => {
            try {
              const owner = await actions.service.getDIDOwner(didId);
              const isVerified = await actions.service.isVerified(didId);
              const metadata = await actions.service.getDIDMetadata(didId);

              // Get verification details
              const verifierRole = ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
              );
              const verifiers = await actions.service.getRoleMemberArray(
                verifierRole
              );

              let highestLevel = 0;
              let currentStatus = "None";

              // Check verifications from all verifiers
              for (const verifier of verifiers) {
                const verification = await actions.service.getVerification(
                  didId,
                  verifier
                );
                if (verification.verifier !== ethers.constants.AddressZero) {
                  const isActive =
                    verification.status ===
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"));
                  const isExpired = ethers.BigNumber.from(
                    verification.expiration
                  ).lt(ethers.BigNumber.from(Math.floor(Date.now() / 1000)));

                  if (isActive && !isExpired) {
                    highestLevel = Math.max(highestLevel, verification.level);
                    currentStatus = "Active";
                  } else if (isExpired) {
                    currentStatus = "Expired";
                  } else {
                    currentStatus = "Revoked";
                  }
                }
              }

              return {
                id: didId,
                owner,
                verificationLevel: highestLevel,
                isVerified,
                verificationStatus: currentStatus,
                active: metadata.active,
              };
            } catch (err) {
              console.error(`Error fetching details for DID ${didId}:`, err);
              return null;
            }
          })
        );

        // Filter out any null results from errors and set the state
        setDids(didDetails.filter((did): did is DIDInfo => did !== null));
      } catch (err) {
        console.error("Error loading DIDs:", err);
        setError("Failed to load DIDs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadDIDs();
  }, [actions.service]);

  const getVerificationLevelText = (level: number) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800">
            <h1 className="text-2xl font-bold text-white">All Identities</h1>
            <p className="text-blue-100 mt-2">
              Showing {dids.length} registered identities
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
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
                  {/* TODO - might be unnecessary to have this column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification Status
                  </th>
                  {/* TODO - might be unnecessary to have this column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dids.map((did) => (
                  <tr key={did.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                      {did.id.slice(0, 10)}...{did.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                      {did.owner.slice(0, 6)}...{did.owner.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm 
                        ${
                          did.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {did.active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm 
                        ${
                          did.verificationLevel === 3
                            ? "bg-green-100 text-green-800"
                            : did.verificationLevel === 2
                            ? "bg-blue-100 text-blue-800"
                            : did.verificationLevel === 1
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getVerificationLevelText(did.verificationLevel)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm 
                        ${
                          did.verificationStatus === "Active"
                            ? "bg-green-100 text-green-800"
                            : did.verificationStatus === "Expired"
                            ? "bg-yellow-100 text-yellow-800"
                            : did.verificationStatus === "Revoked"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {did.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/did/${did.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DIDList;
