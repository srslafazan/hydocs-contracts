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

  const renderHeader = () => (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg mb-12 p-4">
      <div className="max-w-4xl mx-auto px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-white">DID Registry</h1>
          </div>
          {currentDID && (
            <div className="flex items-center">
              <button
                onClick={() => setCurrentDID(null)}
                className="px-6 py-3 text-sm bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                + Create New Identity
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const renderCreateIdentity = () => (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl border border-slate-100 p-4">
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
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl border border-slate-100 p-4">
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
    <main className="min-h-screen bg-slate-100 p-4">
      {renderHeader()}
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-12">
        {!currentDID ? renderCreateIdentity() : renderIdentityDetails()}
        {renderFooter()}
      </div>
    </main>
  );
}
