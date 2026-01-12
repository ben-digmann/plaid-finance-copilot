
import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { createLinkToken, exchangePublicToken, syncTransactions, syncAccounts } from '../api';
import { useQueryClient } from '@tanstack/react-query';

export default function PlaidLinkButton() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    // 1. Fetch Link Token
    async function init() {
      try {
        const data = await createLinkToken();
        if (data && data.link_token) {
          setToken(data.link_token);
          setReady(true);
        }
      } catch (e) {
        console.error("Failed to create link token", e);
      }
    }
    init();
  }, []);

  const openValid = () => {
    if (!token || !window.Plaid) return;
    setLoading(true);

    const handler = window.Plaid.create({
      token: token,
      onSuccess: async (public_token, metadata) => {
        setLoading(true);
        try {
          await exchangePublicToken(public_token, metadata.institution.name);
          // Auto-sync immediately after linking
          console.log("Syncing data...");
          await Promise.all([syncAccounts(), syncTransactions()]);

          qc.invalidateQueries({ queryKey: ['summary'] });
          qc.invalidateQueries({ queryKey: ['transactions'] });
          alert("Account connected & data synced!");
        } catch (err) {
          console.error(err);
          alert("Failed to exchange token");
        } finally {
          setLoading(false);
        }
      },
      onExit: (err, metadata) => {
        setLoading(false);
        if (err) console.error(err);
      },
      onEvent: (eventName, metadata) => {
        // console.log(eventName, metadata);
      }
    });

    handler.open();
  };

  return (
    <button
      onClick={openValid}
      disabled={!ready || loading}
      className={`glass-button flex items-center gap-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 ${(!ready || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
      <span className="hidden md:inline">Connect Accounts</span>
    </button>
  );
}
