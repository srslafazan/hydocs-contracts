// Contract addresses from environment variables
export const DOCUMENT_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_DOCUMENT_CONTRACT_ADDRESS as `0x${string}`;
export const DID_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_DID_CONTRACT_ADDRESS as `0x${string}`;

// Supported chains
export const SUPPORTED_CHAINS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  HARDHAT: 31337,
} as const;

// Chain names
export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.MAINNET]: "Ethereum Mainnet",
  [SUPPORTED_CHAINS.SEPOLIA]: "Sepolia Testnet",
  [SUPPORTED_CHAINS.HARDHAT]: "Hardhat Local",
} as const;
