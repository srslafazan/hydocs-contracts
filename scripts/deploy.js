const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const TestDIDRegistry = await hre.ethers.getContractFactory(
    "TestDIDRegistry"
  );
  const didRegistry = await TestDIDRegistry.deploy();
  await didRegistry.deployed();

  console.log("DIDRegistry deployed to:", didRegistry.address);

  // Add a verifier role for testing
  const verifierRole = hre.ethers.utils.keccak256(
    hre.ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
  );
  await didRegistry.grantRole(verifierRole, deployer.address);
  console.log("Granted verifier role to deployer");

  // Write the contract address to a file that Next.js can read
  const fs = require("fs");
  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${didRegistry.address}\n`;
  fs.writeFileSync(".env.local", envContent);
  console.log("Contract address written to .env.local");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
