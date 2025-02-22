import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { DocumentRegistry, DIDRegistry } from "../typechain-types";

describe("DocumentRegistry", function () {
  let documentRegistry: DocumentRegistry;
  let didRegistry: DIDRegistry;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy DID Registry
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment();

    // Deploy Document Registry
    const DocumentRegistry = await ethers.getContractFactory(
      "DocumentRegistry"
    );
    documentRegistry = await DocumentRegistry.deploy();
    await documentRegistry.waitForDeployment();
    await documentRegistry.initialize(await didRegistry.getAddress());

    // Create DIDs for testing
    await didRegistry.connect(user1).createDID([ethers.id("user1")]);
    await didRegistry.connect(user2).createDID([ethers.id("user2")]);
  });

  describe("Timestamp Indexing", function () {
    it("should correctly filter documents by time range", async function () {
      // Create documents at different times
      const contentHash = ethers.id("content");
      const documentType = ethers.id("GENERAL");
      const metadata = "test metadata";
      const noSigners: string[] = [];

      // Document 1
      const tx1 = await documentRegistry.connect(user1).registerDocument(
        contentHash,
        documentType,
        0, // no expiration
        metadata,
        noSigners
      );
      const timestamp1 = (await ethers.provider.getBlock(tx1.blockNumber!))!
        .timestamp;

      // Advance time by 1 day
      await time.increase(86400);

      // Document 2
      const tx2 = await documentRegistry
        .connect(user1)
        .registerDocument(contentHash, documentType, 0, metadata, noSigners);
      const timestamp2 = (await ethers.provider.getBlock(tx2.blockNumber!))!
        .timestamp;

      // Advance time by 1 day
      await time.increase(86400);

      // Document 3
      const tx3 = await documentRegistry
        .connect(user1)
        .registerDocument(contentHash, documentType, 0, metadata, noSigners);
      const timestamp3 = (await ethers.provider.getBlock(tx3.blockNumber!))!
        .timestamp;

      // Get documents from first day only
      const filter1 = documentRegistry.filters.DocumentRegistered(
        null,
        null,
        null,
        user1.address,
        null,
        timestamp1
      );
      const events1 = await documentRegistry.queryFilter(filter1);
      expect(events1.length).to.equal(1);

      // Get documents from first two days
      const filter2 = documentRegistry.filters.DocumentRegistered(
        null,
        null,
        null,
        user1.address,
        null,
        null
      );
      const events2 = await documentRegistry.queryFilter(filter2);
      const filteredEvents2 = events2.filter(
        (e) => e.args.createdAt <= timestamp2
      );
      expect(filteredEvents2.length).to.equal(2);

      // Get all documents
      const filter3 = documentRegistry.filters.DocumentRegistered(
        null,
        null,
        null,
        user1.address,
        null,
        null
      );
      const events3 = await documentRegistry.queryFilter(filter3);
      expect(events3.length).to.equal(3);

      // Verify timestamps are in order
      const timestamps = events3.map((e) => Number(e.args.createdAt));
      expect(timestamps).to.deep.equal(
        [timestamp3, timestamp2, timestamp1].sort()
      );
    });
  });
});
