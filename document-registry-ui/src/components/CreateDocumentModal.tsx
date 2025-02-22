import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useDocumentRegistry } from "../contexts/DocumentRegistryContext";
import { DocumentType } from "../types/documents";

export interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void>;
}

export default function CreateDocumentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDocumentModalProps) {
  const [formData, setFormData] = useState({
    contentHash: "",
    documentType: DocumentType.GENERAL,
    metadata: "",
    expiresAt: "",
    requiredSigners: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerDocument } = useDocumentRegistry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const expiresAtTimestamp = formData.expiresAt
        ? Math.floor(new Date(formData.expiresAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 86400 * 365; // Default to 1 year

      await registerDocument(
        formData.contentHash,
        formData.documentType,
        expiresAtTimestamp,
        formData.metadata,
        formData.requiredSigners
      );

      onSuccess?.();
      onClose();
      setFormData({
        contentHash: "",
        documentType: DocumentType.GENERAL,
        metadata: "",
        expiresAt: "",
        requiredSigners: [],
      });
    } catch (err) {
      console.error("Error creating document:", err);
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
                  Create New Document
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="contentHash"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Content Hash
                    </label>
                    <input
                      type="text"
                      id="contentHash"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.contentHash}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contentHash: e.target.value,
                        })
                      }
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="documentType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Document Type
                    </label>
                    <select
                      id="documentType"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.documentType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentType: e.target.value as DocumentType,
                        })
                      }
                    >
                      {Object.values(DocumentType).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="metadata"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Metadata
                    </label>
                    <input
                      type="text"
                      id="metadata"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.metadata}
                      onChange={(e) =>
                        setFormData({ ...formData, metadata: e.target.value })
                      }
                      placeholder="Additional information about the document"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="expiresAt"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="expiresAt"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="requiredSigners"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Required Signers (DID IDs, one per line)
                    </label>
                    <textarea
                      id="requiredSigners"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={3}
                      value={formData.requiredSigners.join("\n")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredSigners: e.target.value
                            .split("\n")
                            .filter(Boolean),
                        })
                      }
                      placeholder="Enter DID IDs, one per line"
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
                      {isSubmitting ? "Creating..." : "Create Document"}
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
