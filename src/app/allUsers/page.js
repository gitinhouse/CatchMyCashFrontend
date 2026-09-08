'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy route. User management now lives in the admin console at
 * /admin/users, so keep old links and bookmarks working by forwarding.
 */
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return null;
}
