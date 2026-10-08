import JsonLd from '../components/seo/JsonLd';
import { breadcrumbJsonLd, faqPageJsonLd, pageCrumbs, pageMetadata } from '../lib/seo';
import { FAQS } from '../lib/content/faqs';

const PATH = '/faq';

// The page itself is a client component, which cannot export metadata.
export const metadata = pageMetadata({
  title: 'Frequently asked questions',
  description:
    'Straight answers about CatchMyCash: what searching and claiming cost, the 10% fee, documents, timing, tracking your claim, and how we differ from the State of California.',
  path: PATH,
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={[faqPageJsonLd(FAQS, PATH), breadcrumbJsonLd(pageCrumbs('FAQ', PATH))]} />
      {children}
    </>
  );
}
