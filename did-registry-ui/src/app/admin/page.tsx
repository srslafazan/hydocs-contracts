"use client";

import { AdminPanel } from "../../components/AdminPanel";

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl border border-slate-100">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
        </div>
        <div className="p-8">
          <AdminPanel />
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-200 p-4">
        <p className="text-center text-sm text-slate-600">
          Secured by Ethereum • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
