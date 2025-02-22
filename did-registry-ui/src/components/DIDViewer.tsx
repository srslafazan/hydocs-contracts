import React from "react";
import { ethers, BigNumber } from "ethers";
import { DIDForm } from "./DIDForm";
import { DIDDocument, Verification } from "../types/DIDRegistry";

interface DIDViewerProps {
  did: DIDDocument;
  verifications: Verification[];
}

export function DIDViewer({ did, verifications }: DIDViewerProps) {
  // Format timestamps to human-readable dates
  const formatDate = (timestamp: BigNumber | number) => {
    if (BigNumber.isBigNumber(timestamp)) {
      return new Date(timestamp.toNumber() * 1000).toLocaleString();
    }
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Decode and format verification metadata
  const decodeMetadata = (
    metadata: string
  ): { details: string; timestamp?: string } => {
    const tryDecodeAbiString = (encoded: string): string | null => {
      try {
        return ethers.utils.defaultAbiCoder.decode(["string"], encoded)[0];
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

    let current = metadata;
    let result: { details: string; timestamp?: string } = { details: "" };

    // Keep trying to decode and parse until we can't anymore
    while (true) {
      const decoded = tryDecodeAbiString(current);
      if (!decoded) break;

      const parsed = tryParseJson(decoded);
      if (!parsed) {
        result.details = decoded;
        break;
      }

      if (parsed.details) {
        if (
          typeof parsed.details === "string" &&
          parsed.details.startsWith("0x")
        ) {
          current = parsed.details;
          if (parsed.timestamp) {
            result.timestamp = new Date(parsed.timestamp).toLocaleString();
          }
          continue;
        }
        result.details = parsed.details;
      }
      if (parsed.timestamp && !result.timestamp) {
        result.timestamp = new Date(parsed.timestamp).toLocaleString();
      }
      break;
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">DID Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">
              DID Identifier
            </h4>
            <p className="mt-1 text-base text-gray-900 break-all">{did.id}</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">Owner</h4>
            <p className="mt-1 text-base text-gray-900 font-mono break-all">
              {did.owner}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-md md:col-span-2">
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

          <div className="bg-gray-50 p-3 rounded-md">
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

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">Created</h4>
            <p className="mt-1 text-base text-gray-900">
              {formatDate(did.created)}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-600">Last Updated</h4>
            <p className="mt-1 text-base text-gray-900">
              {formatDate(did.updated)}
            </p>
          </div>
        </div>

        {did.active &&
          typeof window !== "undefined" &&
          window.ethereum?.selectedAddress === did.owner && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-xl font-bold text-blue-800 mb-3">
                Update DID
              </h3>
              <DIDForm mode="update" didId={did.id} />
            </div>
          )}
      </div>

      {verifications.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mt-4">
          <h3 className="text-xl font-bold text-blue-800 mb-3">
            Identity Verifications
          </h3>
          <p className="text-gray-600 mb-4">
            Current verification status and levels for your identity.
          </p>

          <div className="space-y-4">
            {verifications.map((verification, index) => {
              const isActive =
                verification.status ===
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"));
              const isExpired = BigNumber.from(verification.expiration).lt(
                BigNumber.from(Math.floor(Date.now() / 1000))
              );
              const isRevoked =
                verification.status ===
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("REVOKED"));

              // Only show verification if it has a verifier address
              if (verification.verifier === ethers.constants.AddressZero) {
                return null;
              }

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    isActive && !isExpired
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {(() => {
                          switch (verification.level.toString()) {
                            case "1":
                              return "Account Verification";
                            case "2":
                              return "ID Verification";
                            case "3":
                              return "KYC Verification";
                            default:
                              return `Level ${verification.level.toString()} Verification`;
                          }
                        })()}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {(() => {
                          switch (verification.level.toString()) {
                            case "1":
                              return "Account ownership verification";
                            case "2":
                              return "Government ID verification";
                            case "3":
                              return "Full KYC with biometric verification";
                            default:
                              return "Custom verification level";
                          }
                        })()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        isActive && !isExpired
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isRevoked
                        ? "Revoked"
                        : isExpired
                        ? "Expired"
                        : isActive
                        ? "Active"
                        : "Invalid"}
                    </span>
                  </div>

                  {verification.metadata && (
                    <div className="mt-4 bg-white rounded-md border border-gray-100 p-3">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">
                        Verification Details
                      </h5>
                      {(() => {
                        const { details, timestamp } = decodeMetadata(
                          verification.metadata
                        );
                        return (
                          <>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {details}
                            </p>
                            {timestamp && (
                              <p className="text-xs text-gray-500 mt-2">
                                Verification note added: {timestamp}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm bg-white rounded-md border border-gray-100 p-3">
                    <div>
                      <p className="text-gray-600 font-medium">Verified On</p>
                      <p className="text-gray-900">
                        {formatDate(verification.timestamp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Valid Until</p>
                      <p className="text-gray-900">
                        {formatDate(verification.expiration)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
