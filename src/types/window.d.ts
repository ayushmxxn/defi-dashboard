interface Window {
  ethereum?: {
    request: <T = unknown>(args: {
      method: string;
      params?: unknown[];
    }) => Promise<T>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    removeAllListeners: (event?: string) => void;
    isMetaMask?: boolean;
    selectedAddress?: string | null;
    chainId?: string;
  };
}
