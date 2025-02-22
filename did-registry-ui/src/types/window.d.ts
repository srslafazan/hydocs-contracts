interface Window {
  ethereum?: {
    selectedAddress: string;
    isMetaMask?: boolean;
    request: (request: { method: string; params?: Array<any> }) => Promise<any>;
    on: (eventName: string, handler: (params?: any) => void) => void;
    removeListener: (
      eventName: string,
      handler: (params?: any) => void
    ) => void;
  };
}
