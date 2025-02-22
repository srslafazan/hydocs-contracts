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
import {
  Document,
  DocumentSignature,
  DocumentStatus,
} from "../types/documents";
import { ethers } from "ethers";
import { formatDocumentStatus } from "../utils/formatters";

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

  // New functions
  getAllDocuments: () => Promise<
    { document: Document; signatures: DocumentSignature[] }[]
  >;
  getDocumentsToSign: (address: string) => Promise<Document[]>;
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
    if (!provider) {
      console.log("No provider available");
      throw new Error("No provider available");
    }

    // For read operations, use provider if no signer is available
    if (!signer) {
      console.log("Using provider for read-only operations");
      return new Contract(
        DOCUMENT_CONTRACT_ADDRESS,
        DocumentRegistryABI.abi,
        provider
      );
    }

    console.log("Using signer for contract operations");
    return new Contract(
      DOCUMENT_CONTRACT_ADDRESS,
      DocumentRegistryABI.abi,
      signer
    );
  }, [signer, provider]);

  const getDIDRegistryContract = useCallback(() => {
    // For read operations, use provider if no signer is available
    if (!signer && provider) {
      return new Contract(DID_CONTRACT_ADDRESS, DIDRegistryABI.abi, provider);
    }
    if (!signer) throw new Error("No provider or signer available");
    return new Contract(DID_CONTRACT_ADDRESS, DIDRegistryABI.abi, signer);
  }, [signer, provider]);

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

  const getAllDocuments = useCallback(async (): Promise<
    { document: Document; signatures: DocumentSignature[] }[]
  > => {
    if (!provider) {
      console.log("No provider available yet");
      return [];
    }

    try {
      const contract = getDocumentRegistryContract();

      const filter = {
        address: await contract.getAddress(),
        topics: [
          "0x56b1b6006a137d79a16380b47d350b1663d9c46a31a1ec0090f77f7a4327b130", // DocumentRegistered event
        ],
        fromBlock: 0,
        toBlock: "latest",
      };

      console.log(
        "Getting all documents from contract:",
        await contract.getAddress()
      );

      try {
        const logs = await provider.getLogs(filter);
        console.log("Found", logs.length, "document registration events");

        const documentPromises = logs.map(async (log) => {
          const documentId = log.topics[1];
          try {
            const document = await getDocument(documentId);
            const signatures = await getSignatures(documentId);
            return { document, signatures };
          } catch (err) {
            console.error(`Error fetching document ${documentId}:`, err);
            return null;
          }
        });

        const results = await Promise.all(documentPromises);
        return results.filter(
          (
            result
          ): result is {
            document: Document;
            signatures: DocumentSignature[];
          } => result !== null
        );
      } catch (err) {
        console.error("Error fetching logs:", err);
        return [];
      }
    } catch (error) {
      console.error("Error getting all documents:", error);
      return [];
    }
  }, [provider, getDocument, getSignatures, getDocumentRegistryContract]);

  const getDocumentsToSign = useCallback(
    async (address: string): Promise<Document[]> => {
      const contract = await getDocumentRegistryContract();
      const didContract = await getDIDRegistryContract();
      if (!contract || !provider || !address) {
        console.log("Missing dependencies:", {
          contract: !!contract,
          provider: !!provider,
          address,
        });
        return [];
      }

      try {
        // Get the user's DID if they have one
        const userDid = await didContract.getDIDByAddress(address);
        console.log("User DID:", userDid);
        console.log("User address:", address);

        console.log("Fetching documents to sign for address:", address);
        const allDocs = await getAllDocuments();
        console.log("Total documents found:", allDocs.length);

        const docsToSign = await Promise.all(
          allDocs.map(async (result) => {
            console.log("\nChecking document:", {
              id: result.document.id,
              type: result.document.documentType,
              status: result.document.status,
            });

            const requiredSigners = await getRequiredSigners(
              result.document.id
            );
            console.log("Required signers:", requiredSigners);

            const signatures = result.signatures;
            console.log("Existing signatures:", signatures);

            // Helper function to check if a value is an Ethereum address
            const isAddress = (value: string): boolean => {
              try {
                ethers.getAddress(value);
                return true;
              } catch {
                return false;
              }
            };

            // Check if either the address or DID is a required signer
            const isRequiredSigner = requiredSigners.some((signer) => {
              if (isAddress(signer)) {
                // If signer is an address, compare with user's address
                try {
                  return (
                    ethers.getAddress(signer) === ethers.getAddress(address)
                  );
                } catch {
                  return false;
                }
              } else {
                // If signer is a DID, compare with user's DID
                return userDid && signer === userDid;
              }
            });
            console.log("Is required signer:", isRequiredSigner);

            // Check if either the address or DID has already signed
            const hasSigned = signatures.some((sig) => {
              if (isAddress(sig.signerDid)) {
                // If signature is an address, compare with user's address
                try {
                  return (
                    ethers.getAddress(sig.signerDid) ===
                    ethers.getAddress(address)
                  );
                } catch {
                  return false;
                }
              } else {
                // If signature is a DID, compare with user's DID
                return userDid && sig.signerDid === userDid;
              }
            });
            console.log("Has already signed:", hasSigned);
            console.log("Document status:", result.document.status);

            if (
              isRequiredSigner &&
              !hasSigned &&
              formatDocumentStatus(result.document.status) !==
                DocumentStatus.REVOKED
            ) {
              console.log("Document requires signature from current user");
              return result.document;
            }
            console.log(
              "Document does not require signature from current user"
            );
            return null;
          })
        );

        const filteredDocs = docsToSign.filter(
          (doc): doc is Document => doc !== null
        );
        console.log(
          "Final documents requiring signature:",
          filteredDocs.length
        );
        return filteredDocs;
      } catch (error) {
        console.error("Error getting documents to sign:", error);
        return [];
      }
    },
    [
      provider,
      getDocumentRegistryContract,
      getDIDRegistryContract,
      getAllDocuments,
      getRequiredSigners,
      getSignatures,
    ]
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
        getAllDocuments,
        getDocumentsToSign,
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
