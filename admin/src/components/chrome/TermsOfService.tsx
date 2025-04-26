'use client';

import { useState, useEffect } from 'react';
import { retrieveLatestTerms, acceptTerms } from '@/lib/chrome/terms';

export function TermsOfService() {
  const [terms, setTerms] = useState<{
    content: string;
    version: string;
    accepted: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTerms();
  }, []);

  async function loadTerms() {
    try {
      const latestTerms = await retrieveLatestTerms();
      setTerms(latestTerms);
    } catch (err) {
      setError('Failed to load terms of service');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptTerms() {
    if (!terms) return;

    try {
      await acceptTerms(terms.version);
      setTerms({ ...terms, accepted: true });
    } catch (err) {
      setError('Failed to accept terms of service');
    }
  }

  if (loading) return <div>Loading terms of service...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!terms) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
      <div className="prose">
        <pre className="whitespace-pre-wrap">{terms.content}</pre>
      </div>
      {!terms.accepted && (
        <div className="mt-4">
          <button
            onClick={handleAcceptTerms}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Accept Terms
          </button>
        </div>
      )}
    </div>
  );
}