import React, { useState } from 'react';
import { loginUser } from './api.js';

export default function Login({ onSuccess, switchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginUser({ email, password });
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at 0% 0%, #1f2937 0, #020617 40%, #020617 100%), radial-gradient(circle at 100% 100%, #0f172a 0, #020617 45%)',
        color: '#e5e7eb',
      }}
   >
      <div
        style={{
          position: 'relative',
          maxWidth: 420,
          width: '100%',
          padding: '28px 26px 24px',
          borderRadius: 18,
          background:
            'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.75))',
          boxShadow:
            '0 20px 45px rgba(0,0,0,0.55), 0 0 0 1px rgba(148,163,184,0.15)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(148,163,184,0.35)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 18,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 10% 0%, rgba(56,189,248,0.18) 0, transparent 45%), radial-gradient(circle at 100% 100%, rgba(52,211,153,0.14) 0, transparent 45%)',
            opacity: 0.9,
          }}
        />
        <div style={{ position: 'relative' }}>
          <header style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: 6 }}>
              Secure Fraud Analytics
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Connexion à la plateforme
            </h2>
            <p style={{ marginTop: 6, fontSize: 13, color: '#9ca3af' }}>
              Accédez à votre espace d'analyse de fraude et à vos tableaux de bord sécurisés.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}
          >
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 13,
                color: '#e5e7eb',
              }}
            >
              Email professionnel
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  padding: '11px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.6)',
                  background: 'rgba(15,23,42,0.85)',
                  color: '#e5e7eb',
                  fontSize: 14,
                  outline: 'none',
                  boxShadow: '0 0 0 1px rgba(15,23,42,0.7)',
                }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 13,
                color: '#e5e7eb',
              }}
            >
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  padding: '11px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.6)',
                  background: 'rgba(15,23,42,0.85)',
                  color: '#e5e7eb',
                  fontSize: 14,
                  outline: 'none',
                  boxShadow: '0 0 0 1px rgba(15,23,42,0.7)',
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 2,
                marginBottom: 4,
                fontSize: 12,
              }}
            >
              <span style={{ color: '#9ca3af' }}>Authentification sécurisée</span>
              <button
                type="button"
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#a5b4fc',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  fontSize: 12,
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px 12px',
                borderRadius: 999,
                border: 'none',
                background:
                  'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#f9fafb',
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 12px 30px rgba(22,163,74,0.45)',
                marginTop: 4,
              }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <button
              type="button"
              onClick={switchToRegister}
              style={{
                padding: '10px 12px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.7)',
                background: 'rgba(15,23,42,0.6)',
                color: '#e5e7eb',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
                marginTop: 6,
              }}
            >
              S’inscrire
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(127,29,29,0.25)',
                color: '#fecaca',
                fontSize: 13,
                border: '1px solid rgba(248,113,113,0.45)',
              }}
            >
              {error}
            </div>
          )}

          <p
            style={{
              marginTop: 18,
              fontSize: 11,
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            Accès réservé. Toutes les connexions sont journalisées et monitorées pour la détection de fraude.
          </p>
        </div>
      </div>
    </div>
  );
}
