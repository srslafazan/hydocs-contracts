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
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-blue-800 mb-6">DID Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">
              DID Identifier
            </h4>
            <p className="mt-1 text-base text-gray-900 break-all">{did.id}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">Owner</h4>
            <p className="mt-1 text-base text-gray-900 font-mono break-all">
              {did.owner}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md md:col-span-2">
            <h4 className="text-sm font-medium text-blue-600">Identifiers</h4>
            <ul className="mt-2 space-y-2">
              {did.identifiers.map((identifier, index) => (
                <li
                  key={index}
                  className="text-base text-gray-900 font-mono break-all bg-white p-2 rounded"
                >
                  {identifier}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">Status</h4>
            <p className="mt-1 text-base">
              <span
                className={`px-3 py-1 rounded-full ${
                  did.active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {did.active ? "Active" : "Deactivated"}
              </span>
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">Created</h4>
            <p className="mt-1 text-base text-gray-900">
              {formatDate(Number(did.created))}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">Last Updated</h4>
            <p className="mt-1 text-base text-gray-900">
              {formatDate(Number(did.updated))}
            </p>
          </div>
        </div>

        {did.active &&
          typeof window !== "undefined" &&
          window.ethereum?.selectedAddress === did.owner && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-blue-800 mb-4">
                Update DID
              </h3>
              <DIDForm mode="update" didId={did.id} />
            </div>
          )}
      </div>

      {verifications.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-blue-800 mb-6">
            Verifications
          </h3>

          <div className="grid gap-4">
            {verifications.map((verification, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-blue-600">
                      Verifier
                    </span>
                    <p className="mt-1 font-mono text-base break-all">
                      {verification.verifier}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-blue-600">
                      Level
                    </span>
                    <p className="mt-1 text-base">
                      {verification.level.toString()}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-blue-600">
                      Status
                    </span>
                    <p className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full ${
                          verification.status ===
                          ethers.utils.keccak256(
                            ethers.utils.toUtf8Bytes("ACTIVE")
                          )
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {verification.status ===
                        ethers.utils.keccak256(
                          ethers.utils.toUtf8Bytes("ACTIVE")
                        )
                          ? "Active"
                          : "Revoked"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-blue-600">
                      Expiration
                    </span>
                    <p className="mt-1 text-base">
                      {formatDate(Number(verification.expiration))}
                    </p>
                  </div>

                  {verification.metadata && (
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-blue-600">
                        Metadata
                      </span>
                      <p className="mt-1 text-base bg-white p-3 rounded">
                        {verification.metadata}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {verifierState.isVerifier && <VerificationPanel didId={did.id} />}
    </div>
  );
}
