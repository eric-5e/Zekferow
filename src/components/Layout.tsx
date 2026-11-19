import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X } from 'lucide-react';
import { ZekferowLogo } from './ZekferowLogo';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/authorize', label: 'Authorize' },
  { to: '/mandates', label: 'My Mandates' },
  { to: '/merchant', label: 'Merchant Console' },
];

export function Layout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#E9EEF3] text-[#1F2A37]">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand mark & single-line wordmark */}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D8F] rounded-md"
          >
            <ZekferowLogo size={30} />
            <span className="text-lg font-bold tracking-tight text-[#1F2A37]">
              Zekferow
            </span>
          </Link>

          {/* Zone 2: Primary navigation links */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-7"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[#0F9D8F] border-[#0F9D8F]'
                      : 'text-[#6B7785] border-transparent hover:text-[#1F2A37] hover:border-[#CBD5E1]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Connect Wallet primary action & mobile drawer toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#CBD5E1] text-[#1F2A37] hover:bg-[#F1F5F9] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-[#E2E8F0] bg-white px-4 py-3 space-y-1"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#E6F6F4] text-[#0A685F]'
                      : 'text-[#1F2A37] hover:bg-[#F1F5F9]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#1F2A37] text-white border-t border-[#2E3B4B] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-3">
            <ZekferowLogo size={32} className="shrink-0 mt-0.5 border border-white/15 rounded-[10px]" />
            <div>
              <p className="text-sm font-semibold text-white">Built by Eric</p>
              <p className="mt-1 text-xs text-slate-300">
                Zekferow is an independent project, available on Arc.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <Link to="/" className="hover:text-white transition-colors whitespace-nowrap">
              Home
            </Link>
            <Link to="/authorize" className="hover:text-white transition-colors whitespace-nowrap">
              Authorize
            </Link>
            <Link to="/mandates" className="hover:text-white transition-colors whitespace-nowrap">
              My Mandates
            </Link>
            <Link to="/merchant" className="hover:text-white transition-colors whitespace-nowrap">
              Merchant Console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
