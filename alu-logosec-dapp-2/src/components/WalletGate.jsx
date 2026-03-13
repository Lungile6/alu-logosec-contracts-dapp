export default function WalletGate({ wallet, children, message }) {
  const { account, connect, connecting, error } = wallet;

  if (error === "no_wallet") {
    return (
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.5rem" }}>🦊</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>No Web3 Wallet Detected</div>
            <div style={{ color: "var(--text-2)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
              You need a Web3 wallet to use this feature. Install MetaMask or another compatible wallet.
            </div>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
            >
              Install MetaMask ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔐</div>
        <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>
          {message || "Wallet Connection Required"}
        </div>
        <div style={{ color: "var(--text-2)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          Connect your Web3 wallet to access this feature.
        </div>
        <button className="btn btn-primary" onClick={connect} disabled={connecting}>
          {connecting ? <span className="spinner" /> : null}
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

  return children;
}
