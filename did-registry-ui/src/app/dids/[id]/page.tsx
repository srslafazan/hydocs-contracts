"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDID } from "../../../contexts/DIDContext";
import { ethers } from "ethers";
import { DIDViewer } from "@/src/components/DIDViewer";

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

      {didDetails && (
        <DIDViewer
          did={{
            id: didDetails.id,
            owner: didDetails.owner,
            identifiers: didDetails.identifiers,
            active: didDetails.active,
            created: ethers.BigNumber.from(
              Math.floor(new Date(didDetails.created).getTime() / 1000)
            ),
            updated: ethers.BigNumber.from(
              Math.floor(new Date(didDetails.updated).getTime() / 1000)
            ),
          }}
          verifications={
            verificationDetails
              ? [
                  {
                    verifier: ethers.constants.AddressZero,
                    level: verificationDetails.level,
                    status: ethers.utils.keccak256(
                      ethers.utils.toUtf8Bytes("ACTIVE")
                    ),
                    timestamp: ethers.BigNumber.from(
                      Math.floor(
                        new Date(verificationDetails.verifiedOn).getTime() /
                          1000
                      )
                    ),
                    expiration: ethers.BigNumber.from(
                      Math.floor(
                        new Date(verificationDetails.validUntil).getTime() /
                          1000
                      )
                    ),
                    metadata: verificationDetails.metadata,
                  },
                ]
              : []
          }
        />
      )}
    </div>
  );
}
