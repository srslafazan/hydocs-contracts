const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DIDRegistry", function () {
  let DIDRegistry;
  let didRegistry;
  let owner;
  let verifier;
  let user1;
  let user2;

  // Constants
  const VERIFIER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
  );
  const ADMIN_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("ADMIN_ROLE")
  );
  const ACTIVE_STATUS = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("ACTIVE")
  );
  const REVOKED_STATUS = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("REVOKED")
  );

  beforeEach(async function () {
    // Get signers
    [owner, verifier, user1, user2] = await ethers.getSigners();

    // Deploy contract
    DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();
    await didRegistry.deployed();

    // Grant verifier role
    await didRegistry.grantRole(VERIFIER_ROLE, verifier.address);
  });

  describe("DID Creation", function () {
    it("Should create a DID with valid identifiers", async function () {
      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("+1234567890")),
      ];

      await expect(didRegistry.connect(user1).createDID(identifiers)).to.emit(
        didRegistry,
        "DIDCreated"
      );

      const didId = await getDIDForAddress(user1.address);
      const did = await didRegistry.getDID(didId);

      expect(did.owner).to.equal(user1.address);
      expect(did.active).to.be.true;
      expect(did.identifiers).to.have.lengthOf(2);
      expect(did.identifiers[0]).to.equal(identifiers[0]);
    });

    it("Should not allow creating multiple DIDs for same address", async function () {
      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
      ];

      await didRegistry.connect(user1).createDID(identifiers);

      await expect(
        didRegistry.connect(user1).createDID(identifiers)
      ).to.be.revertedWith("DIDRegistry: Address already has a DID");
    });

    it("Should not allow creating DID with empty identifiers", async function () {
      await expect(didRegistry.connect(user1).createDID([])).to.be.revertedWith(
        "DIDRegistry: No identifiers provided"
      );
    });
  });

  describe("DID Updates", function () {
    let didId;

    beforeEach(async function () {
      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("initial@email.com")),
      ];
      await didRegistry.connect(user1).createDID(identifiers);
      didId = await getDIDForAddress(user1.address);
    });

    it("Should update DID identifiers", async function () {
      const newIdentifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("new@email.com")),
      ];

      await expect(
        didRegistry.connect(user1).updateDID(didId, newIdentifiers)
      ).to.emit(didRegistry, "DIDUpdated");

      const did = await didRegistry.getDID(didId);
      expect(did.identifiers[0]).to.equal(newIdentifiers[0]);
    });

    it("Should not allow non-owner to update DID", async function () {
      const newIdentifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("new@email.com")),
      ];

      await expect(
        didRegistry.connect(user2).updateDID(didId, newIdentifiers)
      ).to.be.revertedWith("DIDRegistry: Not DID owner");
    });
  });

  describe("Verification Management", function () {
    let didId;

    beforeEach(async function () {
      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
      ];
      await didRegistry.connect(user1).createDID(identifiers);
      didId = await getDIDForAddress(user1.address);
    });

    it("Should add verification by authorized verifier", async function () {
      const oneYearFromNow = (await time.latest()) + 365 * 24 * 60 * 60;
      const metadata = ethers.utils.defaultAbiCoder.encode(
        ["string"],
        ["Verified via KYC"]
      );

      await expect(
        didRegistry.connect(verifier).addVerification(
          didId,
          1, // BASIC_VERIFICATION
          oneYearFromNow,
          metadata
        )
      ).to.emit(didRegistry, "VerificationAdded");

      const verification = await didRegistry.getVerification(
        didId,
        verifier.address
      );
      expect(verification.verifier).to.equal(verifier.address);
      expect(verification.level).to.equal(1);
      expect(verification.status).to.equal(ACTIVE_STATUS);
    });

    it("Should not allow unauthorized verifier", async function () {
      const oneYearFromNow = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        didRegistry
          .connect(user2)
          .addVerification(didId, 1, oneYearFromNow, "0x")
      ).to.be.revertedWith("DIDRegistry: Not a verifier");
    });

    it("Should revoke verification", async function () {
      const oneYearFromNow = (await time.latest()) + 365 * 24 * 60 * 60;

      await didRegistry
        .connect(verifier)
        .addVerification(didId, 1, oneYearFromNow, "0x");

      await expect(
        didRegistry.connect(verifier).revokeVerification(didId)
      ).to.emit(didRegistry, "VerificationRevoked");

      const verification = await didRegistry.getVerification(
        didId,
        verifier.address
      );
      expect(verification.status).to.equal(REVOKED_STATUS);
    });

    it("Should check verification status correctly", async function () {
      const oneYearFromNow = (await time.latest()) + 365 * 24 * 60 * 60;

      // Initially unverified
      expect(await didRegistry.isVerified(didId)).to.be.false;

      // Add verification
      await didRegistry
        .connect(verifier)
        .addVerification(didId, 1, oneYearFromNow, "0x");
      expect(await didRegistry.isVerified(didId)).to.be.true;

      // Revoke verification
      await didRegistry.connect(verifier).revokeVerification(didId);
      expect(await didRegistry.isVerified(didId)).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to pause and unpause", async function () {
      await expect(didRegistry.pause()).to.emit(didRegistry, "Paused");

      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
      ];
      await expect(
        didRegistry.connect(user1).createDID(identifiers)
      ).to.be.revertedWith("Pausable: paused");

      await expect(didRegistry.unpause()).to.emit(didRegistry, "Unpaused");

      await expect(didRegistry.connect(user1).createDID(identifiers)).to.emit(
        didRegistry,
        "DIDCreated"
      );
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(didRegistry.connect(user1).pause()).to.be.revertedWith(
        "AccessControl:"
      );
    });
  });

  // Helper function to get DID for an address
  async function getDIDForAddress(address) {
    const identifiers = [
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
    ];
    const tx = await didRegistry.connect(user1).createDID(identifiers);
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "DIDCreated");
    return event.args.didId;
  }
});
