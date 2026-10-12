import AdminShell from './_components/AdminShell';
import { privateMetadata } from '../lib/seo';

export const metadata = {
  ...privateMetadata({ absolute: 'Admin Console · CatchMyCash' }),
  description: 'Manage claims, users, documents and automation.',
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
