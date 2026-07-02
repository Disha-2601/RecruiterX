'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/project/new');
  }, [router]);

  return null;
}
