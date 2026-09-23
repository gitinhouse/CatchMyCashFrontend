'use client';

import React, { Suspense } from 'react';
import UsersClient from './UsersClient';
import { TableSkeleton } from '../_components/ui';

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton columns={8} rows={8} label="Loading users…" />}>
      <UsersClient />
    </Suspense>
  );
}
