# ALU LogoSec — Full Project (Formative 1 + Formative 2)

This repository contains a complete decentralized application (dApp) for **registering**, **verifying**, and **tokenizing ownership shares** of the official **African Leadership University (ALU) logo**.

- **Backend (on-chain)**: Solidity smart contracts (Hardhat)
  - `ALUAssetRegistry` (ERC-721): registers a logo file fingerprint (SHA-256 hash) as an NFT and stores metadata.
  - `ALULogoToken` (ERC-20): mints **1,000,000 ALUT** tokens to the owner and allows the owner to distribute shares.
- **Frontend (browser dApp)**: React + Vite + ethers.js
  - Wallet connection (MetaMask / EIP-1193)
  - In-browser SHA-256 hashing (Web Crypto API)
  - Public verification page (no wallet required)
  - Token dashboard + owner-only distribution

---

## Project structure

```
Assignment2/
├── alu_LogoSec_Project/          # Hardhat + Solidity (Formative 1) + tests
└── alu-logosec-dapp-2/           # React/Vite frontend (Formative 2)
```

---

## Prerequisites

- Node.js + npm
- MetaMask (or another EIP-1193 compatible wallet)

---

## Quick start (local Hardhat)

### 1) Install dependencies

```bash
cd "Assignment2/alu_LogoSec_Project"
npm install

cd "../alu-logosec-dapp-2"
npm install
```

### 2) Start the local blockchain

```bash
cd "Assignment2/alu_LogoSec_Project"
npx hardhat node
```

Keep this terminal running.

### 3) Deploy contracts + auto-export addresses/ABIs to the frontend

In a new terminal:

```bash
cd "Assignment2/alu_LogoSec_Project"
npx hardhat run scripts/deploy.js --network localhost
```

This automatically writes the latest frontend contract config to:
- `alu-logosec-dapp-2/src/contracts/addresses.js`
- `alu-logosec-dapp-2/src/contracts/ALUAssetRegistry.json`
- `alu-logosec-dapp-2/src/contracts/ALULogoToken.json`

### 4) Run the frontend

```bash
cd "Assignment2/alu-logosec-dapp-2"
npm run dev
```

Open the printed Vite URL (typically `http://localhost:5173`).

---

## MetaMask setup (local testing)

- **Network**: Localhost 8545
- **Chain ID**: 31337
- Import any Hardhat account private key shown in the `hardhat node` terminal to get test ETH.

---

## Features mapped to assignment requirements

### Part A — Wallet connection + contract integration

- **Connect Wallet button**: visible in the UI navigation.
- **Wallet support**: MetaMask (EIP-1193).
- **Display connected address**: shortened (e.g. `0x1234...abcd`).
- **Display ALUT balance**: read from `ALULogoToken.balanceOf()`.
- **Handles missing wallet**: shows a helpful message when `window.ethereum` is not available.
- **Network switching**: expects Hardhat `31337` and reacts to chain/account changes.

### Part B — Upload + hashing + registration

- **File upload**: user selects or drags an image.
- **In-browser SHA-256**: computed with the Web Crypto API (`crypto.subtle.digest`).
- **Hash displayed**: formatted as `bytes32` (`0x` + 64 hex chars).
- **Asset registration**: calls:
  - `ALUAssetRegistry.registerAsset(name, fileType, contentHash)`
- **Duplicate protection**: contract reverts if a hash is already registered.

### Part C — Public logo verification page

No wallet is required because verification is a **read-only** blockchain call.

- **Verify by file**: upload → hash in browser → call:
  - `ALUAssetRegistry.verifyLogoIntegrity(tokenId, providedHash)`
- **Verify by pasted hash**: paste `bytes32` → verify
- **Clear UX**: shows a strong success/failure result and displays stored metadata when authentic.

### Part D — Token distribution dashboard

- Reads from `ALULogoToken`:
  - total supply
  - connected wallet balance
  - `ownershipPercentage(account)`
- Owner-only form calls:
  - `distributeShares(recipient, amount)`

**Note on units**: `distributeShares()` takes a whole-token amount and multiplies by \(10^{18}\) inside the contract.

---

## Tests

All tests are in the Hardhat project:

```bash
cd "Assignment2/alu_LogoSec_Project"
npm test
```

- **Tests 1–8**: Formative 1 contract tests
- **Tests 9–13**: required Formative 2 “frontend integration” tests (implemented in the same test file)

---

## Report questions (short answers)

### What is an ABI and why does the frontend need it?

An **ABI (Application Binary Interface)** is a JSON description of a contract’s callable functions/events and their types. The frontend needs it so libraries like ethers.js can **encode** function calls and **decode** return values when interacting with the contract.

### Read-only call vs transaction

- **Read-only call** (`view`/`pure`): reads state, **no gas**, **no signature** (e.g., `balanceOf`, `verifyLogoIntegrity`, `getAsset`).
- **Transaction**: writes state, **costs gas**, requires a **wallet signature** (e.g., `registerAsset`, `distributeShares`).

### Why must users sign transactions in their wallet?

Because the wallet controls the user’s private key. Signing proves the user authorizes a state change. The dApp should never hold private keys—this is critical for user security.

### Why hash in the browser rather than upload to a server?

It preserves privacy (file bytes never leave the device), prevents server-side tampering, and removes the need for any backend. Only the **32-byte fingerprint** is shared on-chain.

### What happens if a hash is already registered?

`registerAsset()` checks a mapping (`hashExists`) and **reverts** if the hash already exists, so no NFT is minted and the transaction fails.

### Why does the verify page not require a wallet?

Verification uses a **read-only** contract call. Since no state changes occur, it costs **no gas** and needs **no signature**.

### How does `onlyOwner` protect `distributeShares()`?

`onlyOwner` reverts the call at the contract level if `msg.sender` is not the owner. Even if a UI tried to call it, the blockchain enforces the restriction.

### Example real-world usage

A student or partner receives a logo file in an email and wants to confirm it’s official. They upload it to the Verify page and get an immediate authentic/fake result backed by an immutable on-chain hash.

### What would change to support token-holder voting?

Add governance support (e.g., OpenZeppelin `ERC20Votes` + a `Governor` contract) so votes are counted proportional to token holdings at a snapshot block.

---

## Notes

- The deployment script in `alu_LogoSec_Project/scripts/deploy.js` also **exports** the latest ABIs and deployed addresses into the frontend so the UI stays in sync.

