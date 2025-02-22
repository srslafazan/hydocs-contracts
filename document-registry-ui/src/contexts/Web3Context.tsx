"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  account: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initProvider = async () => {
      try {
        if (window.ethereum) {
          const provider = new BrowserProvider(window.ethereum);
          setProvider(provider);
          console.log("Web3 provider initialized");

          // Handle account changes
          window.ethereum.on("accountsChanged", async (accounts: string[]) => {
            console.log("Account changed:", accounts);
            if (accounts.length > 0) {
              try {
                const newSigner = await provider.getSigner();
                setSigner(newSigner);
                setAccount(accounts[0]);
              } catch (err) {
                console.error("Error getting signer:", err);
                setSigner(null);
                setAccount(null);
              }
            } else {
              setSigner(null);
              setAccount(null);
            }
          });

          // Handle chain changes
          window.ethereum.on("chainChanged", () => {
            console.log("Chain changed, reloading...");
            window.location.reload();
          });

          // Check if already connected
          try {
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
              const newSigner = await provider.getSigner();
              setSigner(newSigner);
              setAccount(accounts[0].address);
              console.log("Found connected account:", accounts[0].address);
            }
          } catch (err) {
            console.error("Error checking accounts:", err);
          }
        } else {
          console.log("No ethereum provider found");
        }
      } catch (err) {
        console.error("Error initializing Web3:", err);
      }
    };

    initProvider();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use this application");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0 && provider) {
        await updateSigner(provider);
      }
    } catch (err: any) {
      setError(err.message);
      setAccount(null);
      setSigner(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        connectWallet,
        disconnectWallet,
        isConnecting,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
