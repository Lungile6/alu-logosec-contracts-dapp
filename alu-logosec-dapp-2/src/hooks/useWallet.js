import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import ALULogoTokenABI from "../contracts/ALULogoToken.json";
import ALUAssetRegistryABI from "../contracts/ALUAssetRegistry.json";
import { CONTRACT_ADDRESSES, HARDHAT_CHAIN_ID } from "../contracts/addresses";

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [alutBalance, setAlutBalance] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const registryContract = useCallback(
    (signerOrProvider) =>
      new ethers.Contract(
        CONTRACT_ADDRESSES.ALUAssetRegistry,
        ALUAssetRegistryABI.abi,
        signerOrProvider
      ),
    []
  );

  const tokenContract = useCallback(
    (signerOrProvider) =>
      new ethers.Contract(
        CONTRACT_ADDRESSES.ALULogoToken,
        ALULogoTokenABI.abi,
        signerOrProvider
      ),
    []
  );

  const fetchBalance = useCallback(
    async (addr, signerOrProvider) => {
      try {
        const contract = tokenContract(signerOrProvider);
        const bal = await contract.balanceOf(addr);
        setAlutBalance(ethers.utils.formatUnits(bal, 18));
        const ownerAddr = await contract.owner();
        setIsOwner(ownerAddr.toLowerCase() === addr.toLowerCase());
      } catch (e) {
        console.error("Failed to fetch balance:", e);
      }
    },
    [tokenContract]
  );

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("no_wallet");
      return;
    }
    try {
      setConnecting(true);
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = web3Provider.getSigner();
      const addr = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(addr);
      setChainId(network.chainId);
      await fetchBalance(addr, web3Signer);
    } catch (e) {
      setError("connection_failed");
      console.error(e);
    } finally {
      setConnecting(false);
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setAlutBalance("0");
    setIsOwner(false);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (account && signer) {
      await fetchBalance(account, signer);
    }
  }, [account, signer, fetchBalance]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return {
    provider,
    signer,
    account,
    chainId,
    alutBalance,
    isOwner,
    error,
    connecting,
    connect,
    disconnect,
    refreshBalance,
    registryContract,
    tokenContract,
    isCorrectNetwork: chainId === HARDHAT_CHAIN_ID,
  };
}
