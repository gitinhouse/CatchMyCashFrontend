'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Legacy route. The claims list now lives in the admin console at
 * /admin/cases, so keep old links and bookmarks working by forwarding.
 */
function Redirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');

  useEffect(() => {
    router.replace(caseId ? `/admin/cases/${caseId}` : '/admin/cases');
  }, [router, caseId]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Redirect />
    </Suspense>
  );
}
