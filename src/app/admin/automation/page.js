'use client';

import React, { Suspense } from 'react';
import AutomationClient from './AutomationClient';
import { LoadingBlock } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading automation monitor…" />}>
      <AutomationClient />
    </Suspense>
  );
}
