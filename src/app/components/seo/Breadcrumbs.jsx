import Link from 'next/link';
import JsonLd from './JsonLd';
import { breadcrumbJsonLd } from '../../lib/seo';

/**
 * The trail from the home page to this one, drawn for visitors and described
 * as a BreadcrumbList for search engines. crumbs: [{ name, path }].
 */
export default function Breadcrumbs({ crumbs, className = '', tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <nav aria-label="Breadcrumb" className={className}>
        <ol
          className={`flex flex-wrap items-center gap-1.5 font-['JetBrains_Mono'] text-[12px] tracking-[0.05em] uppercase ${
            dark ? 'text-[#A3A3A3]' : 'text-[#888888]'
          }`}
        >
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className={dark ? 'text-white' : 'text-[#4A4A4A]'}>
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.path} className={`transition-colors ${dark ? 'hover:text-white' : 'hover:text-[#E1261C]'}`}>
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
