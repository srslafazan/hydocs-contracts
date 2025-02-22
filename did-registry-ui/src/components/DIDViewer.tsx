import React from "react";
import { ethers } from "ethers";
import { DIDForm } from "./DIDForm";
import { VerificationPanel } from "./VerificationPanel";
import { DIDDocument, Verification } from "../types/DIDRegistry";
import { useDID } from "../contexts/DIDContext";

interface DIDViewerProps {
  did: DIDDocument;
  verifications: Verification[];
}

export function DIDViewer({ did, verifications }: DIDViewerProps) {
  const { verifierState } = useDID();

  // Format timestamps to human-readable dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="p-4 space-y-4 border rounded">
        <h2 className="text-2xl font-bold">DID Details</h2>

        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              DID Identifier
            </h4>
            <p className="mt-1 text-sm text-gray-900">{did.id}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Owner</h4>
            <p className="mt-1 text-sm text-gray-900 font-mono">{did.owner}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Identifiers</h4>
            <ul className="mt-1 space-y-1">
              {did.identifiers.map((identifier, index) => (
                <li key={index} className="text-sm text-gray-900 font-mono">
                  {identifier}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <p className="mt-1 text-sm text-gray-900">
              {did.active ? "Active" : "Deactivated"}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Created</h4>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(Number(did.created))}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(Number(did.updated))}
            </p>
          </div>
        </div>

        {did.active &&
          typeof window !== "undefined" &&
          window.ethereum?.selectedAddress === did.owner && (
            <div className="pt-4 mt-4 border-t">
              <h3 className="mb-4 text-lg font-bold">Update DID</h3>
              <DIDForm mode="update" didId={did.id} />
            </div>
          )}
      </div>

      {verifications.length > 0 && (
        <div className="p-4 space-y-4 border rounded">
          <h3 className="text-lg font-bold">Verifications</h3>

          <div className="space-y-4">
            {verifications.map((verification, index) => (
              <div key={index} className="p-4 border rounded">
                <div>
                  <span className="font-semibold">Verifier: </span>
                  <span className="font-mono">{verification.verifier}</span>
                </div>

                <div>
                  <span className="font-semibold">Level: </span>
                  {verification.level.toString()}
                </div>

                <div>
                  <span className="font-semibold">Status: </span>
                  <span
                    className={
                      verification.status ===
                      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"))
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {verification.status ===
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"))
                      ? "Active"
                      : "Revoked"}
                  </span>
                </div>

                <div>
                  <span className="font-semibold">Expiration: </span>
                  {formatDate(Number(verification.expiration))}
                </div>

                {verification.metadata && (
                  <div>
                    <span className="font-semibold">Metadata: </span>
                    {verification.metadata}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {verifierState.isVerifier && <VerificationPanel didId={did.id} />}
    </div>
  );
}
