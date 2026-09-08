'use client';

import React, { Suspense } from 'react';
import UsersClient from './UsersClient';
import { LoadingBlock } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading users…" />}>
      <UsersClient />
    </Suspense>
  );
}
