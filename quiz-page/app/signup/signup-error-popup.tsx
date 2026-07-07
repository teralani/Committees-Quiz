'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SignupErrorPopup({ error }: { error?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryError = searchParams.get('error') || '';
  const message = queryError || error || '';
  const [open, setOpen] = useState(Boolean(message));

  useEffect(() => {
    setOpen(Boolean(message));
  }, [message]);

  const dismiss = () => {
    setOpen(false);
    router.replace('/signup');
  };

  if (!open || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="signup-error-title"
        aria-describedby="signup-error-description"
        className="w-full max-w-md rounded-2xl border border-red-400/30 bg-zinc-950 p-6 text-zinc-100 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        
        <div className='mt-2'>
            <p id="signup-error-title" className="text-lg font-semibold text-red-200">
              Sign-up blocked
            </p>
            <p id="signup-error-description" className="mt-1 text-sm leading-6 text-zinc-300">
              {message}
            </p>
        </div>
      

        <div className="flex items-start justify-between gap-4 mt-5">
          <div className="mt-4 flex justify-end">
            <button
                type="button"
                onClick={dismiss}
                className="rounded-xl bg-red-500 px-8 py-2 text-sm font-medium text-white transition hover:bg-red-400"
            >
                OK
            </button>
            </div>

          <button
            type="button"
              onClick={dismiss}
            className="rounded-xl border border-white/10 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white mt-5 px-4 py-2"
            aria-label="Dismiss sign-up error"
          >
            Close
          </button>
        </div>

        </div>
    </div>
  );
}