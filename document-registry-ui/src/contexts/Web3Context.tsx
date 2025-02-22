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

  const updateSigner = async (provider: BrowserProvider) => {
    try {
      const newSigner = await provider.getSigner();
      setSigner(newSigner);
      // Get the address from the signer
      const address = await newSigner.getAddress();
      setAccount(address);
    } catch (err) {
      console.error("Failed to get signer:", err);
      setSigner(null);
      setAccount(null);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      setProvider(provider);

      // Handle account changes
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length > 0) {
          await updateSigner(provider);
        } else {
          setAccount(null);
          setSigner(null);
        }
      });

      // Handle chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });

      // Check if already connected
      provider
        .listAccounts()
        .then(async (accounts) => {
          if (accounts.length > 0) {
            await updateSigner(provider);
          }
        })
        .catch((err) => {
          console.error("Error checking accounts:", err);
        });
    }

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
