'use client';

import React, { Suspense } from 'react';
import ActivityClient from './ActivityClient';
import { LoadingBlock } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading audit log…" />}>
      <ActivityClient />
    </Suspense>
  );
}
