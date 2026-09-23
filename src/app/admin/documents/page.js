'use client';

import React, { Suspense } from 'react';
import DocumentsClient from './DocumentsClient';
import { ListSkeleton } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} label="Loading documents…" />}>
      <DocumentsClient />
    </Suspense>
  );
}
