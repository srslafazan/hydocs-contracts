"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { DIDRegistryService } from "../services/DIDRegistryService";
import {
  DIDState,
  VerifierState,
  DIDDocument,
  Verification,
} from "../types/DIDRegistry";

interface DIDContextType {
  didState: DIDState;
  verifierState: VerifierState;
  service: DIDRegistryService;
  actions: {
    createDID: (identifiers: string[]) => Promise<string>;
    updateDID: (didId: string, identifiers: string[]) => Promise<void>;
    deactivateDID: (didId: string) => Promise<void>;
    addVerification: (
      didId: string,
      level: number,
      expiration: number,
      metadata: string
    ) => Promise<void>;
    revokeVerification: (didId: string) => Promise<void>;
    loadDID: (didId: string) => Promise<void>;
    getDIDOwner: (didId: string) => Promise<string>;
    loadUserDID: () => Promise<void>;
    service: DIDRegistryService;
  };
}

const DIDContext = createContext<DIDContextType | undefined>(undefined);

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DID"; payload: DIDDocument | null }
  | { type: "SET_VERIFICATIONS"; payload: Verification[] }
  | { type: "SET_IS_VERIFIER"; payload: boolean }
  | { type: "SET_PENDING_VERIFICATIONS"; payload: string[] };

function didReducer(
  state: DIDState & VerifierState,
  action: Action
): DIDState & VerifierState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_DID":
      return { ...state, did: action.payload };
    case "SET_VERIFICATIONS":
      return { ...state, verifications: action.payload };
    case "SET_IS_VERIFIER":
      return { ...state, isVerifier: action.payload };
    case "SET_PENDING_VERIFICATIONS":
      return { ...state, pendingVerifications: action.payload };
    default:
      return state;
  }
}

interface DIDProviderProps {
  children: React.ReactNode;
  service: DIDRegistryService;
}

export function DIDProvider({ children, service }: DIDProviderProps) {
  const [state, dispatch] = useReducer(didReducer, {
    loading: false,
    error: null,
    did: null,
    verifications: [],
    isVerifier: false,
    pendingVerifications: [],
  });

  // Memoize individual actions
  const loadUserDID = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const address = await service.signer?.getAddress();
      if (!address) {
        dispatch({ type: "SET_DID", payload: null });
        return;
      }

      const didId = await service.getDIDByOwner(address);
      if (!didId) {
        dispatch({ type: "SET_DID", payload: null });
        return;
      }

      await loadDID(didId);
    } catch (error: any) {
      console.error("Error loading user DID:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [service]);

  const loadDID = useCallback(
    async (didId: string) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        let verifications: Verification[] = [];
        try {
          // Try to get all verifiers first
          const verifierRole = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes("VERIFIER_ROLE")
          );
          const verifiers = await service.getRoleMemberArray(verifierRole);

          // Get verifications from all verifiers
          const verificationPromises = await Promise.all(
            verifiers.map((verifier) =>
              service.getVerification(didId, verifier)
            )
          );

          // Filter out empty verifications
          verifications = verificationPromises.filter(
            (v) => v.verifier !== ethers.constants.AddressZero
          );
        } catch (err) {
          console.warn(
            "Failed to get all verifiers, falling back to current verifier:",
            err
          );
          // Fall back to just getting the current verifier's verification
          if (service.signer) {
            const verifier = await service.signer.getAddress();
            const verification = await service.getVerification(didId, verifier);
            if (verification.verifier !== ethers.constants.AddressZero) {
              verifications = [verification];
            }
          }
        }

        const [owner, identifiers, metadata] = await Promise.all([
          service.getDIDOwner(didId),
          service.getDIDIdentifiers(didId),
          service.getDIDMetadata(didId),
        ]);

        const did: DIDDocument = {
          id: didId,
          owner,
          identifiers,
          created: metadata.created,
          updated: metadata.updated,
          active: metadata.active,
        };

        dispatch({ type: "SET_DID", payload: did });
        dispatch({ type: "SET_VERIFICATIONS", payload: verifications });
      } catch (error: any) {
        console.error("Error loading DID:", error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [service]
  );

  const createDID = useCallback(
    async (identifiers: string[]) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const didId = await service.createDID(identifiers);
        await loadDID(didId);
        return didId;
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [service, loadDID]
  );

  const updateDID = useCallback(
    async (didId: string, identifiers: string[]) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        await service.updateDID(didId, identifiers);
        await loadDID(didId);
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [service, loadDID]
  );

  // Memoize the actions object
  const actions = useMemo(
    () => ({
      createDID,
      updateDID,
      deactivateDID: async (didId: string) => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          await service.deactivateDID(didId);
          await loadDID(didId);
        } catch (error: any) {
          dispatch({ type: "SET_ERROR", payload: error.message });
          throw error;
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },
      addVerification: async (
        didId: string,
        level: number,
        expiration: number,
        metadata: string
      ) => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          await service.addVerification(didId, level, expiration, metadata);
          await loadDID(didId);
        } catch (error: any) {
          dispatch({ type: "SET_ERROR", payload: error.message });
          throw error;
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },
      revokeVerification: async (didId: string) => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          await service.revokeVerification(didId);
          await loadDID(didId);
        } catch (error: any) {
          dispatch({ type: "SET_ERROR", payload: error.message });
          throw error;
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },
      loadDID,
      getDIDOwner: async (didId: string) => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
          const owner = await service.getDIDOwner(didId);
          return owner;
        } catch (error: any) {
          dispatch({ type: "SET_ERROR", payload: error.message });
          throw error;
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      },
      loadUserDID,
      service,
    }),
    [service, loadDID, createDID, updateDID, loadUserDID]
  );

  // Check verifier role on mount
  useEffect(() => {
    async function checkVerifierRole() {
      try {
        const account = await service.signer?.getAddress();
        if (account) {
          const isVerifier = await service.hasRole(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VERIFIER_ROLE")),
            account
          );
          dispatch({ type: "SET_IS_VERIFIER", payload: isVerifier });
        }
      } catch (error) {
        console.error("Error checking verifier role:", error);
      }
    }

    checkVerifierRole();
  }, [service]);

  return (
    <DIDContext.Provider
      value={{ didState: state, verifierState: state, service, actions }}
    >
      {children}
    </DIDContext.Provider>
  );
}

export function useDID() {
  const context = useContext(DIDContext);
  if (context === undefined) {
    throw new Error("useDID must be used within a DIDProvider");
  }
  return context;
}
