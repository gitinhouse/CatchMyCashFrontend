import JsonLd from '../components/seo/JsonLd';
import { breadcrumbJsonLd, pageCrumbs, pageMetadata } from '../lib/seo';

const PATH = '/cookies';

// The page itself is a client component, which cannot export metadata.
export const metadata = pageMetadata({
  title: 'Cookie policy',
  description:
    'The cookies CatchMyCash uses, what each one does, and how to change your cookie choices.',
  path: PATH,
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(pageCrumbs('Cookies', PATH))} />
      {children}
    </>
  );
}
