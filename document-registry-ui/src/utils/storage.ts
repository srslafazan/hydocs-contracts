// Local storage keys
const STORAGE_KEYS = {
  DOCUMENTS_TAB: "documents-tab-preference",
  SIGNER_TAB: "signer-tab-preference",
} as const;

// Type definitions
export type DocumentsTabType = "my-documents" | "all-documents";
export type SignerTabType = "to-sign" | "signed";

// Get stored tab preference with default fallback
export const getStoredTab = <T extends string>(
  key: string,
  defaultValue: T
): T => {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return (stored as T) || defaultValue;
};

// Store tab preference
export const storeTab = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
};

// Specific getters and setters for each tab type
export const getDocumentsTab = (): DocumentsTabType =>
  getStoredTab<DocumentsTabType>(STORAGE_KEYS.DOCUMENTS_TAB, "my-documents");

export const setDocumentsTab = (tab: DocumentsTabType): void =>
  storeTab(STORAGE_KEYS.DOCUMENTS_TAB, tab);

export const getSignerTab = (): SignerTabType =>
  getStoredTab<SignerTabType>(STORAGE_KEYS.SIGNER_TAB, "to-sign");

export const setSignerTab = (tab: SignerTabType): void =>
  storeTab(STORAGE_KEYS.SIGNER_TAB, tab);
