import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Document, DocumentSignature } from "../types/documents";
import {
  formatHash,
  formatDocumentType,
  formatDocumentStatus,
} from "../utils/formatters";

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
  if (!document) return null;

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

                  {signatures.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700">Signatures</h4>
                      <div className="mt-2 space-y-2">
                        {signatures.map((sig, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg text-sm"
                          >
                            <p>
                              <span className="font-medium">Signer: </span>
                              <span className="font-mono">{sig.signerDid}</span>
                            </p>
                            <p>
                              <span className="font-medium">Type: </span>
                              {formatDocumentType(sig.signatureType)}
                            </p>
                            {sig.metadata && (
                              <p>
                                <span className="font-medium">Comment: </span>
                                {sig.metadata}
                              </p>
                            )}
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
