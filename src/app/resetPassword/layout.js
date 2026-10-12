import { privateMetadata } from '../lib/seo';

// Signed-in or per-person page: kept out of search results.
export const metadata = privateMetadata('Reset password');

export default function Layout({ children }) {
  return children;
}
