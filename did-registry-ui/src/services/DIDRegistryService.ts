import { ethers, BigNumber } from "ethers";
import {
  DIDRegistryInterface,
  DIDRegistryConfig,
  DIDDocument,
  Verification,
  VerificationLevel,
  DIDMetadata,
} from "../types/DIDRegistry";

const DID_REGISTRY_ABI = {
  abi: [
    // Role constants
    "function VERIFIER_ROLE() external view returns (bytes32)",
    "function ADMIN_ROLE() external view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",

    // DID Management
    "function createDID(bytes32[] calldata identifiers) external returns (bytes32)",
    "function updateDID(bytes32 didId, bytes32[] calldata identifiers) external",
    "function deactivateDID(bytes32 didId) external",

    // Verification Management
    "function addVerification(bytes32 didId, uint256 level, uint256 expiration, bytes calldata metadata) external",
    "function revokeVerification(bytes32 didId) external",

    // Query Methods
    "function isVerified(bytes32 didId) external view returns (bool)",
    "function getVerification(bytes32 didId, address verifier) external view returns (tuple(address verifier, uint256 level, uint256 timestamp, uint256 expiration, bytes32 status, bytes metadata))",
    "function getDIDOwner(bytes32 didId) external view returns (address)",
    "function getDIDIdentifiers(bytes32 didId) external view returns (bytes32[] memory)",
    "function getDIDMetadata(bytes32 didId) external view returns (uint256 created, uint256 updated, bool active)",

    // Role Management
    "function hasRole(bytes32 role, address account) external view returns (bool)",
    "function grantRole(bytes32 role, address account) external",
    "function revokeRole(bytes32 role, address account) external",

    // System Management
    "function pause() external",
    "function unpause() external",

    // Events
    {
      type: "event",
      name: "DIDCreated",
      inputs: [
        {
          type: "bytes32",
          name: "didId",
          indexed: true,
        },
        {
          type: "address",
          name: "owner",
          indexed: true,
        },
      ],
    },
    {
      type: "event",
      name: "DIDUpdated",
      inputs: [
        {
          type: "bytes32",
          name: "didId",
          indexed: true,
        },
      ],
    },
    {
      type: "event",
      name: "VerificationAdded",
      inputs: [
        {
          type: "bytes32",
          name: "didId",
          indexed: true,
        },
        {
          type: "address",
          name: "verifier",
          indexed: true,
        },
      ],
    },
    {
      type: "event",
      name: "VerificationRevoked",
      inputs: [
        {
          type: "bytes32",
          name: "didId",
          indexed: true,
        },
        {
          type: "address",
          name: "verifier",
          indexed: true,
        },
      ],
    },
  ],
};

export class DIDRegistryService implements DIDRegistryInterface {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;
  protected _signer?: ethers.Signer;
  private verifierRole?: string;
  private interface: ethers.utils.Interface;

  constructor(config: DIDRegistryConfig) {
    this.provider = config.provider;
    this._signer = config.signer;

    // Create interface for parsing events
    this.interface = new ethers.utils.Interface(DID_REGISTRY_ABI.abi);

    // Initialize contract instance
    this.contract = new ethers.Contract(
      config.contractAddress,
      this.interface,
      config.signer || config.provider
    );

    // Initialize verifier role
    this.initializeRoles().catch(console.error);
  }

  private async initializeRoles() {
    try {
      this.verifierRole = await this.contract.VERIFIER_ROLE();
    } catch (error) {
      console.error("Failed to initialize roles:", error);
    }
  }

  get signer(): ethers.Signer | undefined {
    return this._signer;
  }

  // DID Management
  async createDID(identifiers: string[]): Promise<string> {
    try {
      // Convert string identifiers to bytes32 using keccak256 hash
      const bytes32Identifiers = identifiers.map((id) =>
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(id))
      );

      console.log("Converted identifiers:", bytes32Identifiers);

      const tx = await this.contract.createDID(bytes32Identifiers);
      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);

