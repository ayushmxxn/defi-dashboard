"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: <T = unknown>(args: {
        method: string;
        params?: unknown[] | undefined;
      }) => Promise<T>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (event?: string | undefined) => void;
      isMetaMask?: boolean | undefined;
      selectedAddress?: string | null | undefined;
      chainId?: string | undefined;
    };
  }
}

interface WalletContextType {
  isWalletConnected: boolean;
  account: string | null;
  connectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async (): Promise<void> => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask to use this feature.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      if (Number(chainId) !== 1) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1" }],
          });
        } catch (switchError: unknown) {
          // Type guard for error with code property
          if (
            switchError &&
            typeof switchError === "object" &&
            "code" in switchError &&
            (switchError as { code: number }).code === 4902
          ) {
            alert("Please add Ethereum Mainnet to MetaMask.");
          }
          return;
        }
      }

      const accounts = (await provider.send(
        "eth_requestAccounts",
        []
      )) as string[];
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsWalletConnected(true);
        console.log("Connected account:", accounts[0]);
      }
    } catch (error: unknown) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect MetaMask. Please try again.");
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      if (
        Array.isArray(accounts) &&
        accounts.every((acc) => typeof acc === "string")
      ) {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsWalletConnected(true);
        } else {
          setAccount(null);
          setIsWalletConnected(false);
        }
      } else {
        setAccount(null);
        setIsWalletConnected(false);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    // event listeners
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Cleanup event listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{ isWalletConnected, account, connectWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
