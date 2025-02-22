import React, { useEffect } from "react";
import { useDID } from "../contexts/DIDContext";
import { DIDForm } from "./DIDForm";
import { VerificationPanel } from "./VerificationPanel";

interface DIDViewerProps {
  didId: string;
}

export function DIDViewer({ didId }: DIDViewerProps) {
  const { actions, didState, verifierState } = useDID();

  useEffect(() => {
    actions.loadDID(didId).catch(console.error);
  }, [didId]);

  if (didState.loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (didState.error) {
    return (
      <div className="p-4 text-red-700 bg-red-100 rounded">
        {didState.error}
      </div>
    );
  }

  if (!didState.did) {
    return <div className="p-4">DID not found</div>;
  }

  const { did, verifications } = didState;

  return (
    <div className="space-y-6">
      <div className="p-4 space-y-4 border rounded">
        <h2 className="text-2xl font-bold">DID Details</h2>

        <div className="space-y-2">
          <div>
            <span className="font-semibold">ID: </span>
            <span className="font-mono">{did.id}</span>
          </div>

          <div>
            <span className="font-semibold">Owner: </span>
            <span className="font-mono">{did.owner}</span>
          </div>

          <div>
            <span className="font-semibold">Status: </span>
            <span className={did.active ? "text-green-600" : "text-red-600"}>
              {did.active ? "Active" : "Inactive"}
            </span>
          </div>

          <div>
            <span className="font-semibold">Created: </span>
            {new Date(did.created.toNumber() * 1000).toLocaleString()}
          </div>

          <div>
            <span className="font-semibold">Last Updated: </span>
            {new Date(did.updated.toNumber() * 1000).toLocaleString()}
          </div>

          <div>
            <span className="font-semibold">Identifiers: </span>
            <ul className="pl-5 list-disc">
              {did.identifiers.map((id, index) => (
                <li key={index} className="font-mono">
                  {id}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {did.active && did.owner === window.ethereum?.selectedAddress && (
          <div className="pt-4 mt-4 border-t">
            <h3 className="mb-4 text-lg font-bold">Update DID</h3>
            <DIDForm
              mode="update"
              didId={did.id}
              onSuccess={() => actions.loadDID(did.id)}
            />
          </div>
        )}
      </div>

      {verifications.length > 0 && (
        <div className="p-4 space-y-4 border rounded">
          <h3 className="text-lg font-bold">Verifications</h3>

          <div className="space-y-4">
            {verifications.map((verification, index) => (
              <div key={index} className="p-4 border rounded">
                <div>
                  <span className="font-semibold">Verifier: </span>
                  <span className="font-mono">{verification.verifier}</span>
                </div>

                <div>
                  <span className="font-semibold">Level: </span>
                  {verification.level}
                </div>

                <div>
                  <span className="font-semibold">Status: </span>
                  <span
                    className={
                      verification.status ===
                      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"))
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {verification.status ===
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ACTIVE"))
                      ? "Active"
                      : "Revoked"}
                  </span>
                </div>

                <div>
                  <span className="font-semibold">Expiration: </span>
                  {new Date(
                    verification.expiration.toNumber() * 1000
                  ).toLocaleString()}
                </div>

                {verification.metadata && (
                  <div>
                    <span className="font-semibold">Metadata: </span>
                    {verification.metadata}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {verifierState.isVerifier && <VerificationPanel didId={did.id} />}
    </div>
  );
}
