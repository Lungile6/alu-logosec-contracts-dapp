export default function HomePage({ navigate, wallet }) {
  const features = [
    {
      icon: "📋",
      title: "Register Logo",
      desc: "Upload the ALU logo and record its SHA-256 fingerprint permanently on-chain as an ERC-721 NFT.",
      page: "register",
      requiresWallet: true,
    },
    {
      icon: "🔍",
      title: "Verify Authenticity",
      desc: "Check any logo file against the blockchain record. No wallet needed — open to everyone.",
      page: "verify",
      requiresWallet: false,
    },
    {
      icon: "📊",
      title: "Token Dashboard",
      desc: "View ALUT ownership percentages and distribute shares to stakeholders (owner only).",
      page: "dashboard",
      requiresWallet: true,
    },
  ];

  return (
    <>
      <div className="hero">
        <div className="hero-tag">
          <span className="badge badge-success">● Live on Hardhat</span>
        </div>
        <h1 className="hero-title">
          Protect the <span>ALU Logo</span><br />with Blockchain
        </h1>
        <p className="hero-desc">
          ALU LogoSec is a decentralized application that uses smart contracts to register,
          verify, and manage ownership of the African Leadership University official logo.
        </p>
        <div className="hero-ctas">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("verify")}>
            🔍 Verify a Logo
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => wallet.account ? navigate("register") : wallet.connect()}
          >
            {wallet.account ? "📋 Register Asset" : "Connect Wallet"}
          </button>
        </div>
      </div>

      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.page} className="feature-card" onClick={() => navigate(f.page)}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
            {f.requiresWallet && (
              <div style={{ marginTop: "0.75rem" }}>
                <span className="badge badge-neutral">Wallet required</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
