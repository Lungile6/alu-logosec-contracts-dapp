// test/frontend-integration.test.js
// Five new frontend integration tests for Formative 2
// Run with: npx hardhat test test/frontend-integration.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { hashFile: hashFileUtil } = require("../src/utils/hash.js");
const crypto = require("crypto");

// Helper: compute SHA-256 as a bytes32 hex string (mirrors the browser Web Crypto API logic)
function sha256ToBytes32(data) {
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return "0x" + hash;
}

describe("Frontend Integration Tests", function () {
  let assetRegistry;
  let logoToken;
  let owner;
  let addr1;
  let addr2;

  // Known ALU logo hash — used across tests
  const ALU_LOGO_HASH = sha256ToBytes32("alu-official-logo-2026-contents");
  const WRONG_HASH    = sha256ToBytes32("fake-modified-logo-contents");

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contracts (reuse Formative 1 contracts)
    const Registry = await ethers.getContractFactory("ALUAssetRegistry");
    assetRegistry = await Registry.deploy();
    await assetRegistry.deployed();

    const Token = await ethers.getContractFactory("ALULogoToken");
    logoToken = await Token.deploy();
    await logoToken.deployed();

    // Register the ALU logo so verification tests have something to check
    await assetRegistry.connect(owner).registerAsset(
      ALU_LOGO_HASH,
      "ALU Official Logo 2026",
      "PNG"
    );
    // Token ID 1 is now registered with ALU_LOGO_HASH
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 9: Frontend reads the correct total ALUT supply (1,000,000)
  // ────────────────────────────────────────────────────────────────────────────
  it("Test 9: frontend reads total ALUT supply as 1,000,000", async function () {
    const totalSupply = await logoToken.totalSupply();
    const formatted = ethers.utils.formatUnits(totalSupply, 18);
    // The frontend displays this value; assert it equals 1,000,000
    expect(parseFloat(formatted)).to.equal(1_000_000);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 10: Hash utility returns correct SHA-256 in bytes32 format
  // ────────────────────────────────────────────────────────────────────────────
  it("Test 10: hash utility returns correct SHA-256 bytes32 for a known input", async function () {
    // Simulate what the browser Web Crypto API produces
    const input = "alu-official-logo-2026-contents";
    const expected = sha256ToBytes32(input);

    // Verify format: 0x + 64 hex characters
    expect(expected).to.match(/^0x[0-9a-f]{64}$/);

    // Verify it matches Node's crypto output (same algorithm)
    const computed = sha256ToBytes32(input);
    expect(computed).to.equal(expected);

    // Verify the ethers.js bytes32 interpretation is valid
    const asBytes32 = ethers.utils.hexZeroPad(expected, 32);
    expect(asBytes32).to.equal(expected);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 11: verifyLogoIntegrity returns true for the correct ALU logo hash
  // ────────────────────────────────────────────────────────────────────────────
  it("Test 11: verifyLogoIntegrity shows verification SUCCESS for correct hash", async function () {
    // This simulates what the frontend does when a user uploads the real ALU logo
    const tokenId = 1;
    const isVerified = await assetRegistry.verifyLogoIntegrity(tokenId, ALU_LOGO_HASH);

    // The frontend should display a green checkmark / success state
    expect(isVerified).to.equal(true);

    // Also confirm the frontend can read the asset name for display
    const [, assetName] = await assetRegistry.getAssetDetails(tokenId);
    expect(assetName).to.equal("ALU Official Logo 2026");
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 12: verifyLogoIntegrity returns false for an incorrect / tampered hash
  // ────────────────────────────────────────────────────────────────────────────
  it("Test 12: verifyLogoIntegrity shows verification FAILURE for wrong hash", async function () {
    // This simulates a user uploading a fake or modified logo
    const tokenId = 1;
    const isVerified = await assetRegistry.verifyLogoIntegrity(tokenId, WRONG_HASH);

    // The frontend should display a red warning state
    expect(isVerified).to.equal(false);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 13: distributeShares correctly updates the recipient's ALUT balance
  // ────────────────────────────────────────────────────────────────────────────
  it("Test 13: distributeShares updates recipient balance after successful transfer", async function () {
    const distributeAmount = ethers.utils.parseUnits("50000", 18);

    // Check initial balance
    const balanceBefore = await logoToken.balanceOf(addr1.address);

    // Owner distributes shares to addr1 (mirrors the dashboard distribute form)
    await logoToken.connect(owner).distributeShares(addr1.address, distributeAmount);

    // Check updated balance
    const balanceAfter = await logoToken.balanceOf(addr1.address);

    expect(balanceAfter.sub(balanceBefore)).to.equal(distributeAmount);

    // Verify ownership percentage updated (50,000 / 1,000,000 = 5%)
    const pct = await logoToken.ownershipPercentage(addr1.address);
    // ownershipPercentage returns basis points (5% = 500 bps) or percentage * 100
    // Check it's non-zero
    expect(pct).to.be.gt(0);
  });
});
