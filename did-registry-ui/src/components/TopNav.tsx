import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDID } from "../contexts/DIDContext";

export function TopNav() {
  const pathname = usePathname();
  const { verifierState } = useDID();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={`text-2xl font-semibold text-white hover:text-blue-100 transition-colors ${
                isActive("/") ? "border-b-2 border-white" : ""
              }`}
            >
              DID Registry
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/dids"
                className={`text-white hover:text-blue-100 transition-colors py-5 ${
                  isActive("/dids") ? "border-b-2 border-white" : ""
                }`}
              >
                View All DIDs
              </Link>
              <Link
                href="/"
                className={`text-white hover:text-blue-100 transition-colors py-5 ${
                  isActive("/") && !isActive("/dids") && !isActive("/admin")
                    ? "border-b-2 border-white"
                    : ""
                }`}
              >
                Create New DID
              </Link>
              {verifierState.isVerifier && (
                <Link
                  href="/admin"
                  className={`text-white hover:text-blue-100 transition-colors py-5 ${
                    isActive("/admin") ? "border-b-2 border-white" : ""
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-sm text-white bg-blue-700 px-4 py-2 rounded-lg">
              {window.ethereum?.selectedAddress ? (
                <span>
                  Connected: {window.ethereum.selectedAddress.slice(0, 6)}...
                  {window.ethereum.selectedAddress.slice(-4)}
                </span>
              ) : (
                <span>Not Connected</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
