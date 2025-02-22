"use client";

import { DIDForm } from "../components/DIDForm";
import { DIDViewer } from "../components/DIDViewer";
import { useState, useEffect } from "react";
import { useDID } from "../contexts/DIDContext";

import "./globals.css";

export default function Home() {
  const [currentDID, setCurrentDID] = useState<string | null>(null);
  const { actions, didState } = useDID();

  useEffect(() => {
    if (currentDID) {
      actions.loadDID(currentDID);
    }
  }, [currentDID, actions]);

  const renderCreateIdentity = () => (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl border border-slate-100">
      <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-xl font-semibold text-white">
          Create New Identity
        </h2>
      </div>
      <div className="p-8">
        <DIDForm mode="create" onSuccess={(didId) => setCurrentDID(didId)} />
      </div>
    </div>
  );

  const renderIdentityDetails = () => (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl border border-slate-100">
      <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <h2 className="text-xl font-semibold text-white">Identity Details</h2>
      </div>
      <div className="p-8">
        {didState.did && (
          <DIDViewer
            did={didState.did}
            verifications={didState.verifications}
          />
        )}
      </div>
    </div>
  );

  const renderFooter = () => (
    <footer className="mt-16 pt-8 border-t border-slate-200 p-4">
      <p className="text-center text-sm text-slate-600">
        Secured by Ethereum • {new Date().getFullYear()}
      </p>
    </footer>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {!currentDID ? renderCreateIdentity() : renderIdentityDetails()}
      {renderFooter()}
    </div>
  );
}
