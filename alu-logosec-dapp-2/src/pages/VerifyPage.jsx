import { useState } from "react";
import { ethers } from "ethers";
import FileHasher from "../components/FileHasher";
import { isValidBytes32, formatTimestamp, shortenAddress } from "../utils/hash";
import ALUAssetRegistryABI from "../contracts/ALUAssetRegistry.json";
import { CONTRACT_ADDRESSES, HARDHAT_RPC_URL } from "../contracts/addresses";

// Read-only provider — no wallet needed
function getReadOnlyContract() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(HARDHAT_RPC_URL);
    return new ethers.Contract(
      CONTRACT_ADDRESSES.ALUAssetRegistry,
      ALUAssetRegistryABI.abi,
      provider
    );
  } catch {
    return null;
  }
}

export default function VerifyPage({ wallet }) {
  const [tab, setTab] = useState("file"); // "file" | "hash"
  const [hash, setHash] = useState("");
  const [pastedHash, setPastedHash] = useState("");
  const [tokenId, setTokenId] = useState("1");
  const [result, setResult] = useState(null); // { verified, details }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = async (h) => {
    const finalHash = h || (tab === "file" ? hash : pastedHash);
    if (!isValidBytes32(finalHash)) {
      setError("Invalid hash format. Must be 0x followed by 64 hex characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use connected wallet if available, else read-only
      const contract = wallet.signer
        ? wallet.registryContract(wallet.signer)
        : getReadOnlyContract();

      if (!contract) throw new Error("Could not connect to blockchain. Make sure Hardhat is running.");

      const id = parseInt(tokenId);
      // Formative 1 contract returns: (bool, string)
      const [verified, _message] = await contract.verifyLogoIntegrity(id, finalHash);

      let details = null;
      if (verified) {
        // Formative 1 contract exposes getAsset(uint256) returning a struct
        const asset = await contract.getAsset(id);
        details = {
          assetName: asset.name,
          fileType: asset.fileType,
          registeredBy: asset.registeredBy,
          registrationDate: formatTimestamp(asset.timestamp),
          contentHash: asset.contentHash,
        };
      }

      setResult({ verified, details });
    } catch (err) {
      setError(err?.reason || err?.message || "Verification failed. Check the token ID and hash.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Verify Logo Authenticity</h1>
        <p className="page-subtitle">
          Anyone can verify a logo file against the blockchain record. No wallet required.
        </p>
        <div style={{ marginTop: "0.75rem" }}>
          <span className="badge badge-success">✓ No wallet needed</span>
        </div>
      </div>

      <div className="stack">
        {/* Tab selector */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn ${tab === "file" ? "btn-primary" : "btn-outline"} btn-sm`}
            onClick={() => { setTab("file"); setResult(null); }}
          >
            📁 Upload File
          </button>
          <button
            className={`btn ${tab === "hash" ? "btn-primary" : "btn-outline"} btn-sm`}
            onClick={() => { setTab("hash"); setResult(null); }}
          >
            # Paste Hash
          </button>
        </div>

        <div className="card">
          <div className="card-title">
            {tab === "file" ? "Upload Logo for Verification" : "Paste Hash for Verification"}
          </div>

          <div className="stack">
            {tab === "file" ? (
              <FileHasher
                onHash={(h) => { setHash(h); setResult(null); }}
                label="Upload logo to verify"
              />
            ) : (
              <div className="form-group">
                <label className="form-label">SHA-256 Hash (bytes32)</label>
                <input
                  className="form-input mono"
                  value={pastedHash}
                  onChange={(e) => { setPastedHash(e.target.value); setResult(null); }}
                  placeholder="0x..."
                  style={{ fontSize: "0.78rem" }}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Token ID to Check Against</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                style={{ maxWidth: "120px" }}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button
              className="btn btn-primary"
              onClick={() => verify()}
              disabled={loading || (!hash && !pastedHash)}
            >
              {loading ? <span className="spinner" /> : "🔍"}
              {loading ? "Verifying…" : "Verify on Blockchain"}
            </button>
          </div>
        </div>

        {result && (
          <div className={`verify-result ${result.verified ? "verified" : "failed"}`}>
            <div className="verify-icon">{result.verified ? "✅" : "❌"}</div>
            <div className="verify-headline" style={{ color: result.verified ? "var(--accent)" : "var(--danger)" }}>
              {result.verified
                ? "Logo Verified: This is the authentic ALU logo"
                : "Warning: This logo does not match the registered record"}
            </div>
            <div className="verify-detail">
              {result.verified
                ? "The file you uploaded matches the hash recorded on the ALU blockchain."
                : "The uploaded file's hash does not match the registered logo. It may have been modified or is not the official ALU logo."}
            </div>

            {result.verified && result.details && (
              <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
                <hr className="divider" />
                <div className="stack-sm">
                  <InfoRow label="Asset Name" value={result.details.assetName} />
                  <InfoRow label="File Type" value={result.details.fileType} />
                  <InfoRow
                    label="Registered By"
                    value={shortenAddress(result.details.registeredBy)}
                    mono
                  />
                  <InfoRow label="Registration Date" value={result.details.registrationDate} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: "0.78rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
      <span className={mono ? "mono" : ""} style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>{value}</span>
    </div>
  );
}
