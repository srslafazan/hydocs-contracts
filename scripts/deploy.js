const hre = require("hardhat");
const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy DIDRegistry
  console.log("\nDeploying DIDRegistry...");
  const TestDIDRegistry = await hre.ethers.getContractFactory(
    "TestDIDRegistry"
  );
  const didRegistry = await TestDIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didRegistryAddress = await didRegistry.getAddress();
  console.log("DIDRegistry deployed to:", didRegistryAddress);

  // Initialize DIDRegistry
  console.log("Initializing DIDRegistry...");
  await didRegistry.initialize();
  console.log("DIDRegistry initialized");

  // Deploy DocumentRegistry
  console.log("\nDeploying DocumentRegistry...");
  const TestDocumentRegistry = await hre.ethers.getContractFactory(
    "TestDocumentRegistry"
  );
  const documentRegistry = await TestDocumentRegistry.deploy();
  await documentRegistry.waitForDeployment();
  const documentRegistryAddress = await documentRegistry.getAddress();
  console.log("DocumentRegistry deployed to:", documentRegistryAddress);

  // Initialize DocumentRegistry with DIDRegistry address
  console.log("Initializing DocumentRegistry...");
  await documentRegistry.initialize(didRegistryAddress);
  console.log("DocumentRegistry initialized");

  // Add roles for testing
  console.log("\nSetting up roles...");
  const VERIFIER_ROLE = ethers.id("VERIFIER_ROLE");
  const DOCUMENT_MANAGER_ROLE = ethers.id("DOCUMENT_MANAGER_ROLE");

  // Grant roles to deployer
  await didRegistry.grantRole(VERIFIER_ROLE, deployer.address);
  await documentRegistry.grantRole(DOCUMENT_MANAGER_ROLE, deployer.address);
  console.log("Roles granted to deployer");

  // Write contract addresses to environment file
  console.log("\nWriting contract addresses to .env.local...");
  const envContent = `NEXT_PUBLIC_DID_CONTRACT_ADDRESS=${didRegistryAddress}
NEXT_PUBLIC_DOCUMENT_CONTRACT_ADDRESS=${documentRegistryAddress}\n`;
  fs.writeFileSync(".env.local", envContent);
  console.log("Contract addresses written to .env.local");

  console.log("\nDeployment complete!");
  console.log("-------------------");
  console.log("DIDRegistry:", didRegistryAddress);
  console.log("DocumentRegistry:", documentRegistryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
