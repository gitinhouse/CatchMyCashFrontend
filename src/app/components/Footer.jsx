'use client';

import Link from 'next/link';
import { useSearchStore } from '../store/searchStore';

export default function Footer() {
  const { goToSearch } = useSearchStore();

  return (
    <footer className="bg-[#0A0A0A] text-white pt-16 pb-6">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-12 mb-12 lg:mb-16">
          {/* Brand Block */}
          <div className="text-center sm:text-left">
            <div className="font-['Fraunces'] font-black text-[22px] tracking-[-0.02em] flex items-center gap-2 justify-center sm:justify-start mb-4">
              <span className="w-2.5 h-2.5 bg-[#E1261C] rounded-full inline-block"></span>
              CatchMyCash
            </div>
            <p className="text-[#888888] text-sm max-w-[280px] mx-auto sm:mx-0">
              Helping Californians recover unclaimed property held by the State
              Controller's Office. Not affiliated with the State of California.
            </p>
          </div>

          {/* Product Links */}
          <div className="text-center sm:text-left">
            <h4 className="font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] uppercase text-[#888888] mb-4 font-medium">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  onClick={() => goToSearch()}
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  Search now
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="text-center sm:text-left">
            <h4 className="font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] uppercase text-[#888888] mb-4 font-medium">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="text-center sm:text-left">
            <h4 className="font-['JetBrains_Mono'] text-[11px] tracking-[0.15em] uppercase text-[#888888] mb-4 font-medium">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-[#D4D4D4] text-sm hover:text-[#E1261C] transition-colors"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1A1A1A] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-['JetBrains_Mono'] text-xs text-[#888888] text-center sm:text-left">
            © 2026 CatchMyCash · All rights reserved
          </span>

          {/* Social Links */}
          <div className="flex gap-4">
            <a
              href="https://x.com/"
              className="w-9 h-9 border border-[#1A1A1A] rounded flex items-center justify-center text-[#D4D4D4] hover:border-[#E1261C] hover:text-[#E1261C] transition-all duration-200"
              aria-label="Twitter"
            >
              𝕏
            </a>
            <a
              href="https://www.linkedin.com/feed/"
              className="w-9 h-9 border border-[#1A1A1A] rounded flex items-center justify-center text-[#D4D4D4] hover:border-[#E1261C] hover:text-[#E1261C] transition-all duration-200"
              aria-label="LinkedIn"
            >
              in
            </a>
            <a
              href="https://www.instagram.com/accounts/log_in/"
              className="w-9 h-9 border border-[#1A1A1A] rounded flex items-center justify-center text-[#D4D4D4] hover:border-[#E1261C] hover:text-[#E1261C] transition-all duration-200"
              aria-label="Instagram"
            >
              ◉
            </a>
            <a
              href="https://workspace.google.com/intl/en-US/gmail/"
              className="w-9 h-9 border border-[#1A1A1A] rounded flex items-center justify-center text-[#D4D4D4] hover:border-[#E1261C] hover:text-[#E1261C] transition-all duration-200"
              aria-label="Email"
            >
              @
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
