'use client';

import React, { Suspense } from 'react';
import ActivityClient from './ActivityClient';
import { ListSkeleton } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={7} label="Loading audit log…" />}>
      <ActivityClient />
    </Suspense>
  );
}
