"use client";

import { DIDForm } from "../components/DIDForm";
import { DIDViewer } from "../components/DIDViewer";
import { useState } from "react";

export default function Home() {
  const [currentDID, setCurrentDID] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <h1 className="text-base font-medium text-slate-900">
                DID Registry
              </h1>
            </div>
            {currentDID && (
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentDID(null)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + New Identity
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!currentDID ? (
          <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-base font-medium text-slate-900">
                Create New Identity
              </h2>
            </div>
            <div className="p-4">
              <DIDForm
                mode="create"
                onSuccess={(didId) => setCurrentDID(didId)}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-base font-medium text-slate-900">
                Identity Details
              </h2>
            </div>
            <div className="p-4">
              <DIDViewer didId={currentDID} />
            </div>
          </div>
        )}

        <footer className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-center text-xs text-slate-500">
            Secured by Ethereum • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </main>
  );
}
