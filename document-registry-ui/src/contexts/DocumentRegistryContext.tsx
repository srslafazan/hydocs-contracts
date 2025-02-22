"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useState,
} from "react";
import {
  DOCUMENT_CONTRACT_ADDRESS,
  DID_CONTRACT_ADDRESS,
} from "../config/web3";
import DocumentRegistryABI from "../contracts/DocumentRegistry.sol/DocumentRegistry.json";
import DIDRegistryABI from "../contracts/DIDRegistry.sol/DIDRegistry.json";
import { Contract } from "ethers";
import { useWeb3 } from "./Web3Context";
import { Document, DocumentSignature } from "../types/documents";
import { ethers } from "ethers";

interface DocumentRegistryContextType {
  // Document Registration
  registerDocument: (
    contentHash: string,
    documentType: string,
    expiresAt: number,
    metadata: string,
    requiredSigners: string[]
  ) => Promise<ethers.ContractTransactionResponse>;

  // Document Signing
  signDocument: (
    documentId: string,
    signatureType: string,
    metadata: string
  ) => Promise<void>;

  // Document Management
  revokeDocument: (documentId: string) => Promise<void>;
  updateMetadata: (documentId: string, metadata: string) => Promise<void>;

  // Document Queries
  getDocument: (documentId: string) => Promise<Document>;
  getSignatures: (documentId: string) => Promise<DocumentSignature[]>;
  getRequiredSigners: (documentId: string) => Promise<string[]>;
  hasAllRequiredSignatures: (documentId: string) => Promise<boolean>;
  getDocumentsByOwner: (owner: string) => Promise<Document[]>;
  getDocumentsByTimeRange: (
    startTime: number,
    endTime: number,
    owner?: string
  ) => Promise<Document[]>;

  // Loading States
  isLoading: boolean;
  error: Error | null;
}

const DocumentRegistryContext = createContext<
  DocumentRegistryContextType | undefined
>(undefined);

