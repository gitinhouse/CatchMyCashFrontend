'use client';

import React, { Suspense } from 'react';
import AutomationClient from './AutomationClient';
import { ListSkeleton } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={5} label="Loading automation monitor…" />}>
      <AutomationClient />
    </Suspense>
  );
}
