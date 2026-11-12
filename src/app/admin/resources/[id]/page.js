'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ArticleEditor from '../_components/ArticleEditor';

export default function Page() {
  const { id } = useParams();
  return <ArticleEditor key={id} id={String(id || '')} />;
}