      // Parse logs using the interface
      const logs = receipt.logs
        .map((log: ethers.providers.Log) => {
          try {
            return this.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      console.log("Parsed logs:", logs);

      const didCreatedLog = logs.find(
        (log: ethers.utils.LogDescription | null) => log?.name === "DIDCreated"
      );
      console.log("DIDCreated log:", didCreatedLog);

      if (!didCreatedLog) {
        throw new Error("DID creation event not found in transaction receipt");
      }

      const didId = didCreatedLog.args.didId;
      console.log("Found DID:", didId);
      return didId;
    } catch (error: any) {
      console.error("Create DID error:", error);
      if (error.message.includes("user rejected")) {
        throw new Error("Transaction was rejected by the user");
      }
      throw new Error(`Failed to create DID: ${error.message}`);
    }
  }

  async updateDID(didId: string, identifiers: string[]): Promise<void> {
    try {
      // Convert string identifiers to bytes32 using keccak256 hash
      const bytes32Identifiers = identifiers.map((id) =>
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(id))
      );

      const tx = await this.contract.updateDID(didId, bytes32Identifiers);
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to update DID: ${error.message}`);
    }
  }

  async deactivateDID(didId: string): Promise<void> {
    try {
      const tx = await this.contract.deactivateDID(didId);
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to deactivate DID: ${error.message}`);
    }
  }

  // Verification Management
  async addVerification(
    didId: string,
    level: VerificationLevel,
    expiration: number | BigNumber,
    metadata: string
  ): Promise<void> {
    try {
      const expirationBN = BigNumber.isBigNumber(expiration)
        ? expiration
        : BigNumber.from(expiration);

      const tx = await this.contract.addVerification(
        didId,
        level,
        expirationBN,
        metadata
      );
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to add verification: ${error.message}`);
    }
  }

  async revokeVerification(didId: string): Promise<void> {
    try {
      const tx = await this.contract.revokeVerification(didId);
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to revoke verification: ${error.message}`);
    }
  }

  // Query Methods
  async isVerified(didId: string): Promise<boolean> {
    try {
      return await this.contract.isVerified(didId);
    } catch (error: any) {
      throw new Error(`Failed to check verification status: ${error.message}`);
    }
  }

  async getVerification(
    didId: string,
    verifier: string
  ): Promise<Verification> {
    try {
      return await this.contract.getVerification(didId, verifier);
    } catch (error: any) {
      throw new Error(`Failed to get verification: ${error.message}`);
    }
  }

  async getDIDOwner(didId: string): Promise<string> {
    try {
      return await this.contract.getDIDOwner(didId);
    } catch (error: any) {
      throw new Error(`Failed to get DID owner: ${error.message}`);
    }
  }

  async getDIDIdentifiers(didId: string): Promise<string[]> {
    try {
      return await this.contract.getDIDIdentifiers(didId);
    } catch (error: any) {
      throw new Error(`Failed to get DID identifiers: ${error.message}`);
    }
  }

  async getDIDMetadata(didId: string): Promise<DIDMetadata> {
    try {
      return await this.contract.getDIDMetadata(didId);
    } catch (error: any) {
      throw new Error(`Failed to get DID metadata: ${error.message}`);
    }
  }

  // Role Management
  async hasRole(role: string, account: string): Promise<boolean> {
    try {
      if (!this.verifierRole) {
        await this.initializeRoles();
      }
      return await this.contract.hasRole(role, account);
    } catch (error: any) {
      console.error("Error checking role:", error);
      return false;
    }
  }

  async grantRole(role: string, account: string): Promise<void> {
    try {
      const tx = await this.contract.grantRole(role, account);
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to grant role: ${error.message}`);
    }
  }

  async revokeRole(role: string, account: string): Promise<void> {
    try {
      const tx = await this.contract.revokeRole(role, account);
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to revoke role: ${error.message}`);
    }
  }

  // System Management
  async pause(): Promise<void> {
    try {
      const tx = await this.contract.pause();
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to pause contract: ${error.message}`);
    }
  }

  async unpause(): Promise<void> {
    try {
      const tx = await this.contract.unpause();
      await tx.wait();
    } catch (error: any) {
      throw new Error(`Failed to unpause contract: ${error.message}`);
    }
  }

  // Events
  on(event: string, listener: (...args: any[]) => void): void {
    this.contract.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.contract.off(event, listener);
  }

  // Helper Methods
  async connect(signer: ethers.Signer): Promise<void> {
    this._signer = signer;
    this.contract = this.contract.connect(signer);
  }

  async disconnect(): Promise<void> {
    this._signer = undefined;
    this.contract = this.contract.connect(this.provider);
  }

  getAddress(): string {
    return this.contract.address;
  }

  // Additional helper methods
  async getDIDByOwner(ownerAddress: string): Promise<string | null> {
    try {
      // Get all DIDCreated events for this owner
      const filter = this.contract.filters.DIDCreated(null, ownerAddress);
      const events = await this.contract.queryFilter(filter);

      // If no events found, return null
      if (events.length === 0) {
        return null;
      }

      // Get the most recent DID
      const latestEvent = events[events.length - 1];
      const didId = latestEvent.args.didId;

      // Verify the DID is still owned by this address
      const currentOwner = await this.getDIDOwner(didId);
      return currentOwner.toLowerCase() === ownerAddress.toLowerCase()
        ? didId
        : null;
    } catch (error) {
      console.error("Error getting DID by owner:", error);
      return null;
    }
  }
}
