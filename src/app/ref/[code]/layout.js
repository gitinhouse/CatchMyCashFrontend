import { privateMetadata } from '../../lib/seo';

// Signed-in or per-person page: kept out of search results.
export const metadata = privateMetadata("You were referred to CatchMyCash");

export default function Layout({ children }) {
  return children;
}
