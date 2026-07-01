'use client';

import { FormEvent, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState('/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(params.get('callbackUrl') || params.get('redirect') || '/');
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.error) {
      setError('Unable to sign in. Check your email and password.');
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use your email and password to access your account.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
            data-testid="login-email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
            data-testid="login-password"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" data-testid="login-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          data-testid="login-submit"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
