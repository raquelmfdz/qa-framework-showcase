'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?redirect=/profile');
  }, [status, router]);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setName(data.name ?? '');
        setLastName(data.last_name ?? '');
        setZipCode(data.zip_code ?? '');
        setAddress(data.address ?? '');
      }
    }
    if (status === 'authenticated') loadProfile();
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, lastName, zipCode, address }),
    });

    setSaving(false);

    if (!res.ok) {
      setError('Failed to save changes. Please try again.');
      return;
    }

    await update({ name });
    setSuccess('Profile updated successfully.');
  }

  if (status === 'loading') {
    return <div className="glass-panel rounded-xl p-6 text-orange-100">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="glass-panel rounded-xl p-6">
        <h1 className="text-2xl font-bold text-orange-200">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Changes apply to future orders only. Your email cannot be changed.
        </p>
      </div>

      <div className="glass-panel rounded-xl p-6">
        {/* Email — read only, orange to signal it's locked */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-slate-400">
            Email{' '}
            <span className="text-orange-400/70 text-xs font-normal">(cannot be changed)</span>
          </label>
          <p className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-2 text-sm text-orange-300">
            {session?.user?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="edit-profile-form">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-orange-100">
              First Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-orange-100 placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              placeholder="Your first name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-orange-100">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-orange-100 placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              placeholder="Your last name"
            />
          </div>

          <div>
            <label htmlFor="zipCode" className="mb-1 block text-sm font-medium text-orange-100">
              Zip Code
            </label>
            <input
              id="zipCode"
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-orange-100 placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              placeholder="Your zip code"
            />
          </div>

          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-orange-100">
              Shipping Address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-orange-100 placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              placeholder="Your default shipping address"
            />
          </div>

          {success && (
            <p role="alert" className="text-sm text-green-400">
              {success}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            data-testid="save-profile"
            className="w-full rounded-full bg-orange-500 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
