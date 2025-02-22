import { BigNumber } from "ethers";

export interface DIDDocument {
  id: string;
  owner: string;
  identifiers: string[];
  created: BigNumber;
  updated: BigNumber;
  active: boolean;
}

export interface Verification {
  verifier: string;
  level: number;
  timestamp: BigNumber;
  expiration: BigNumber;
  status: string;
  metadata: string;
}

export interface DIDMetadata {
  created: BigNumber;
  updated: BigNumber;
  active: boolean;
}

export enum VerificationLevel {
  BASIC = 1,
  ENHANCED = 2,
  PREMIUM = 3,
}

export interface DIDRegistryInterface {
  // DID Management
  createDID(identifiers: string[]): Promise<string>;
  updateDID(didId: string, identifiers: string[]): Promise<void>;
  deactivateDID(didId: string): Promise<void>;

  // Verification Management
  addVerification(
    didId: string,
    level: VerificationLevel,
    expiration: BigNumber,
    metadata: string
  ): Promise<void>;
  revokeVerification(didId: string): Promise<void>;

  // Query Methods
  isVerified(didId: string): Promise<boolean>;
  getVerification(didId: string, verifier: string): Promise<Verification>;
  getDIDOwner(didId: string): Promise<string>;
  getDIDIdentifiers(didId: string): Promise<string[]>;
  getDIDMetadata(didId: string): Promise<DIDMetadata>;

  // Role Management
  hasRole(role: string, account: string): Promise<boolean>;
  grantRole(role: string, account: string): Promise<void>;
  revokeRole(role: string, account: string): Promise<void>;

  // System Management
  pause(): Promise<void>;
  unpause(): Promise<void>;

  // Events
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
}

// Contract Events
export interface DIDCreatedEvent {
  didId: string;
  owner: string;
}

export interface DIDUpdatedEvent {
  didId: string;
}

export interface VerificationAddedEvent {
  didId: string;
  verifier: string;
}

export interface VerificationRevokedEvent {
  didId: string;
  verifier: string;
}

// Helper Types
export interface DIDRegistryConfig {
  contractAddress: string;
  provider: any; // ethers.providers.Provider
  signer?: any; // ethers.Signer
}

// UI State Types
export interface DIDState {
  loading: boolean;
  error: string | null;
  did: DIDDocument | null;
  verifications: Verification[];
}

export interface VerifierState {
  isVerifier: boolean;
  pendingVerifications: string[];
}
