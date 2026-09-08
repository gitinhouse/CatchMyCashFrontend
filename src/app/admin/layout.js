import AdminShell from './_components/AdminShell';

export const metadata = {
  title: 'Admin Console · CatchMyCash',
  description: 'Manage claims, users, documents and automation.',
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
