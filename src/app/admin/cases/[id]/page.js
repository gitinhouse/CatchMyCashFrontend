'use client';

import React, { Suspense, use } from 'react';
import CaseDetailClient from './CaseDetailClient';
import { LoadingBlock } from '../../_components/ui';

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<LoadingBlock label="Loading case…" />}>
      <CaseDetailClient caseId={id} />
    </Suspense>
  );
}
