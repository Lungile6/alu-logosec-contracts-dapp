import { useState } from "react";
import { ethers } from "ethers";
import WalletGate from "../components/WalletGate";
import FileHasher from "../components/FileHasher";

export default function RegisterPage({ wallet }) {
  const [hash, setHash] = useState("");
  const [assetName, setAssetName] = useState("");
  const [fileType, setFileType] = useState("PNG");
  const [status, setStatus] = useState(null); // { type, message }
  const [loading, setLoading] = useState(false);
  const [tokenId, setTokenId] = useState(null);

  const handleHash = (h) => {
    setHash(h);
    setStatus(null);
    setTokenId(null);
  };

  const handleRegister = async () => {
    if (!hash || !assetName || !fileType) {
      setStatus({ type: "error", message: "Please fill in all fields and upload a file first." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const contract = wallet.registryContract(wallet.signer);
      // Formative 1 contract signature:
      // registerAsset(string name, string fileType, bytes32 contentHash)
      const tx = await contract.registerAsset(assetName, fileType, hash);
      setStatus({ type: "info", message: "Transaction submitted. Waiting for confirmation…" });

      const receipt = await tx.wait();

      // Parse tokenId from AssetRegistered event
      let id = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === "AssetRegistered") {
            id = parsed.args.tokenId.toString();
            break;
          }
        } catch {}
      }

      setTokenId(id);
      setStatus({
        type: "success",
        message: `Asset registered successfully! Token ID: ${id ?? "check your wallet"}`,
      });
      await wallet.refreshBalance();
    } catch (err) {
      const msg = err?.reason || err?.message || "Transaction failed";
      if (msg.includes("already registered") || msg.includes("duplicate")) {
        setStatus({ type: "error", message: "⚠ This logo hash has already been registered on-chain. Duplicate rejected." });
      } else if (msg.includes("user rejected")) {
        setStatus({ type: "warn", message: "Transaction cancelled by user." });
      } else {
        setStatus({ type: "error", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Register Logo Asset</h1>
        <p className="page-subtitle">
          Upload the ALU logo to hash it and record its fingerprint on-chain as an ERC-721 token.
        </p>
      </div>

      <WalletGate wallet={wallet} message="Connect your wallet to register assets">
        <div className="stack">
          {/* Step 1 */}
          <div className="card">
            <div className="card-title">Step 1 — Upload &amp; Hash</div>
            <FileHasher onHash={handleHash} label="Upload ALU Logo File" />
          </div>

          {/* Step 2 */}
          <div className="card">
            <div className="card-title">Step 2 — Asset Details</div>
            <div className="stack">
              <div className="form-group">
                <label className="form-label">Content Hash (bytes32)</label>
                <input
                  className="form-input mono"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="0x... auto-filled after upload"
                  style={{ fontSize: "0.78rem" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input
                  className="form-input"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. ALU Official Logo 2026"
                />
              </div>

              <div className="form-group">
                <label className="form-label">File Type</label>
                <select
                  className="form-input"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                >
                  {["PNG", "JPG", "SVG", "WebP", "PDF"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {status && (
                <div className={`alert alert-${
                  status.type === "success" ? "success"
                  : status.type === "error" ? "error"
                  : status.type === "warn" ? "warn"
                  : "info"
                }`}>
                  {status.message}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleRegister}
                disabled={loading || !hash || !assetName}
              >
                {loading ? <span className="spinner" /> : "📋"}
                {loading ? "Registering…" : "Register on Blockchain"}
              </button>

              <div className="alert alert-info" style={{ fontSize: "0.8rem" }}>
                💡 Clicking Register will open your wallet for confirmation. You will pay a small gas fee on the Hardhat network.
              </div>
            </div>
          </div>

          {tokenId && (
            <div className="card" style={{ borderColor: "rgba(0,229,160,0.3)" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "2rem" }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Registration Complete</div>
                  <div style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
                    The ALU logo has been permanently recorded on-chain.
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <span className="badge badge-success">Token ID: {tokenId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </WalletGate>
    </div>
  );
}
