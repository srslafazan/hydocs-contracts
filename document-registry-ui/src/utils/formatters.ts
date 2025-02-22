import { ethers } from "ethers";

// Helper function to format hash values
export const formatHash = (hash: string): string => {
  try {
    // If it's a bytes32 hex string, try to convert it to UTF-8
    if (hash.startsWith("0x")) {
      // First try to decode as UTF-8
      try {
        const decoded = ethers.toUtf8String(hash).trim().replace(/\0/g, "");
        if (decoded && /^[\x20-\x7E]*$/.test(decoded)) {
          return decoded;
        }
      } catch {
        // If UTF-8 decoding fails, show truncated hex
        return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
      }
    }
    return hash;
  } catch (err) {
    console.error("Error formatting hash:", err);
    return hash;
  }
};

// Helper function to format document type
export const formatDocumentType = (typeHash: string): string => {
  // Map of known document type hashes to their string values
  const documentTypeMap: { [key: string]: string } = {
    [ethers.id("GENERAL")]: "GENERAL",
    [ethers.id("CONTRACT")]: "CONTRACT",
    [ethers.id("CERTIFICATE")]: "CERTIFICATE",
    [ethers.id("LICENSE")]: "LICENSE",
    [ethers.id("IDENTITY")]: "IDENTITY",
  };

  return documentTypeMap[typeHash] || "Unknown";
};

// Helper function to format document status
export const formatDocumentStatus = (statusHash: string): string => {
  // Map of known status hashes to their string values
  const statusMap: { [key: string]: string } = {
    [ethers.id("ACTIVE")]: "ACTIVE",
    [ethers.id("EXPIRED")]: "EXPIRED",
    [ethers.id("REVOKED")]: "REVOKED",
  };

  return statusMap[statusHash] || "Unknown";
};
