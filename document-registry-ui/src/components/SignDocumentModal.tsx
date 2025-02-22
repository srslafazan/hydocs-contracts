import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Document } from "../types/documents";
import { useDocumentRegistry } from "../contexts/DocumentRegistryContext";
import { ethers } from "ethers";

interface SignDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onSuccess?: () => Promise<void>;
}

export default function SignDocumentModal({
  isOpen,
  onClose,
  document,
  onSuccess,
}: SignDocumentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureType, setSignatureType] = useState("APPROVE");
  const [metadata, setMetadata] = useState("");
  const { signDocument } = useDocumentRegistry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert signatureType to bytes32
      const signatureTypeBytes = ethers.id(signatureType);

      await signDocument(document.id, signatureTypeBytes, metadata);
      await onSuccess?.();
      onClose();
      setMetadata("");
      setSignatureType("APPROVE");
    } catch (err) {
      console.error("Error signing document:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Sign Document
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="signatureType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Signature Type
                    </label>
                    <select
                      id="signatureType"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={signatureType}
                      onChange={(e) => setSignatureType(e.target.value)}
                    >
                      <option value="APPROVE">Approve</option>
                      <option value="REJECT">Reject</option>
                      <option value="ACKNOWLEDGE">Acknowledge</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="metadata"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Comments (Optional)
                    </label>
                    <textarea
                      id="metadata"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      value={metadata}
                      onChange={(e) => setMetadata(e.target.value)}
                      placeholder="Add any comments or notes about your signature"
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isSubmitting
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isSubmitting ? "Signing..." : "Sign Document"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
