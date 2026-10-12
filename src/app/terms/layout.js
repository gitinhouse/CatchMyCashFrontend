import JsonLd from '../components/seo/JsonLd';
import { breadcrumbJsonLd, pageCrumbs, pageMetadata } from '../lib/seo';

const PATH = '/terms';

// The page itself is a client component, which cannot export metadata.
export const metadata = pageMetadata({
  title: 'Terms of service',
  description:
    'The terms that govern use of the CatchMyCash website and our unclaimed property recovery service.',
  path: PATH,
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(pageCrumbs('Terms', PATH))} />
      {children}
    </>
  );
}
