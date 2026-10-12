import JsonLd from '../components/seo/JsonLd';
import { breadcrumbJsonLd, pageCrumbs, pageMetadata } from '../lib/seo';

const PATH = '/contact';

// The page itself is a client component, which cannot export metadata.
export const metadata = pageMetadata({
  title: 'Contact us',
  description:
    'Questions about a claim, your data, or anything else? Email help@catchmycash.com or use the form. A person replies within one business day.',
  path: PATH,
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(pageCrumbs('Contact', PATH))} />
      {children}
    </>
  );
}
