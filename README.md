# DID Registry

A decentralized identity management system built on Ethereum, allowing users to create, manage, and verify digital identities.

## Prerequisites

- Node.js (v16 or later)
- pnpm
- MetaMask browser extension

## Project Structure

```
.
├── contracts/           # Smart contracts
├── test/               # Contract tests
├── scripts/            # Deployment scripts
└── did-registry-ui/    # Next.js frontend
```

## Local Development Setup

### 1. Install Dependencies

```bash
# Install contract dependencies
pnpm install

# Install UI dependencies
cd did-registry-ui
pnpm install
cd ..  # Return to root directory
```

### 2. Start Local Blockchain

In a terminal, start the Hardhat node:

```bash
pnpm hardhat node
```

This will start a local Ethereum node and provide you with a list of test accounts. Keep this terminal running.

### 3. Deploy the Contract

In a new terminal, first compile the contracts:

```bash
pnpm hardhat compile
```

Then deploy to your local network:

```bash
pnpm hardhat run scripts/deploy.js --network localhost
```

This will:

- Deploy the DIDRegistry contract
- Grant the verifier role to the deployer account
- Create a `.env.local` file in the `did-registry-ui` directory with the contract address

Verify that the `.env.local` file was created in the `did-registry-ui` directory and contains a valid contract address:

```bash
cat did-registry-ui/.env.local
# Should show: NEXT_PUBLIC_DID_CONTRACT_ADDRESS=0x...
```

If the file wasn't created or the address is missing, create it manually:

```bash
echo "NEXT_PUBLIC_DID_CONTRACT_ADDRESS=your_contract_address" > did-registry-ui/.env.local
```

### 4. Configure MetaMask

1. Open MetaMask and add the local network:

   - Network Name: `Localhost`
   - New RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import the first test account (deployer/verifier):

   - Click "Import Account"
   - Enter the private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has both admin and verifier roles

3. Ensure you're connected to the Localhost network in MetaMask

### 5. Start the Frontend

```bash
cd did-registry-ui
pnpm dev
```

Visit `http://localhost:3000` to use the application.

### Troubleshooting

If you encounter issues:

1. **Contract Address Error**:

   - Make sure the contract is deployed successfully
   - Check that `.env.local` exists in the `did-registry-ui` directory
   - Verify the contract address format in `.env.local`
   - Try redeploying the contract

2. **MetaMask Connection Issues**:

   - Ensure MetaMask is connected to Localhost network
   - Reset your account in MetaMask (Settings > Advanced > Reset Account)
   - Make sure the Hardhat node is running

3. **General Issues**:
   - Clear your browser cache
   - Restart the Hardhat node
   - Redeploy the contract
   - Restart the Next.js development server

## Smart Contract Features

The DIDRegistry contract provides:

- DID creation and management
- Identity verification system
- Role-based access control
- Pausable functionality
- Reentrancy protection

### Key Functions

- `createDID(bytes32[] identifiers)`: Create a new DID
- `updateDID(bytes32 didId, bytes32[] identifiers)`: Update DID identifiers
- `addVerification(bytes32 didId, uint256 level, uint256 expiration, bytes metadata)`: Add verification to a DID
- `revokeVerification(bytes32 didId)`: Revoke verification

## Testing

Run the test suite:

```bash
pnpm test
```

Watch mode for development:

```bash
pnpm test:watch
```

## Contract Deployment

To deploy to other networks:

1. Add network configuration to `hardhat.config.js`
2. Add network URL and private key to environment variables
3. Run deployment:
   ```bash
   pnpm hardhat run scripts/deploy.js --network <network-name>
   ```

## Security Considerations

- All identifiers are hashed before storage
- Role-based access control for verifications
- Pausable in case of emergencies
- Protected against reentrancy attacks
- Events emitted for all important state changes

## License

MIT
