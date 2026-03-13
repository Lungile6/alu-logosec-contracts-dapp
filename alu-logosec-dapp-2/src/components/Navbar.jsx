import { shortenAddress } from "../utils/hash";

export default function Navbar({ wallet, navigate, currentPage }) {
  const { account, alutBalance, connect, disconnect, connecting, error } = wallet;

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate("home")}>
        <span>ALU</span><span className="dot">●</span><span>LogoSec</span>
      </div>

      <div className="navbar-links">
        {["home", "register", "verify", "dashboard"].map((p) => (
          <button
            key={p}
            className={currentPage === p ? "active" : ""}
            onClick={() => navigate(p)}
          >
            {{ home: "Home", register: "Register", verify: "Verify", dashboard: "Dashboard" }[p]}
          </button>
        ))}
      </div>

      <div className="navbar-wallet">
        {account ? (
          <>
            <div className="wallet-info">
              <span className="wallet-dot" />
              <span className="wallet-addr">{shortenAddress(account)}</span>
              <span className="wallet-balance">{parseFloat(alutBalance).toLocaleString()} ALUT</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={disconnect}>
              Disconnect
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={connect} disabled={connecting}>
            {connecting ? <span className="spinner" /> : null}
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}
