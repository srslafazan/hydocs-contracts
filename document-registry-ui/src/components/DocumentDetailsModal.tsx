import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Document, DocumentSignature } from "../types/documents";
import { useDocumentRegistry } from "../contexts/DocumentRegistryContext";
import {
  formatHash,
  formatDocumentType,
  formatDocumentStatus,
} from "../utils/formatters";

interface DocumentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export default function DocumentDetailsModal({
  isOpen,
  onClose,
  document,
}: DocumentDetailsModalProps) {
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);
  const [requiredSigners, setRequiredSigners] = useState<string[]>([]);
  const [hasAllSignatures, setHasAllSignatures] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getSignatures, getRequiredSigners, hasAllRequiredSignatures } =
    useDocumentRegistry();

  useEffect(() => {
    const loadDocumentDetails = async () => {
      setIsLoading(true);
      try {
        const [sigs, reqSigners, allSigned] = await Promise.all([
          getSignatures(document.id),
          getRequiredSigners(document.id),
          hasAllRequiredSignatures(document.id),
        ]);
        setSignatures(sigs);
        setRequiredSigners(reqSigners);
        setHasAllSignatures(allSigned);
      } catch (err) {
        console.error("Error loading document details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadDocumentDetails();
    }
  }, [
    document.id,
    getSignatures,
    getRequiredSigners,
    hasAllRequiredSignatures,
    isOpen,
  ]);

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
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Document Details
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Document ID
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatHash(document.id)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Content Hash
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatHash(document.contentHash)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Type</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDocumentType(document.documentType)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Status
                    </h4>
                    <p className="mt-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          formatDocumentStatus(document.status) === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : formatDocumentStatus(document.status) ===
                              "REVOKED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {formatDocumentStatus(document.status)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Owner</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {document.owner}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">DID</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatHash(document.did)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Created At
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(document.createdAt * 1000).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Expires At
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {document.expiresAt
                        ? new Date(document.expiresAt * 1000).toLocaleString()
                        : "Never"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Metadata
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {document.metadata || "No metadata"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Required Signers
                    </h4>
                    {isLoading ? (
                      <p className="mt-1 text-sm text-gray-500">Loading...</p>
                    ) : requiredSigners.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {requiredSigners.map((signer) => (
                          <li key={signer} className="text-sm text-gray-900">
                            {formatHash(signer)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">
                        No required signers
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Signatures
                    </h4>
                    {isLoading ? (
                      <p className="mt-1 text-sm text-gray-500">Loading...</p>
                    ) : signatures.length > 0 ? (
                      <div className="mt-2 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead>
                                <tr>
                                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Signer
                                  </th>
                                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Type
                                  </th>
                                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
                                    Timestamp
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {signatures.map((sig, idx) => (
                                  <tr key={idx}>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                                      {formatHash(sig.signerDid)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                                      {formatHash(sig.signatureType)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                      {new Date(
                                        sig.timestamp * 1000
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">
                        No signatures yet
                      </p>
                    )}
                  </div>

                  {requiredSigners.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Signature Status
                      </h4>
                      <p className="mt-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${
                            hasAllSignatures
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {hasAllSignatures
                            ? "All signatures collected"
                            : "Pending signatures"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
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
