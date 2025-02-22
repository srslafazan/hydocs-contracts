import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Document, DocumentSignature } from "../types/documents";
import {
  formatHash,
  formatDocumentType,
  formatDocumentStatus,
  formatSignatureType,
} from "../utils/formatters";
import { useDocumentRegistry } from "../contexts/DocumentRegistryContext";

interface DocumentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  signatures?: DocumentSignature[];
}

export default function DocumentDetailsModal({
  isOpen,
  onClose,
  document,
  signatures = [],
}: DocumentDetailsModalProps) {
  const [copiedDID, setCopiedDID] = useState<string | null>(null);
  const [requiredSigners, setRequiredSigners] = useState<string[]>([]);
  const { getRequiredSigners } = useDocumentRegistry();

  // Debug logging
  useEffect(() => {
    if (signatures.length > 0) {
      console.log("Received signatures:", signatures);
    }
  }, [signatures]);

  // Fetch required signers
  useEffect(() => {
    async function fetchRequiredSigners() {
      if (document) {
        try {
          const signers = await getRequiredSigners(document.id);
          setRequiredSigners(signers);
        } catch (err) {
          console.error("Error fetching required signers:", err);
        }
      }
    }
    fetchRequiredSigners();
  }, [document, getRequiredSigners]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDID(text);
      setTimeout(() => setCopiedDID(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Helper function to format signer display
  const formatSigner = (signer: string) => {
    if (signer.startsWith("0x")) {
      return `${signer.slice(0, 10)}...${signer.slice(-8)}`;
    }
    return signer;
  };

  // Helper function to check if a signer has signed
  const hasSignerSigned = (signer: string) => {
    return signatures.some(
      (sig) => sig.signerDid.toLowerCase() === signer.toLowerCase()
    );
  };

  if (!document) return null;

  // Get pending signers
  const pendingSigners = requiredSigners.filter(
    (signer) => !hasSignerSigned(signer)
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Document Details
                </Dialog.Title>

                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Document ID</h4>
                    <p className="text-sm text-gray-600 font-mono">
                      {formatHash(document.id)}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Owner</h4>
                    <p className="text-sm text-gray-600 font-mono">
                      {document.owner}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Type</h4>
                    <p className="text-sm text-gray-600">
                      {formatDocumentType(document.documentType)}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Status</h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        document.status === "REVOKED"
                          ? "bg-red-100 text-red-800"
                          : document.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {formatDocumentStatus(document.status)}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Content Hash</h4>
                    <p className="text-sm text-gray-600 font-mono">
                      {formatHash(document.contentHash)}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Metadata</h4>
                    <p className="text-sm text-gray-600">
                      {document.metadata || "No metadata"}
                    </p>
                  </div>

                  {signatures && signatures.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Signatures ({signatures.length})
                      </h4>
                      <div className="mt-2 space-y-3">
                        {signatures.map((sig, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 rounded-lg text-sm border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-700">
                                  Signer:
                                </span>
                                <span className="font-mono">
                                  {formatSigner(sig.signerDid)}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(sig.signerDid)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy DID"
                                >
                                  {copiedDID === sig.signerDid ? (
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
                              </div>
                              <span className="text-gray-500 text-xs">
                                {new Date(
                                  sig.timestamp * 1000
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-700">
                                Type:
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  formatSignatureType(sig.signatureType) ===
                                  "APPROVE"
                                    ? "bg-green-100 text-green-800"
                                    : formatSignatureType(sig.signatureType) ===
                                      "REJECT"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {formatSignatureType(sig.signatureType)}
                              </span>
                            </div>
                            {sig.metadata && (
                              <div className="mt-2 text-gray-600 bg-white p-2 rounded border border-gray-100">
                                <span className="font-medium text-gray-700">
                                  Comment:
                                </span>{" "}
                                {sig.metadata}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingSigners.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">
                        Pending Signers ({pendingSigners.length})
                      </h4>
                      <div className="mt-2 space-y-2">
                        {pendingSigners.map((signer, index) => (
                          <div
                            key={index}
                            className="p-3 bg-yellow-50 rounded-lg text-sm border border-yellow-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono">
                                  {formatSigner(signer)}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(signer)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy Address/DID"
                                >
                                  {copiedDID === signer ? (
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
                              </div>
                              <span className="text-yellow-600 text-xs font-medium">
                                Pending
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
