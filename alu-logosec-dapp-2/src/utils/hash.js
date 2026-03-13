/**
 * Compute the SHA-256 hash of a File object using the browser's Web Crypto API.
 * Returns a 0x-prefixed hex string formatted as bytes32.
 * No server involved – all hashing is done client-side.
 *
 * @param {File} file
 * @returns {Promise<string>} 0x-prefixed 64-char hex string
 */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}

/**
 * Compute the SHA-256 hash of a raw string (e.g., for testing).
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function hashString(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}

/**
 * Validate that a string is a valid bytes32 hash (0x + 64 hex chars).
 * @param {string} hash
 * @returns {boolean}
 */
export function isValidBytes32(hash) {
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * Shorten an Ethereum address for display: 0x1234...abcd
 * @param {string} address
 * @returns {string}
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a Unix timestamp to a readable date string.
 * @param {number|BigInt} timestamp
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleString();
}
