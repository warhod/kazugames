import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Sign in',
};

function LoginFallback() {
  return (
    <div className="relative z-10 px-6 py-16 flex justify-center min-h-[calc(100vh-7rem)] md:min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md glass-card p-8 h-72 skeleton" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
