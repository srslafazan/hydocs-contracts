"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDID } from "../../../contexts/DIDContext";
import { DIDViewer } from "../../../components/DIDViewer";
import Link from "next/link";

export default function DIDDetails() {
  const params = useParams();
  const { actions, didState } = useDID();
  const didId = params.id as string;

  useEffect(() => {
    if (didId) {
      actions.loadDID(didId);
    }
  }, [didId, actions]);

  return (
    <main className="min-h-screen bg-slate-100 p-3">
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg mb-8 p-3">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-semibold text-white">
                DID Registry
              </Link>
              <Link
                href="/dids"
                className="text-white hover:text-blue-100 transition-colors"
              >
                View All DIDs
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl border border-slate-100">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-800">
            <h2 className="text-xl font-semibold text-white">
              Identity Details
            </h2>
          </div>
          <div className="p-8">
            {didState.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : didState.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{didState.error}</p>
              </div>
            ) : didState.did ? (
              <DIDViewer
                did={didState.did}
                verifications={didState.verifications}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                DID not found
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-200 p-4">
        <p className="text-center text-sm text-slate-600">
          Secured by Ethereum • {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
