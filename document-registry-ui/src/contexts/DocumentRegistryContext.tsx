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
import DocumentRegistryABI from "../contracts/DocumentRegistry.json";
import DIDRegistryABI from "../contracts/DIDRegistry.json";
import { Contract } from "ethers";
import { useWeb3 } from "./Web3Context";
import { Document, DocumentSignature } from "../types/documents";

interface DocumentRegistryContextType {
  // Document Registration
  registerDocument: (
    contentHash: string,
    documentType: string,
    expiresAt: number,
    metadata: string,
    requiredSigners: string[]
  ) => Promise<void>;

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
    ) => {
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
