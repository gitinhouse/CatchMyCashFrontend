'use client';

import React, { Suspense } from 'react';
import AttentionClient from './AttentionClient';
import { LoadingBlock } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading action queue…" />}>
      <AttentionClient />
    </Suspense>
  );
}
