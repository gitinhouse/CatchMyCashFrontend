import JsonLd from '../components/seo/JsonLd';
import { breadcrumbJsonLd, pageCrumbs, pageMetadata } from '../lib/seo';

const PATH = '/privacy';

// The page itself is a client component, which cannot export metadata.
export const metadata = pageMetadata({
  title: 'Privacy policy',
  description:
    'What personal information CatchMyCash collects to file your unclaimed property claim, how it is protected and shared with the state, and your privacy rights.',
  path: PATH,
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(pageCrumbs('Privacy', PATH))} />
      {children}
    </>
  );
}
