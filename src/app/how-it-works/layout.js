import JsonLd from '../components/seo/JsonLd';
import { breadcrumbJsonLd, pageCrumbs, pageMetadata } from '../lib/seo';

const PATH = '/how-it-works';

// The page itself is a client component, which cannot export metadata.
export const metadata = pageMetadata({
  title: 'How it works: from free search to payout',
  description:
    'Six steps from a free search of California unclaimed property to money in your account. About ten minutes of your time; California reviews claims within 180 days.',
  path: PATH,
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(pageCrumbs('How it works', PATH))} />
      {children}
    </>
  );
}
