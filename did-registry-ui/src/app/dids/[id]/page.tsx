"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDID } from "../../../contexts/DIDContext";
import { ethers } from "ethers";

interface VerificationDetails {
  level: number;
  status: string;
  verifiedOn: string;
  validUntil: string;
  metadata: string;
}

export default function DIDDetailsPage() {
  const params = useParams();
  const didId = params.id as string;
  const { actions } = useDID();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [didDetails, setDidDetails] = useState<any>(null);
  const [verificationDetails, setVerificationDetails] =
    useState<VerificationDetails | null>(null);

  useEffect(() => {
    async function loadDIDDetails() {
      try {
        setLoading(true);
        setError(null);

        // Get DID owner and metadata
        const owner = await actions.service.getDIDOwner(didId);
        const metadata = await actions.service.getDIDMetadata(didId);
        const identifiers = await actions.service.getDIDIdentifiers(didId);

        // Get verification details
        const verifierRole = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
        );
        const verifiers = await actions.service.getRoleMemberArray(
          verifierRole
        );
        let highestVerification = null;

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
            const isExpired = ethers.BigNumber.from(verification.expiration).lt(
              ethers.BigNumber.from(Math.floor(Date.now() / 1000))
            );

            if (
              isActive &&
              !isExpired &&
              (!highestVerification ||
                verification.level > highestVerification.level)
            ) {
              highestVerification = {
                level: verification.level,
                status: "Active",
                verifiedOn: new Date(
                  verification.timestamp.toNumber() * 1000
                ).toLocaleString(),
                validUntil: new Date(
                  verification.expiration.toNumber() * 1000
                ).toLocaleString(),
                metadata: verification.metadata,
              };
            }
          }
        }

        setDidDetails({
          id: didId,
          owner,
          identifiers,
          active: metadata.active,
          created: new Date(
            metadata.created.toNumber() * 1000
          ).toLocaleString(),
          updated: new Date(
            metadata.updated.toNumber() * 1000
          ).toLocaleString(),
        });

        setVerificationDetails(highestVerification);
      } catch (err: any) {
        console.error("Error loading DID details:", err);
        setError(err.message || "Failed to load DID details");
      } finally {
        setLoading(false);
      }
    }

    if (didId) {
      loadDIDDetails();
    }
  }, [didId, actions.service]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!didDetails) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <p className="text-yellow-700">DID not found</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Identity Details
        </h2>
      </div>

      {/* DID Details Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            DID Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                DID Identifier
              </label>
              <p className="mt-1 font-mono text-gray-900">{didDetails.id}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Owner</label>
              <p className="mt-1 font-mono text-gray-900">{didDetails.owner}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Identifiers
              </label>
              <div className="mt-1 space-y-1">
                {didDetails.identifiers.map(
                  (identifier: string, index: number) => (
                    <p key={index} className="font-mono text-gray-900">
                      {identifier}
                    </p>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <p className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    didDetails.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {didDetails.active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Created
              </label>
              <p className="mt-1 text-gray-900">{didDetails.created}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Updated
              </label>
              <p className="mt-1 text-gray-900">{didDetails.updated}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Verifications Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Identity Verifications
          </h3>
          <p className="text-gray-500 mb-6">
            Current verification status and levels for your identity.
          </p>

          {verificationDetails ? (
            <div className="bg-green-50 border border-green-100 rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {getVerificationLevelText(verificationDetails.level)}{" "}
                    Verification
                  </h4>
                  <p className="text-gray-600 mt-1">
                    {verificationDetails.metadata}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {verificationDetails.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Verified On
                  </label>
                  <p className="mt-1 text-gray-900">
                    {verificationDetails.verifiedOn}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Valid Until
                  </label>
                  <p className="mt-1 text-gray-900">
                    {verificationDetails.validUntil}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600">
                No verifications found for this identity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
