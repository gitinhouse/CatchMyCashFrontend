'use client';

import React, { Suspense } from 'react';
import CasesClient from './CasesClient';
import { LoadingBlock } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading claims…" />}>
      <CasesClient />
    </Suspense>
  );
}
