import { usePathname } from "next/navigation";
import Link from "next/link";
import { useDID } from "../contexts/DIDContext";

export function TopNav() {
  const pathname = usePathname();
  const { verifierState, selectedAccount, connectWallet, disconnectWallet } =
    useDID();

  const isActive = (path: string) => pathname === path;

  const formatAddress = (address: string | null | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navItems = [
    { path: "/", label: "Create DID" },
    { path: "/dids", label: "View DIDs" },
    ...(verifierState.isVerifier ? [{ path: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <h1 className="text-xl font-bold">DID Registry</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive(item.path)
                      ? "border-b-2 border-indigo-500 text-gray-900"
                      : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {selectedAccount ? (
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600">
                  {formatAddress(selectedAccount)}
                </p>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="space-y-1 pb-3 pt-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`block py-2 px-3 text-base font-medium ${
                isActive(item.path)
                  ? "bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
