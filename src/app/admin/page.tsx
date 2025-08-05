// src/app/admin/page.tsx
'use client';

import { AdminPanel } from '@/components/AdminPanel';
import { PageWrapper } from '@/components/PageWrapper';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['Admin', 'Moderator']}>
      <PageWrapper title="Admin Panel">
        <AdminPanel />
      </PageWrapper>
    </ProtectedRoute>
  );
}
