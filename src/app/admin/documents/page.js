'use client';

import React, { Suspense } from 'react';
import DocumentsClient from './DocumentsClient';
import { LoadingBlock } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading documents…" />}>
      <DocumentsClient />
    </Suspense>
  );
}
