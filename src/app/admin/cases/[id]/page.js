'use client';

import React, { Suspense, use } from 'react';
import CaseDetailClient from './CaseDetailClient';
import { DetailSkeleton } from '../../_components/ui';

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<DetailSkeleton label="Loading case…" />}>
      <CaseDetailClient caseId={id} />
    </Suspense>
  );
}
