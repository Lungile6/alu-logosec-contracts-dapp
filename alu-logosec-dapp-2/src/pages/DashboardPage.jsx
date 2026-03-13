import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import WalletGate from "../components/WalletGate";
import { shortenAddress } from "../utils/hash";

// Example stakeholder addresses (Hardhat test accounts)
const EXAMPLE_ADDRESSES = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
];

export default function DashboardPage({ wallet }) {
  const [totalSupply, setTotalSupply] = useState(null);
  const [ownershipPct, setOwnershipPct] = useState(null);
  const [stakeholders, setStakeholders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [ownerBalance, setOwnerBalance] = useState(null);

  // Distribute form
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [distributing, setDistributing] = useState(false);
  const [distStatus, setDistStatus] = useState(null);

  const loadData = useCallback(async () => {
    if (!wallet.signer) return;
    setLoadingData(true);
    try {
      const contract = wallet.tokenContract(wallet.signer);

      const supply = await contract.totalSupply();
      setTotalSupply(ethers.utils.formatUnits(supply, 18));

      const pct = await contract.ownershipPercentage(wallet.account);
      setOwnershipPct(pct.toString());

      const bal = await contract.balanceOf(wallet.account);
      setOwnerBalance(ethers.utils.formatUnits(bal, 18));

      // Load example stakeholders
      const rows = await Promise.all(
        EXAMPLE_ADDRESSES.map(async (addr) => {
          try {
            const bal = await contract.balanceOf(addr);
            const p = await contract.ownershipPercentage(addr);
            return {
              address: addr,
              balance: parseFloat(ethers.utils.formatUnits(bal, 18)).toLocaleString(),
              percentage: p.toString(),
            };
          } catch {
            return { address: addr, balance: "0", percentage: "0" };
          }
        })
      );
      setStakeholders(rows);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet.account) loadData();
  }, [wallet.account, loadData]);

  const handleDistribute = async () => {
    if (!recipient || !amount) {
      setDistStatus({ type: "error", message: "Please enter a recipient address and amount." });
      return;
    }
    if (parseFloat(amount) <= 0) {
      setDistStatus({ type: "error", message: "Amount must be greater than zero." });
      return;
    }
    if (!ethers.utils.isAddress(recipient)) {
      setDistStatus({ type: "error", message: "Invalid Ethereum address." });
      return;
    }

    setDistributing(true);
    setDistStatus(null);

    try {
      const contract = wallet.tokenContract(wallet.signer);
      // Formative 1 contract expects the amount in whole tokens (it multiplies by 1e18 internally).
      const wholeTokens = ethers.BigNumber.from(Math.trunc(Number(amount)).toString());
      if (wholeTokens.lte(0)) {
        setDistStatus({ type: "error", message: "Amount must be a whole number greater than zero." });
        return;
      }

      // UX check: ensure owner has enough balance (in whole tokens)
      const bal = await contract.balanceOf(wallet.account);
      const needed = wholeTokens.mul(ethers.constants.WeiPerEther);
      if (bal.lt(needed)) {
        setDistStatus({ type: "error", message: "Insufficient balance to distribute that many tokens." });
        return;
      }

      const tx = await contract.distributeShares(recipient, wholeTokens);
      setDistStatus({ type: "info", message: "Transaction submitted. Waiting for confirmation…" });
      await tx.wait();
      setDistStatus({
        type: "success",
        message: `Successfully distributed ${parseFloat(amount).toLocaleString()} ALUT to ${shortenAddress(recipient)}.`,
      });
      setRecipient("");
      setAmount("");
      await wallet.refreshBalance();
      await loadData();
    } catch (err) {
      const msg = err?.reason || err?.message || "Transaction failed";
      if (msg.includes("Ownable") || msg.includes("owner")) {
        setDistStatus({ type: "error", message: "Access denied: only the contract owner can distribute shares." });
      } else if (msg.includes("user rejected")) {
        setDistStatus({ type: "warn", message: "Transaction cancelled." });
      } else {
        setDistStatus({ type: "error", message: msg });
      }
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="page-wide">
      <div className="page-header">
        <h1 className="page-title">Token Dashboard</h1>
        <p className="page-subtitle">ALUT token ownership and share distribution.</p>
      </div>

      <WalletGate wallet={wallet} message="Connect wallet to view the token dashboard">
        <div className="stack">
          {/* Supply stats */}
          <div className="grid-2">
            <div className="card">
              <div className="stat-label">Total ALUT Supply</div>
              <div className="stat-value">
                {totalSupply ? parseFloat(totalSupply).toLocaleString() : loadingData ? "…" : "—"}
              </div>
              <div className="stat-sub">1,000,000 tokens minted at deployment</div>
            </div>

            <div className="card">
              <div className="stat-label">Your Ownership</div>
              <div className="stat-value">
                {parseFloat(wallet.alutBalance).toLocaleString()}
                <span style={{ fontSize: "0.9rem", color: "var(--text-2)", fontWeight: 400 }}> ALUT</span>
              </div>
              <div className="stat-sub">
                {ownershipPct !== null
                  ? `${ownershipPct}% of total supply`
                  : "—"}
              </div>
            </div>
          </div>

          {/* Ownership list */}
          <div className="card">
            <div className="card-title">Stakeholder Ownership</div>
            <div className="stack-sm">
              {/* Connected wallet */}
              <OwnerRow
                address={wallet.account}
                balance={parseFloat(wallet.alutBalance).toLocaleString()}
                pct={ownershipPct !== null ? (ownershipPct / 100).toFixed(4) : null}
                label="You"
              />
              <hr className="divider" />
              {stakeholders.map((s) => (
                <OwnerRow
                  key={s.address}
                  address={s.address}
                  balance={s.balance}
                  pct={s.percentage}
                />
              ))}
              {loadingData && (
                <div style={{ color: "var(--text-3)", fontSize: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className="spinner" /> Loading stakeholders…
                </div>
              )}
            </div>
          </div>

          {/* Distribute form */}
          <div className="card">
            <div className="card-title">
              Distribute Shares
              {!wallet.isOwner && (
                <span className="badge badge-warn" style={{ marginLeft: "0.75rem" }}>Owner Only</span>
              )}
            </div>

            {!wallet.isOwner ? (
              <div className="alert alert-warn">
                🔒 Only the contract owner can distribute ALUT tokens. Your wallet is not the owner.
              </div>
            ) : (
              <div className="stack">
                <div className="form-group">
                  <label className="form-label">Recipient Address</label>
                  <input
                    className="form-input mono"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (ALUT)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 10000"
                  />
                  <div style={{ marginTop: "0.35rem", fontSize: "0.78rem", color: "var(--text-3)" }}>
                    Amount must be a whole number (e.g. 10000). The contract applies 18 decimals internally.
                  </div>
                  {ownerBalance !== null && (
                    <div style={{ marginTop: "0.25rem", fontSize: "0.78rem", color: "var(--text-3)" }}>
                      Your balance: {parseFloat(ownerBalance).toLocaleString()} ALUT
                    </div>
                  )}
                </div>

                {distStatus && (
                  <div className={`alert alert-${
                    distStatus.type === "success" ? "success"
                    : distStatus.type === "error" ? "error"
                    : distStatus.type === "warn" ? "warn"
                    : "info"
                  }`}>
                    {distStatus.message}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleDistribute}
                  disabled={distributing || !recipient || !amount}
                >
                  {distributing ? <span className="spinner" /> : "💸"}
                  {distributing ? "Distributing…" : "Distribute Shares"}
                </button>
              </div>
            )}
          </div>
        </div>
      </WalletGate>
    </div>
  );
}

function OwnerRow({ address, balance, pct, label }) {
  const width = pct ? Math.min(parseFloat(pct), 100) : 0;
  return (
    <div className="owner-row">
      <div className="owner-addr">
        {shortenAddress(address)}
        {label && (
          <span className="badge badge-success" style={{ marginLeft: "0.5rem", fontSize: "0.65rem" }}>
            {label}
          </span>
        )}
      </div>
      <div style={{ flex: 1, fontSize: "0.78rem", color: "var(--text-3)" }}>
        {balance} ALUT
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${width}%` }} />
      </div>
      <div className="owner-pct">{pct !== null ? `${pct}%` : "…"}</div>
    </div>
  );
}