export function DocumentRegistryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { signer, provider } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getDocumentRegistryContract = useCallback(() => {
    if (!signer) throw new Error("No signer available");
    return new Contract(
      DOCUMENT_CONTRACT_ADDRESS,
      DocumentRegistryABI.abi,
      signer
    );
  }, [signer]);

  const getDIDRegistryContract = useCallback(() => {
    if (!signer) throw new Error("No signer available");
    return new Contract(DID_CONTRACT_ADDRESS, DIDRegistryABI.abi, signer);
  }, [signer]);

  const registerDocument = useCallback(
    async (
      contentHash: string,
      documentType: string,
      expiresAt: number,
      metadata: string,
      requiredSigners: string[]
    ): Promise<ethers.ContractTransactionResponse> => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        const tx = await contract.registerDocument(
          contentHash,
          documentType,
          expiresAt,
          metadata,
          requiredSigners
        );
        return tx;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const signDocument = useCallback(
    async (documentId: string, signatureType: string, metadata: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        const tx = await contract.signDocument(
          documentId,
          signatureType,
          metadata
        );
        await tx.wait();
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const revokeDocument = useCallback(
    async (documentId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        const tx = await contract.revokeDocument(documentId);
        await tx.wait();
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const updateMetadata = useCallback(
    async (documentId: string, metadata: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        const tx = await contract.updateMetadata(documentId, metadata);
        await tx.wait();
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const getDocument = useCallback(
    async (documentId: string): Promise<Document> => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        const doc = await contract.documents(documentId);
        return {
          id: documentId,
          contentHash: doc.contentHash,
          documentType: doc.documentType,
          owner: doc.owner,
          did: doc.did,
          createdAt: Number(doc.createdAt),
          expiresAt: Number(doc.expiresAt),
          status: doc.status,
          metadata: doc.metadata,
          version: Number(doc.version),
        };
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const getSignatures = useCallback(
    async (documentId: string): Promise<DocumentSignature[]> => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        const sigs = await contract.getSignatures(documentId);
        return sigs.map((sig: any) => ({
          signerDid: sig.signerDid,
          timestamp: Number(sig.timestamp),
          signatureType: sig.signatureType,
          metadata: sig.metadata,
        }));
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const getRequiredSigners = useCallback(
    async (documentId: string): Promise<string[]> => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        return await contract.getRequiredSigners(documentId);
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const hasAllRequiredSignatures = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();
        return await contract.hasAllRequiredSignatures(documentId);
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract]
  );

  const getDocumentsByOwner = useCallback(
    async (owner: string): Promise<Document[]> => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();

        console.log("Contract address:", contract.target);
        console.log("Looking for documents owned by:", owner);

        // Create filter with the exact topic from the transaction logs
        const eventTopic =
          "0x56b1b6006a137d79a16380b47d350b1663d9c46a31a1ec0090f77f7a4327b130";
        const ownerTopic = ethers.zeroPadValue(owner.toLowerCase(), 32);

        const events = await provider?.getLogs({
          address: contract.target,
          topics: [eventTopic, null, ownerTopic],
          fromBlock: 0,
          toBlock: "latest",
        });

        console.log("Found events:", events);

        if (!events) return [];

        // Get all documents
        const documents = await Promise.all(
          events.map(async (event) => {
            try {
              // Get documentId from the second topic
              const documentId = event.topics[1];
              console.log("Fetching document:", documentId);

              // Get document details from contract storage
              const doc = await getDocument(documentId);
              console.log("Document details:", doc);
              return doc;
            } catch (err) {
              console.error("Error fetching document:", err);
              return null;
            }
          })
        );

        // Filter out null values and sort by creation time
        const validDocuments = documents.filter(
          (doc): doc is Document => doc !== null
        );
        validDocuments.sort((a, b) => b.createdAt - a.createdAt);

        console.log("Found documents:", validDocuments.length);
        return validDocuments;
      } catch (err: any) {
        console.error("Error fetching documents:", err);
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract, getDocument, provider]
  );

  const getDocumentsByTimeRange = useCallback(
    async (
      startTime: number,
      endTime: number,
      owner?: string
    ): Promise<Document[]> => {
      try {
        setIsLoading(true);
        setError(null);
        const contract = getDocumentRegistryContract();

        // Get event signature hash
        const eventSignature =
          "DocumentRegistered(bytes32,bytes32,bytes32,address,bytes32,uint256,uint256)";
        const eventTopic = ethers.id(eventSignature);

        // Create filter with topics
        const ownerTopic = owner
          ? ethers.zeroPadValue(owner.toLowerCase(), 32)
          : null;
        const events = await provider?.getLogs({
          address: contract.target,
          topics: [eventTopic, null, null, ownerTopic],
          fromBlock: 0,
          toBlock: "latest",
        });

        if (!events) return [];

        // Parse logs and filter by timestamp
        const documents = await Promise.all(
          events.map(async (event) => {
            const parsedLog = contract.interface.parseLog({
              topics: event.topics as string[],
              data: event.data,
            });
            if (!parsedLog) return null;
            const timestamp = Number(parsedLog.args[5]); // createdAt is at index 5
            if (timestamp < startTime || timestamp > endTime) return null;
            const documentId = parsedLog.args[0] as string;
            return await getDocument(documentId);
          })
        );

        // Filter out null values and sort by creation time
        const validDocuments = documents.filter(
          (doc): doc is Document => doc !== null
        );
        validDocuments.sort((a, b) => b.createdAt - a.createdAt);

        return validDocuments;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getDocumentRegistryContract, getDocument, provider]
  );

  return (
    <DocumentRegistryContext.Provider
      value={{
        registerDocument,
        signDocument,
        revokeDocument,
        updateMetadata,
        getDocument,
        getSignatures,
        getRequiredSigners,
        hasAllRequiredSignatures,
        getDocumentsByOwner,
        getDocumentsByTimeRange,
        isLoading,
        error,
      }}
    >
      {children}
    </DocumentRegistryContext.Provider>
  );
}

export function useDocumentRegistry() {
  const context = useContext(DocumentRegistryContext);
  if (context === undefined) {
    throw new Error(
      "useDocumentRegistry must be used within a DocumentRegistryProvider"
    );
  }
  return context;
}
