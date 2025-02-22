import { ethers, run } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Deploy DID Registry
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  console.log("DIDRegistry deployed to:", await didRegistry.getAddress());

  // Deploy Document Registry
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.waitForDeployment();
  console.log(
    "DocumentRegistry deployed to:",
    await documentRegistry.getAddress()
  );

  // Initialize Document Registry with DID Registry address
  await documentRegistry.initialize(await didRegistry.getAddress());
  console.log("DocumentRegistry initialized with DIDRegistry");

  // Verify contracts on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contracts on Etherscan...");
    try {
      await run("verify:verify", {
        address: await didRegistry.getAddress(),
        constructorArguments: [],
      });
      await run("verify:verify", {
        address: await documentRegistry.getAddress(),
        constructorArguments: [],
      });
      console.log("Contracts verified on Etherscan");
    } catch (error) {
      console.error("Error verifying contracts:", error);
    }
  }

  // Output the addresses for use in the frontend
  console.log("\nContract Addresses for Frontend Environment Variables:");
  console.log(
    "NEXT_PUBLIC_DOCUMENT_CONTRACT_ADDRESS=",
    await documentRegistry.getAddress()
  );
  console.log(
    "NEXT_PUBLIC_DID_CONTRACT_ADDRESS=",
    await didRegistry.getAddress()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
