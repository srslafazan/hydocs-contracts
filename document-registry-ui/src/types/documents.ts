export enum DocumentType {
  GENERAL = "GENERAL",
  CONTRACT = "CONTRACT",
  CERTIFICATE = "CERTIFICATE",
  LICENSE = "LICENSE",
  IDENTITY = "IDENTITY",
}

export enum DocumentStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export interface Document {
  id: string;
  contentHash: string;
  documentType: DocumentType;
  owner: string;
  did: string;
  createdAt: number;
  expiresAt: number;
  status: DocumentStatus;
  metadata: string;
  version: number;
}

export interface DocumentSignature {
  signerDid: string;
  timestamp: number;
  signatureType: string;
  metadata: string;
}

export enum SignatureType {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  ACKNOWLEDGE = "ACKNOWLEDGE",
}
