# ALU LogoSec dApp — Formative Assessment 2

A fully decentralized application (dApp) built on top of the Formative 1 smart contracts  
(`ALUAssetRegistry` ERC-721 and `ALULogoToken` ERC-20), giving any browser user a clean  
interface to register, verify, and manage ownership of the ALU official logo.

---

## Quick Start

### 1. Start the Hardhat node (from Formative 1 repo root)

```bash
npx hardhat node
```

### 2. Deploy contracts (if not already deployed)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Copy the printed contract addresses into `src/contracts/addresses.js`.

### 3. Install and run the dApp

```bash
cd alu-logosec-dapp
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Configure MetaMask

- Network: Localhost 8545 / Chain ID 31337
- Import a Hardhat test account private key to get test ETH

---

## Architecture

```
alu-logosec-dapp/
├── src/
│   ├── contracts/
│   │   ├── ALUAssetRegistry.json   # ERC-721 ABI
│   │   ├── ALULogoToken.json       # ERC-20 ABI
│   │   └── addresses.js            # Deployed addresses
│   ├── hooks/
│   │   └── useWallet.js            # Wallet connection + contract bindings
│   ├── utils/
│   │   └── hash.js                 # In-browser SHA-256 hashing (Web Crypto API)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── FileHasher.jsx          # Drag-and-drop + hash display
│   │   └── WalletGate.jsx          # Auth guard
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── RegisterPage.jsx        # Part B
│   │   ├── VerifyPage.jsx          # Part C
│   │   └── DashboardPage.jsx       # Part D
│   └── styles/global.css
├── test/
│   └── frontend-integration.test.js  # 5 new tests (Tests 9–13)
└── hardhat.config.js
```

---

## Technology Stack

| Layer | Tool |
|---|---|
| Frontend framework | React 18 + Vite |
| Web3 library | ethers.js v5 |
| Wallet connection | MetaMask (EIP-1193) |
| File hashing | Web Crypto API (`crypto.subtle.digest`) |
| Local blockchain | Hardhat (from Formative 1) |
| Styling | Custom CSS (no framework) |

---

## Part A — Report Answers

### What is an ABI?

An **ABI (Application Binary Interface)** is a JSON description of a smart contract's public  
functions, their input/output types, and events. The frontend needs it because the Ethereum  
blockchain only stores compiled bytecode — the ABI is the "translation key" that tells ethers.js  
how to encode function calls into binary and decode return values back into JavaScript types.  
Without the ABI, the frontend could not call `registerAsset()` or read `balanceOf()`.

### Read-only call vs. transaction

A **read-only call** (e.g., `balanceOf`, `verifyLogoIntegrity`) reads from the blockchain state  
without changing it. It requires no gas, no wallet signature, and executes instantly on a local  
node. A **transaction** (e.g., `registerAsset`, `distributeShares`) writes new state to the  
blockchain. It must be broadcast to the network, costs gas, and requires a wallet signature to  
prove the sender authorised the state change.

### Why does the user sign transactions?

The user signs with their wallet's private key to prove they authorise the transaction.  
If the application held private keys, any server compromise would drain all users' wallets.  
The browser wallet (MetaMask) keeps the private key locked in the user's browser, so only  
the user can approve writes to the chain. The dApp only constructs the transaction data —  
it never touches the private key.

---

## Part B — Report Answers

### Why hash in the browser?

Sending the logo file to a server would require trusting the server not to store, modify, or  
leak the file. In-browser hashing means the file bytes never leave the user's device. The  
SHA-256 hash is computed locally using the browser's native `crypto.subtle.digest()` API,  
then only that 32-byte fingerprint is sent on-chain. This is more private, more secure, and  
requires no backend infrastructure.

### What happens on a duplicate hash?

The `ALUAssetRegistry.registerAsset()` function uses a mapping (`registeredHashes`) to  
track which `bytes32` hashes have already been minted. If the incoming hash already exists  
in that mapping, the function reverts with a custom error (`HashAlreadyRegistered`).  
No token is minted, the transaction fails, and the user pays for the failed gas only.

### What is the user agreeing to when they sign?

They are authorising the transfer of a small amount of ETH (gas fee) from their wallet to  
the miners/validators, and authorising the smart contract to create a new NFT registered  
under their address. The wallet shows the function name, the gas estimate, and the contract  
address — the user can inspect all of this before confirming.

---

## Part C — Report Answers

### Why no wallet on the verify page?

`verifyLogoIntegrity()` is a `view` function — it only reads the `assets` mapping in the  
`ALUAssetRegistry` contract and compares two `bytes32` values. Because no state is written,  
no gas is consumed and no transaction is created. ethers.js can call it with a read-only  
`JsonRpcProvider` that points to the Hardhat node (or any public RPC). There is nothing  
for a wallet to sign.

### Real-world scenario

A design agency emails ALU's communications team what they claim is the official ALU logo.  
Before publishing it on a campaign website, a communications officer drags the file into  
the Verify page, clicks Verify, and instantly sees a green "Logo Verified" result. They can  
trust this because the hash they computed in their browser matches the hash that was  
written immutably to the Ethereum blockchain when ALU originally registered the logo.  
No central authority (like ALU IT) needs to be called; the blockchain is the source of truth.

### Why trust the result?

The dApp computes the hash locally in the user's browser — it never sends the file anywhere.  
The resulting hash is compared against what was written to a public, immutable blockchain  
by ALU's authorised wallet. The smart contract address is public and auditable. A fake dApp  
could display a false result, but anyone can verify the same hash directly on-chain using  
block explorers or the contract's public ABI. The dApp is a convenient front-end, not the  
sole source of truth.

---

## Part D — Report Answers

### How does `onlyOwner` protect `distributeShares`?

The `onlyOwner` modifier (from OpenZeppelin's `Ownable`) checks  
`require(msg.sender == owner(), "Ownable: caller is not the owner")` before executing the  
function body. If any wallet other than the deployer calls `distributeShares()`, the EVM  
reverts the entire transaction immediately — no tokens move and no gas is wasted on state  
changes. The revert is enforced at the contract level, so the frontend restriction is only  
for UX; security is guaranteed by the contract itself.

### Who at ALU receives ALUT tokens?

A concrete example: the Head of Brand at ALU might receive 100,000 ALUT tokens  
(10% of supply), representing their team's stewardship of the logo. Holding these tokens  
means they have an on-chain record of their custodianship. In a future governance system,  
they could use those tokens to vote on approved logo variants, approve third-party usage  
requests, or authorise updates to the registered hash when the logo is redesigned.

### What would need to change for voting?

The `ALULogoToken` contract would need to inherit OpenZeppelin's `ERC20Votes` extension  
instead of plain `ERC20`. This adds `delegate()` (so holders opt into voting), `getVotes()`,  
and snapshot checkpointing. A separate `Governor` contract (e.g., `GovernorBravo`) would  
then read token balances at a proposal snapshot block and allow holders to vote `for`,  
`against`, or `abstain` on proposals, with voting weight proportional to their ALUT balance.

---

## Running Tests

```bash
# All tests (Formative 1 + new integration tests)
npx hardhat test

# Integration tests only
npx hardhat test test/frontend-integration.test.js
```

Tests 1–8 are from Formative 1. Tests 9–13 are the five new frontend integration tests.
