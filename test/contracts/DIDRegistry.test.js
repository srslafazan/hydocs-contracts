const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DIDRegistry", function () {
  let TestDIDRegistry;
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
    TestDIDRegistry = await ethers.getContractFactory("TestDIDRegistry");
    didRegistry = await TestDIDRegistry.deploy();
    await didRegistry.deployed();

    // Grant verifier role
    await didRegistry.grantRole(VERIFIER_ROLE, verifier.address);
  });

  // Helper function to create a DID and return its ID
  async function createDID(signer, email = "test@email.com") {
    const identifiers = [
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email)),
    ];
    const tx = await didRegistry.connect(signer).createDID(identifiers);
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === "DIDCreated");
    return event.args.didId;
  }

  describe("Role Management", function () {
    it("Should set up roles correctly on deployment", async function () {
      expect(await didRegistry.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await didRegistry.hasRole(VERIFIER_ROLE, verifier.address)).to.be
        .true;
    });

    it("Should allow admin to grant and revoke verifier role", async function () {
      await didRegistry.grantRole(VERIFIER_ROLE, user2.address);
      expect(await didRegistry.hasRole(VERIFIER_ROLE, user2.address)).to.be
        .true;

      await didRegistry.revokeRole(VERIFIER_ROLE, user2.address);
      expect(await didRegistry.hasRole(VERIFIER_ROLE, user2.address)).to.be
        .false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        didRegistry.connect(user1).grantRole(VERIFIER_ROLE, user2.address)
      ).to.be.revertedWith(
        "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });
  });

  describe("DID Creation", function () {
    it("Should create a DID with valid identifiers", async function () {
      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("+1234567890")),
      ];

      const tx = await didRegistry.connect(user1).createDID(identifiers);
      await expect(tx).to.emit(didRegistry, "DIDCreated");

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DIDCreated");
      const didId = event.args.didId;

      const metadata = await didRegistry.getDIDMetadata(didId);
      expect(metadata.active).to.be.true;
      expect(metadata.created).to.be.gt(0);
      expect(metadata.updated).to.equal(metadata.created);

      const storedIdentifiers = await didRegistry.getDIDIdentifiers(didId);
      expect(storedIdentifiers).to.have.lengthOf(2);
      expect(storedIdentifiers[0]).to.equal(identifiers[0]);
      expect(storedIdentifiers[1]).to.equal(identifiers[1]);
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
      didId = await createDID(user1, "initial@email.com");
    });

    it("Should update DID identifiers", async function () {
      const newIdentifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("new@email.com")),
      ];

      await expect(
        didRegistry.connect(user1).updateDID(didId, newIdentifiers)
      ).to.emit(didRegistry, "DIDUpdated");

      const storedIdentifiers = await didRegistry.getDIDIdentifiers(didId);
      expect(storedIdentifiers[0]).to.equal(newIdentifiers[0]);
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
      didId = await createDID(user1);
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
        "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      );
    });
  });

  describe("DID Creation and Management", function () {
    let identifiers;

    beforeEach(async function () {
      identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("+1234567890")),
      ];
    });

    it("Should create DID with correct metadata", async function () {
      const tx = await didRegistry.connect(user1).createDID(identifiers);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DIDCreated");
      const didId = event.args.didId;

      const metadata = await didRegistry.getDIDMetadata(didId);
      expect(metadata.active).to.be.true;
      expect(metadata.created).to.be.gt(0);
      expect(metadata.updated).to.equal(metadata.created);
    });

    it("Should return correct DID owner", async function () {
      const tx = await didRegistry.connect(user1).createDID(identifiers);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DIDCreated");
      const didId = event.args.didId;

      expect(await didRegistry.getDIDOwner(didId)).to.equal(user1.address);
    });

    it("Should return correct DID identifiers", async function () {
      const tx = await didRegistry.connect(user1).createDID(identifiers);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DIDCreated");
      const didId = event.args.didId;

      const storedIdentifiers = await didRegistry.getDIDIdentifiers(didId);
      expect(storedIdentifiers).to.deep.equal(identifiers);
    });

    it("Should deactivate DID correctly", async function () {
      const tx = await didRegistry.connect(user1).createDID(identifiers);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DIDCreated");
      const didId = event.args.didId;

      await didRegistry.connect(user1).deactivateDID(didId);
      const metadata = await didRegistry.getDIDMetadata(didId);
      expect(metadata.active).to.be.false;
    });

    it("Should not allow deactivating already inactive DID", async function () {
      const tx = await didRegistry.connect(user1).createDID(identifiers);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DIDCreated");
      const didId = event.args.didId;

      await didRegistry.connect(user1).deactivateDID(didId);
      await expect(
        didRegistry.connect(user1).deactivateDID(didId)
      ).to.be.revertedWith("DIDRegistry: DID already inactive");
    });
  });

  describe("Verification System", function () {
    let didId;
    let oneYearFromNow;

    beforeEach(async function () {
      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
      ];
      const tx = await didRegistry.connect(user1).createDID(identifiers);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DIDCreated");
      didId = event.args.didId;
      oneYearFromNow = (await time.latest()) + 365 * 24 * 60 * 60;
    });

    it("Should handle different verification levels", async function () {
      // Test ACCOUNT_VERIFICATION
      await didRegistry
        .connect(verifier)
        .addVerification(didId, 1, oneYearFromNow, "0x");
      let verification = await didRegistry.getVerification(
        didId,
        verifier.address
      );
      expect(verification.level).to.equal(1);

      // Test ID_VERIFICATION
      await didRegistry
        .connect(verifier)
        .addVerification(didId, 2, oneYearFromNow, "0x");
      verification = await didRegistry.getVerification(didId, verifier.address);
      expect(verification.level).to.equal(2);

      // Test KYC_VERIFICATION
      await didRegistry
        .connect(verifier)
        .addVerification(didId, 3, oneYearFromNow, "0x");
      verification = await didRegistry.getVerification(didId, verifier.address);
      expect(verification.level).to.equal(3);
    });

    it("Should not allow invalid verification levels", async function () {
      await expect(
        didRegistry
          .connect(verifier)
          .addVerification(didId, 4, oneYearFromNow, "0x")
      ).to.be.revertedWith("DIDRegistry: Invalid verification level");
    });

    it("Should not allow verification of inactive DID", async function () {
      await didRegistry.connect(user1).deactivateDID(didId);
      await expect(
        didRegistry
          .connect(verifier)
          .addVerification(didId, 1, oneYearFromNow, "0x")
      ).to.be.revertedWith("DIDRegistry: DID not active");
    });

    it("Should handle verification expiration correctly", async function () {
      const nearFuture = (await time.latest()) + 60; // 1 minute from now
      await didRegistry
        .connect(verifier)
        .addVerification(didId, 1, nearFuture, "0x");
      expect(await didRegistry.isVerified(didId)).to.be.true;

      await time.increase(120); // Increase time by 2 minutes
      expect(await didRegistry.isVerified(didId)).to.be.false;
    });

    it("Should store and retrieve verification metadata", async function () {
      const metadata = ethers.utils.defaultAbiCoder.encode(
        ["string", "uint256", "bool"],
        ["KYC Verified", 12345, true]
      );

      await didRegistry
        .connect(verifier)
        .addVerification(didId, 1, oneYearFromNow, metadata);
      const verification = await didRegistry.getVerification(
        didId,
        verifier.address
      );
      expect(verification.metadata).to.equal(metadata);
    });
  });

  describe("System State Management", function () {
    it("Should handle paused state correctly", async function () {
      const identifiers = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test@email.com")),
      ];

      await didRegistry.pause();
      await expect(
        didRegistry.connect(user1).createDID(identifiers)
      ).to.be.revertedWith("Pausable: paused");

      await expect(
        didRegistry
          .connect(verifier)
          .addVerification(
            ethers.constants.HashZero,
            1,
            (await time.latest()) + 3600,
            "0x"
          )
      ).to.be.revertedWith("Pausable: paused");

      await didRegistry.unpause();
      await expect(didRegistry.connect(user1).createDID(identifiers)).to.emit(
        didRegistry,
        "DIDCreated"
      );
    });

    it("Should maintain verifier set correctly", async function () {
      await didRegistry.grantRole(VERIFIER_ROLE, user2.address);
      expect(await didRegistry.hasRole(VERIFIER_ROLE, user2.address)).to.be
        .true;

      await didRegistry.revokeRole(VERIFIER_ROLE, user2.address);
      expect(await didRegistry.hasRole(VERIFIER_ROLE, user2.address)).to.be
        .false;

      // Verify original verifier still has role
      expect(await didRegistry.hasRole(VERIFIER_ROLE, verifier.address)).to.be
        .true;
    });
  });
});
