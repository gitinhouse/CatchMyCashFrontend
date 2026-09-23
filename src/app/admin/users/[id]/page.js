'use client';

import React, { Suspense, use } from 'react';
import UserDetailClient from './UserDetailClient';
import { DetailSkeleton } from '../../_components/ui';

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<DetailSkeleton label="Loading user…" />}>
      <UserDetailClient userId={id} />
    </Suspense>
  );
}
