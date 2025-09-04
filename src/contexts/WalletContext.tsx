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
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionPromise, setConnectionPromise] =
    useState<Promise<void> | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          setIsWalletConnected(true);
        }
      } catch {
        console.log("No existing connection found");
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async (): Promise<void> => {
    // If already connecting, return the existing promise
    if (connectionPromise) {
      return connectionPromise;
    }

    // If already connected, return immediately
    if (isWalletConnected) {
      return;
    }

    setIsConnecting(true);

    const connectPromise = (async () => {
      try {
        if (!window.ethereum) {
          throw new Error(
            "MetaMask is not installed. Please install MetaMask to continue."
          );
        }

        // Check if MetaMask is available
        if (!window.ethereum.isMetaMask) {
          throw new Error(
            "Please use MetaMask wallet to connect. Other wallets are not supported."
          );
        }

        // Request account access with timeout
        const accounts = await Promise.race([
          window.ethereum.request({
            method: "eth_requestAccounts",
          }) as Promise<string[]>,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Connection timeout. Please try again.")),
              30000
            )
          ),
        ]);

        if (!accounts || accounts.length === 0) {
          throw new Error(
            "No accounts found. Please unlock your MetaMask wallet."
          );
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId;

        // Check if we're on Ethereum mainnet, if not, try to switch
        if (Number(chainId) !== 1) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x1" }],
            });
          } catch (switchError: unknown) {
            if ((switchError as { code?: number }).code === 4902) {
              // Chain not added, try to add it
              try {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: "0x1",
                      chainName: "Ethereum Mainnet",
                      rpcUrls: ["https://mainnet.infura.io/v3/"],
                      nativeCurrency: {
                        name: "Ether",
                        symbol: "ETH",
                        decimals: 18,
                      },
                      blockExplorerUrls: ["https://etherscan.io"],
                    },
                  ],
                });
              } catch {
                // addError is intentionally unused as we throw a generic error
                throw new Error(
                  "Failed to add Ethereum Mainnet to MetaMask. Please add it manually."
                );
              }
            } else if ((switchError as { code?: number }).code === 4001) {
              throw new Error(
                "User rejected the network switch. Please switch to Ethereum Mainnet manually."
              );
            } else {
              throw new Error(
                "Failed to switch to Ethereum Mainnet. Please switch manually."
              );
            }
          }
        }

        setAccount(accounts[0]);
        setIsWalletConnected(true);
        console.log("Successfully connected to MetaMask:", accounts[0]);
      } catch (error: unknown) {
        console.error("Failed to connect wallet:", error);

        // Provide specific error messages based on the error type
        let errorMessage = "Failed to connect to MetaMask. Please try again.";

        if (error instanceof Error && error.message) {
          errorMessage = error.message;
        } else if ((error as { code?: number }).code === 4001) {
          errorMessage =
            "Connection rejected. Please approve the connection in MetaMask.";
        } else if ((error as { code?: number }).code === -32002) {
          errorMessage =
            "Connection request already pending. Please check MetaMask.";
        }

        alert(errorMessage);
        throw error; // Re-throw to ensure the promise rejects
      } finally {
        setIsConnecting(false);
        setConnectionPromise(null); // Clear the promise when done
      }
    })();

    // Store the promise to prevent multiple simultaneous requests
    setConnectionPromise(connectPromise);

    return connectPromise;
  };

  const disconnectWallet = (): void => {
    setAccount(null);
    setIsWalletConnected(false);
    setConnectionPromise(null); // Clear any pending connection
    setIsConnecting(false); // Reset connecting state
    console.log("Wallet disconnected");
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsWalletConnected(true);
      } else {
        setAccount(null);
        setIsWalletConnected(false);
        setConnectionPromise(null); // Clear any pending connection
        setIsConnecting(false); // Reset connecting state
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainId = args[0] as string;
      console.log("Chain changed to:", chainId);
      // Reload the page when chain changes to ensure proper state
      window.location.reload();
    };

    const handleDisconnect = () => {
      setAccount(null);
      setIsWalletConnected(false);
      setConnectionPromise(null); // Clear any pending connection
      setIsConnecting(false); // Reset connecting state
    };

    // Add event listeners
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    // Cleanup event listeners on component unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
        window.ethereum.removeAllListeners("disconnect");
      }
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isWalletConnected,
        account,
        isConnecting,
        connectWallet,
        disconnectWallet,
      }}
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
