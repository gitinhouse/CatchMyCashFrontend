'use client';

import React, { Suspense } from 'react';
import AttentionClient from './AttentionClient';
import { ListSkeleton } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={5} label="Loading action queue…" />}>
      <AttentionClient />
    </Suspense>
  );
}
