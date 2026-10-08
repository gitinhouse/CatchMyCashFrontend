import Link from 'next/link';
import { PUBLIC_PAGES } from './lib/site';

export const metadata = {
  title: 'Page not found',
};

// A dead link still lands somewhere useful: every public page is one click
// away from here.
export default function NotFound() {
  const pages = PUBLIC_PAGES.filter(
    (page) => !['/privacy', '/terms', '/cookies'].includes(page.path),
  );
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-[880px] mx-auto px-6 sm:px-8">
        <p className="font-['JetBrains_Mono'] text-[13px] tracking-[0.15em] uppercase text-[#E1261C] mb-5">
          404
        </p>
        <h1 className="font-['Fraunces'] text-[clamp(36px,5.5vw,60px)] font-semibold tracking-[-0.02em] leading-[1.05] mb-5 text-[#0A0A0A]">
          This page isn’t here.
        </h1>
        <p className="text-lg text-[#4A4A4A] mb-10 max-w-[55ch]">
          The link may be old or mistyped. Here is where you can go instead.
        </p>
        <ul className="grid sm:grid-cols-2 gap-4">
          {pages.map((page) => (
            <li key={page.path}>
              <Link
                href={page.path}
                className="block h-full border border-[#E8E6E3] rounded-lg p-5 hover:border-[#E1261C] transition-colors"
              >
                <span className="block font-['Fraunces'] text-lg font-semibold text-[#0A0A0A] mb-1">
                  {page.path === '/' ? 'Home' : page.title}
                </span>
                <span className="block text-sm text-[#4A4A4A]">{page.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
