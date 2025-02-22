const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DocumentRegistry", function () {
  let documentRegistry;
  let didRegistry;
  let owner;
  let verifier;
  let user1;
  let user2;
  let user3;

  // Test constants
  const VERIFIER_ROLE = ethers.id("VERIFIER_ROLE");
  const DEFAULT_ADMIN_ROLE = ethers.id("DEFAULT_ADMIN_ROLE");
  const DOCUMENT_MANAGER_ROLE = ethers.id("DOCUMENT_MANAGER_ROLE");

  // Document status constants
  const ACTIVE = ethers.id("ACTIVE");
  const REVOKED = ethers.id("REVOKED");
  const EXPIRED = ethers.id("EXPIRED");

  // Document type constants
  const TYPE_GENERAL = ethers.id("GENERAL");
  const TYPE_LEGAL = ethers.id("LEGAL");
  const TYPE_FINANCIAL = ethers.id("FINANCIAL");
  const TYPE_IDENTITY = ethers.id("IDENTITY");

  // Signature type constants
  const SIGNATURE_APPROVE = ethers.id("APPROVE");
  const SIGNATURE_REJECT = ethers.id("REJECT");
  const SIGNATURE_ACKNOWLEDGE = ethers.id("ACKNOWLEDGE");

  beforeEach(async function () {
    [owner, verifier, user1, user2, user3] = await ethers.getSigners();

    // Deploy DID Registry
    const TestDIDRegistry = await ethers.getContractFactory("TestDIDRegistry");
    didRegistry = await TestDIDRegistry.deploy();
    await didRegistry.waitForDeployment();
    await didRegistry.initialize();

    // Deploy Document Registry
    const TestDocumentRegistry = await ethers.getContractFactory(
      "TestDocumentRegistry"
    );
    documentRegistry = await TestDocumentRegistry.deploy();
    await documentRegistry.waitForDeployment();
    await documentRegistry.initialize(await didRegistry.getAddress());

    // Create DIDs for testing
    const tx1 = await didRegistry
      .connect(user1)
      .createDID([ethers.id("user1@test.com")]);
    const receipt1 = await tx1.wait();
    const event1 = await receipt1.logs.find(
      (log) => log.fragment && log.fragment.name === "DIDCreated"
    );
    this.user1Did = event1.args.didId;

    const tx2 = await didRegistry
      .connect(user2)
      .createDID([ethers.id("user2@test.com")]);
    const receipt2 = await tx2.wait();
    const event2 = await receipt2.logs.find(
      (log) => log.fragment && log.fragment.name === "DIDCreated"
    );
    this.user2Did = event2.args.didId;

    const tx3 = await didRegistry
      .connect(user3)
      .createDID([ethers.id("user3@test.com")]);
    const receipt3 = await tx3.wait();
    const event3 = await receipt3.logs.find(
      (log) => log.fragment && log.fragment.name === "DIDCreated"
    );
    this.user3Did = event3.args.didId;

    // Create DID for owner
    const ownerTx = await didRegistry
      .connect(owner)
      .createDID([ethers.id("owner@test.com")]);
    const ownerReceipt = await ownerTx.wait();
    const ownerEvent = await ownerReceipt.logs.find(
      (log) => log.fragment && log.fragment.name === "DIDCreated"
    );
    this.ownerDid = ownerEvent.args.didId;
  });

  describe("Initialization", function () {
    it("Should set the correct DID registry address", async function () {
      expect(await documentRegistry.didRegistry()).to.equal(
        await didRegistry.getAddress()
      );
    });

    it("Should grant admin and document manager roles to deployer", async function () {
      expect(await documentRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address))
        .to.be.true;
      expect(await documentRegistry.hasRole(ADMIN_ROLE, owner.address)).to.be
        .true;
      expect(
        await documentRegistry.hasRole(DOCUMENT_MANAGER_ROLE, owner.address)
      ).to.be.true;
    });
  });

  describe("Document Registration", function () {
    let contentHash;
    let documentType;
    let expiresAt;
    let metadata;
    let requiredSigners;

    beforeEach(async function () {
      contentHash = ethers.id("test document content");
      documentType = TYPE_GENERAL;
      expiresAt = (await time.latest()) + 365 * 24 * 60 * 60; // 1 year from now
      metadata = JSON.stringify({
        title: "Test Document",
        description: "Test description",
      });
      requiredSigners = [];
    });

    it("Should register a document successfully", async function () {
      const tx = await documentRegistry
        .connect(user1)
        .registerDocument(
          contentHash,
          documentType,
          expiresAt,
          metadata,
          requiredSigners
        );

      const receipt = await tx.wait();
      const event = await receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DocumentRegistered"
      );
      expect(event).to.not.be.undefined;

      const documentId = event.args.documentId;
      const document = await documentRegistry.documents(documentId);

      expect(document.contentHash).to.equal(contentHash);
      expect(document.documentType).to.equal(documentType);
      expect(document.owner).to.equal(user1.address);
      expect(document.expiresAt).to.equal(expiresAt);
      expect(document.status).to.equal(ACTIVE);
      expect(document.metadata).to.equal(metadata);
      expect(document.version).to.equal(1);
    });

    it("Should fail to register a document without a DID", async function () {
      const noDidUser = (await ethers.getSigners())[5];
      await expect(
        documentRegistry
          .connect(noDidUser)
          .registerDocument(
            contentHash,
            documentType,
            expiresAt,
            metadata,
            requiredSigners
          )
      ).to.be.revertedWith("Owner must have an active DID");
    });

    it("Should register a document with required signers", async function () {
      requiredSigners = [this.user2Did.toString(), this.user3Did.toString()];

      const tx = await documentRegistry
        .connect(user1)
        .registerDocument(
          contentHash,
          documentType,
          expiresAt,
          metadata,
          requiredSigners
        );

      const receipt = await tx.wait();
      const event = await receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DocumentRegistered"
      );
      const documentId = event.args.documentId;

      const storedSigners = await documentRegistry.getRequiredSigners(
        documentId
      );
      expect(storedSigners).to.deep.equal(requiredSigners);
    });
  });

  describe("Document Signing", function () {
    let documentId;
    let contentHash;

    beforeEach(async function () {
      contentHash = ethers.id("test document content");
      requiredSigners = [this.user2Did.toString(), this.user3Did.toString()];

      const tx = await documentRegistry
        .connect(user1)
        .registerDocument(
          contentHash,
          TYPE_GENERAL,
          (await time.latest()) + 365 * 24 * 60 * 60,
          "{}",
          requiredSigners
        );

      const receipt = await tx.wait();
      const event = await receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DocumentRegistered"
      );
      documentId = event.args.documentId;
    });

    it("Should allow required signers to sign the document", async function () {
      const signatureMetadata = JSON.stringify({ comment: "Approved" });

      const tx = await documentRegistry
        .connect(user2)
        .signDocument(documentId, SIGNATURE_APPROVE, signatureMetadata);

      const receipt = await tx.wait();
      const event = await receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DocumentSigned"
      );
      expect(event).to.not.be.undefined;

      const signatures = await documentRegistry.getSignatures(documentId);
      expect(signatures.length).to.equal(1);
      expect(signatures[0].signatureType).to.equal(SIGNATURE_APPROVE);
      expect(signatures[0].metadata).to.equal(signatureMetadata);
    });

    it("Should track signature status correctly", async function () {
      await documentRegistry
        .connect(user2)
        .signDocument(documentId, SIGNATURE_APPROVE, "{}");
      expect(await documentRegistry.hasAllRequiredSignatures(documentId)).to.be
        .false;

      await documentRegistry
        .connect(user3)
        .signDocument(documentId, SIGNATURE_APPROVE, "{}");
      expect(await documentRegistry.hasAllRequiredSignatures(documentId)).to.be
        .true;
    });

    it("Should not allow signing expired documents", async function () {
      // Create document that expires soon
      const shortExpiryTx = await documentRegistry
        .connect(user1)
        .registerDocument(
          contentHash,
          TYPE_GENERAL,
          (await time.latest()) + 60, // 1 minute from now
          "{}",
          [this.user2Did.toString()]
        );
      const shortExpiryReceipt = await shortExpiryTx.wait();
      const shortExpiryEvent = await shortExpiryReceipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DocumentRegistered"
      );
      const shortExpiryDoc = shortExpiryEvent.args.documentId;

      // Wait for expiration
      await time.increase(120);

      await expect(
        documentRegistry
          .connect(user2)
          .signDocument(shortExpiryDoc, SIGNATURE_APPROVE, "{}")
      ).to.be.revertedWith("DocumentRegistry: Document has expired");
    });
  });

  describe("Document Management", function () {
    let documentId;

    beforeEach(async function () {
      const tx = await documentRegistry
        .connect(user1)
        .registerDocument(
          ethers.id("test content"),
          TYPE_GENERAL,
          (await time.latest()) + 365 * 24 * 60 * 60,
          "{}",
          []
        );
      documentId = (await tx.wait()).events.find(
        (e) => e.event === "DocumentRegistered"
      ).args.documentId;
    });

    it("Should allow owner to update metadata", async function () {
      const newMetadata = JSON.stringify({ title: "Updated Title" });
      await documentRegistry
        .connect(user1)
        .updateMetadata(documentId, newMetadata);

      const document = await documentRegistry.documents(documentId);
      expect(document.metadata).to.equal(newMetadata);
      expect(document.version).to.equal(2);
    });

    it("Should allow owner to revoke document", async function () {
      const tx = await documentRegistry
        .connect(user1)
        .revokeDocument(documentId);
      const receipt = await tx.wait();
      const event = receipt.events.find(
        (e) => e.event === "DocumentStatusChanged"
      );

      expect(event.args.oldStatus).to.equal(ACTIVE);
      expect(event.args.newStatus).to.equal(REVOKED);

      const document = await documentRegistry.documents(documentId);
      expect(document.status).to.equal(REVOKED);
    });

    it("Should allow admin to revoke document", async function () {
      const tx = await documentRegistry
        .connect(owner)
        .revokeDocument(documentId);
      const receipt = await tx.wait();
      const event = receipt.events.find(
        (e) => e.event === "DocumentStatusChanged"
      );

      expect(event.args.oldStatus).to.equal(ACTIVE);
      expect(event.args.newStatus).to.equal(REVOKED);
    });

    it("Should not allow non-owner/non-admin to revoke document", async function () {
      await expect(
        documentRegistry.connect(user2).revokeDocument(documentId)
      ).to.be.revertedWith("DocumentRegistry: Not authorized");
    });

    it("Should not allow metadata updates on revoked documents", async function () {
      await documentRegistry.connect(user1).revokeDocument(documentId);
      await expect(
        documentRegistry.connect(user1).updateMetadata(documentId, "{}")
      ).to.be.revertedWith("DocumentRegistry: Document is not active");
    });
  });

  describe("System Management", function () {
    it("Should allow admin to pause and unpause the contract", async function () {
      await documentRegistry.connect(owner).pause();
      expect(await documentRegistry.paused()).to.be.true;

      await documentRegistry.connect(owner).unpause();
      expect(await documentRegistry.paused()).to.be.false;
    });

    it("Should not allow document registration when paused", async function () {
      await documentRegistry.connect(owner).pause();

      await expect(
        documentRegistry
          .connect(user1)
          .registerDocument(ethers.id("test"), TYPE_GENERAL, 0, "{}", [])
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
