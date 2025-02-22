import { useState, useEffect, useCallback } from "react";
import { useDocumentRegistry } from "../contexts/DocumentRegistryContext";
import { Document, DocumentStatus, DocumentType } from "../types/documents";
import CreateDocumentModal from "./CreateDocumentModal";
import DocumentDetailsModal from "./DocumentDetailsModal";
import SignDocumentModal from "./SignDocumentModal";
import { useWeb3 } from "../contexts/Web3Context";
import {
  formatHash,
  formatDocumentType,
  formatDocumentStatus,
} from "../utils/formatters";

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { account } = useWeb3();
  const {
    registerDocument,
    signDocument,
    revokeDocument,
    getDocument,
    getSignatures,
    getRequiredSigners,
    hasAllRequiredSignatures,
    error: contractError,
    getDocumentsByOwner,
  } = useDocumentRegistry();

  const refreshDocuments = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      console.log("Fetching documents for account:", account);
      const docs = await getDocumentsByOwner(account);
      console.log("Retrieved documents:", docs);
      setDocuments(docs);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [account, getDocumentsByOwner]);

  useEffect(() => {
    console.log("DocumentList mounted/updated, account:", account);
    refreshDocuments();
  }, [refreshDocuments]);

  const handleCreateDocument = async () => {
    await refreshDocuments();
    setIsCreateModalOpen(false);
  };

  const handleViewDocument = async (doc: Document) => {
    setSelectedDocument(doc);
    setIsDetailsModalOpen(true);
  };

  const handleSignDocument = async (doc: Document) => {
    setSelectedDocument(doc);
    setIsSignModalOpen(true);
  };

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Please connect your wallet to view documents
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshDocuments}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Register Document
          </button>
        </div>
      </div>

      {contractError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {contractError.message}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No documents found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="group relative">
                      <span className="cursor-help">{formatHash(doc.id)}</span>
                      <span className="invisible group-hover:visible absolute z-10 bg-black text-white text-xs rounded py-1 px-2 -mt-8">
                        {doc.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="group relative">
                      <span className="cursor-help">
                        {formatHash(doc.contentHash)}
                      </span>
                      <span className="invisible group-hover:visible absolute z-10 bg-black text-white text-xs rounded py-1 px-2 -mt-8">
                        {doc.contentHash}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDocumentType(doc.documentType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        formatDocumentStatus(doc.status).toLowerCase() ===
                        DocumentStatus.ACTIVE.toLowerCase()
                          ? "bg-green-100 text-green-800"
                          : formatDocumentStatus(doc.status).toLowerCase() ===
                            DocumentStatus.REVOKED.toLowerCase()
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {formatDocumentStatus(doc.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.createdAt * 1000).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => handleViewDocument(doc)}
                    >
                      View
                    </button>
                    <button
                      className="text-green-600 hover:text-green-900 mr-4"
                      onClick={() => handleSignDocument(doc)}
                    >
                      Sign
                    </button>
                    <button
                      className={`${
                        doc.status === DocumentStatus.REVOKED
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-900"
                      }`}
                      onClick={async () => {
                        try {
                          if (doc.status !== DocumentStatus.REVOKED) {
                            await revokeDocument(doc.id);
                            await refreshDocuments();
                          }
                        } catch (err) {
                          console.error("Error revoking document:", err);
                        }
                      }}
                      disabled={doc.status === DocumentStatus.REVOKED}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateDocument}
      />

      {selectedDocument && (
        <>
          <DocumentDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedDocument(null);
            }}
            document={selectedDocument}
          />
          <SignDocumentModal
            isOpen={isSignModalOpen}
            onClose={() => {
              setIsSignModalOpen(false);
              setSelectedDocument(null);
            }}
            document={selectedDocument}
            onSuccess={refreshDocuments}
          />
        </>
      )}
    </div>
  );
}
