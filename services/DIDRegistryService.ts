import { ethers, BigNumber } from "ethers";
import {
  DIDRegistryInterface,
  DIDRegistryConfig,
  DIDDocument,
  Verification,
  VerificationLevel,
  DIDMetadata,
} from "../interfaces/DIDRegistry";

export class DIDRegistryService implements DIDRegistryInterface {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;
  private signer?: ethers.Signer;

  constructor(config: DIDRegistryConfig) {
    this.provider = config.provider;
    this.signer = config.signer;

    // Initialize contract instance
    this.contract = new ethers.Contract(
      config.contractAddress,
      [
        // Add your contract ABI here
      ],
      config.signer || config.provider
    );
  }

  // DID Management
  async createDID(identifiers: string[]): Promise<string> {
    const tx = await this.contract.createDID(identifiers);
    const receipt = await tx.wait();
    const event = receipt.events.find((e: any) => e.event === "DIDCreated");
    return event.args.didId;
  }

  async updateDID(didId: string, identifiers: string[]): Promise<void> {
    const tx = await this.contract.updateDID(didId, identifiers);
    await tx.wait();
  }

  async deactivateDID(didId: string): Promise<void> {
    const tx = await this.contract.deactivateDID(didId);
    await tx.wait();
  }

  // Verification Management
  async addVerification(
    didId: string,
    level: VerificationLevel,
    expiration: BigNumber,
    metadata: string
  ): Promise<void> {
    const tx = await this.contract.addVerification(
      didId,
      level,
      expiration,
      metadata
    );
    await tx.wait();
  }

  async revokeVerification(didId: string): Promise<void> {
    const tx = await this.contract.revokeVerification(didId);
    await tx.wait();
  }

  // Query Methods
  async isVerified(didId: string): Promise<boolean> {
    return this.contract.isVerified(didId);
  }

  async getVerification(
    didId: string,
    verifier: string
  ): Promise<Verification> {
    return this.contract.getVerification(didId, verifier);
  }

  async getDIDOwner(didId: string): Promise<string> {
    return this.contract.getDIDOwner(didId);
  }

  async getDIDIdentifiers(didId: string): Promise<string[]> {
    return this.contract.getDIDIdentifiers(didId);
  }

  async getDIDMetadata(didId: string): Promise<DIDMetadata> {
    return this.contract.getDIDMetadata(didId);
  }

  // Role Management
  async hasRole(role: string, account: string): Promise<boolean> {
    return this.contract.hasRole(role, account);
  }

  async grantRole(role: string, account: string): Promise<void> {
    const tx = await this.contract.grantRole(role, account);
    await tx.wait();
  }

  async revokeRole(role: string, account: string): Promise<void> {
    const tx = await this.contract.revokeRole(role, account);
    await tx.wait();
  }

  // System Management
  async pause(): Promise<void> {
    const tx = await this.contract.pause();
    await tx.wait();
  }

  async unpause(): Promise<void> {
    const tx = await this.contract.unpause();
    await tx.wait();
  }

  // Events
  on(event: string, listener: (...args: any[]) => void): void {
    this.contract.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.contract.off(event, listener);
  }

  // Helper Methods
  async connect(signer: ethers.Signer): void {
    this.signer = signer;
    this.contract = this.contract.connect(signer);
  }

  async disconnect(): void {
    this.signer = undefined;
    this.contract = this.contract.connect(this.provider);
  }

  getAddress(): string {
    return this.contract.address;
  }
}
