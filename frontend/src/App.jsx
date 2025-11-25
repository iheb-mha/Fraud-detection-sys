import React, { useState, useCallback, useEffect } from 'react';
import { predict, predictModel, getMyAnalyses } from './api.js';
import Login from './Login.jsx';
import Register from './Register.jsx';

// --- Styles (Simulated Tailwind/Modern CSS for a cleaner look) ---
const styles = {
  container: {
    maxWidth: 760,
    margin: '24px auto',
    padding: '20px',
    fontFamily: 'Inter, system-ui, Arial, sans-serif',
    background:
      'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))',
    borderRadius: '16px',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(148,163,184,0.5)',
    color: '#e5e7eb',
  },
  tabsBar: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid rgba(55,65,81,0.9)',
    marginBottom: '16px',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#9ca3af',
    backgroundColor: 'transparent',
  },
  tabActive: {
    background:
      'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#f9fafb',
  },
  title: {
    textAlign: 'center',
    color: '#f9fafb',
    marginBottom: '24px',
  },
  formGrid: {
    display: 'grid',
    gap: '16px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontWeight: '500',
    color: '#e5e7eb',
  },
  input: {
    padding: '10px',
    border: '1px solid rgba(148,163,184,0.8)',
    borderRadius: '8px',
    marginTop: '4px',
    fontSize: '14px',
    backgroundColor: 'rgba(15,23,42,0.95)',
    color: '#e5e7eb',
  },
  button: {
    padding: '12px 20px',
    background:
      'linear-gradient(135deg, #22c55e, #16a34a)',
    color: 'white',
    fontWeight: '600',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.1s',
    marginTop: '12px',
    boxShadow: '0 14px 32px rgba(22,163,74,0.45)',
  },
  buttonDisabled: {
    backgroundColor: '#22c55e55',
    cursor: 'not-allowed',
  },
  error: {
    color: '#fecaca',
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'rgba(127,29,29,0.45)',
    borderRadius: '8px',
    border: '1px solid rgba(248,113,113,0.6)',
  },
  resultBox: {
    marginTop: '24px',
    padding: '20px',
    border: '1px solid rgba(148,163,184,0.7)',
    borderRadius: '10px',
    backgroundColor: 'rgba(15,23,42,0.98)',
  },
  expertGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    padding: '12px',
    border: '1px dashed rgba(148,163,184,0.8)',
    borderRadius: '8px',
    marginTop: '8px',
    backgroundColor: 'rgba(15,23,42,0.96)',
  },
  checkboxLabel: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontWeight: '500',
    color: '#e5e7eb',
  }
};

// --- Component Label (Enhanced Visuals) ---
function Label({ prob }) {
  const isFraud = prob > 0.5;
  const label = isFraud ? 'FRAUDE DÉTECTÉE' : 'Transaction Sûre';
  const color = isFraud ? '#dc2626' : '#16a34a';
  const percentage = (prob * 100).toFixed(1);

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ margin: 0, fontSize: '18px', color: '#4b5563' }}>
        <strong>Probabilité de Fraude:</strong> {percentage}%
      </p>
      <h3 style={{ marginTop: '8px', fontWeight: 'bold', color, fontSize: '24px', margin: 0 }}>
        {label}
      </h3>
      <div style={{ marginTop: '12px', background: '#e5e7eb', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.round(prob * 100)}%`,
            height: '100%',
            background: color,
            borderRadius: '6px',
            transition: 'width 0.5s ease-in-out',
          }}
        />
      </div>
    </div>
  );
}

// --- Main Component App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [analyses, setAnalyses] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState('single'); // 'single' | 'batch'

  const [form, setForm] = useState({
    amount: 0,
    time: 0,
    card_present: true,
    country_mismatch: false,
    velocity_5m: 0,
    expert: false,
    useModel: false,
    v: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [batchFileName, setBatchFileName] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [batchError, setBatchError] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  // Résumé global pour l'analyse par fichier (calculé côté frontend)
  const batchSummary = (() => {
    if (!batchResults || batchResults.length === 0) return null;

    let totalProb = 0;
    let countWithProb = 0;
    let fraudCount = 0;
    const criticalRows = [];
    const borderlineRows = [];

    batchResults.forEach((row, idx) => {
      const p = row.output && typeof row.output.fraud_probability === 'number'
        ? row.output.fraud_probability
        : null;
      const label = row.output && typeof row.output.fraud_label === 'number'
        ? row.output.fraud_label
        : null;

      if (p !== null) {
        totalProb += p;
        countWithProb += 1;

        // Transactions très risquées
        if (p >= 0.8) {
          criticalRows.push(idx + 1); // ligne 1-based dans le fichier (hors en-tête)
        }

        // Cas borderline ~50% à vérifier manuellement
        if (p >= 0.45 && p <= 0.55) {
          borderlineRows.push(idx + 1);
        }
      }

      if (label === 1) {
        fraudCount += 1;
      }
    });

    if (countWithProb === 0) return null;

    const avgProb = totalProb / countWithProb;
    const fraudRate = fraudCount / batchResults.length;

    return {
      avgProb,
      fraudRate,
      criticalRows,
      borderlineRows,
      totalRows: batchResults.length,
    };
  })();

  // Optimized update function using useCallback
  const update = useCallback((k, v) => setForm(prev => ({ ...prev, [k]: v })), []);

  // Handler for V-features in expert mode
  const updateV = useCallback((key, value) => {
    setForm(prev => ({
      ...prev,
      v: {
        ...prev.v,
        [key]: value === '' ? undefined : Number(value)
      }
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let data;
      // Squelette/Logique conservée: Appel conditionnel de l'API
      if (form.expert && form.useModel) {
        const features = { Time: Number(form.time) || 0, Amount: Number(form.amount) || 0 };
        for (let i = 1; i <= 28; i++) {
          const key = `V${i}`;
          const val = form.v?.[key];
          features[key] = (val === undefined || val === null || val === '') ? 0 : Number(val);
        }
        data = await predictModel(features);
      } else {
        const body = { ...form };
        delete body.expert;
        delete body.useModel;
        data = await predict(body);
      }
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Une erreur inattendue est survenue lors de la prédiction.');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = loading
    ? { ...styles.button, ...styles.buttonDisabled }
    : styles.button;

  const handleAuthSuccess = async (data) => {
    setUser(data.user || null);
    setShowHistory(false);
  };

  const handleLogout = () => {
    setUser(null);
    setAnalyses([]);
    setShowHistory(false);
    window.localStorage.removeItem('auth_token');
  };

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token');
    if (!token) {
      setAnalyses([]);
      setShowHistory(false);
    }
  }, []);

  const handleToggleHistory = async () => {
    if (!showHistory) {
      try {
        const resp = await getMyAnalyses();
        setAnalyses(resp.analyses || []);
      } catch {
        // on ignore les erreurs pour ne pas bloquer l'UI
      }
    }
    setShowHistory(prev => !prev);
  };

  const handleBatchFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchFileName(file.name);
    setBatchError('');
    setBatchResults([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result;
      if (typeof text !== 'string') {
        setBatchError('Impossible de lire le fichier.');
        return;
      }

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setBatchError('Le fichier semble vide ou ne contient pas de données.');
        return;
      }

      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const idxAmount = header.indexOf('amount');
      const idxTime = header.indexOf('time');
      const idxVelocity = header.indexOf('velocity_5m');
      const idxCardPresent = header.indexOf('card_present');
      const idxCountryMismatch = header.indexOf('country_mismatch');

      if (idxAmount === -1 || idxCardPresent === -1 || idxCountryMismatch === -1) {
        setBatchError('Le fichier doit au minimum contenir les colonnes amount, card_present, country_mismatch.');
        return;
      }

      setBatchLoading(true);
      try {
        const rows = lines.slice(1);
        const results = [];

        for (const line of rows) {
          if (!line) continue;
          const cols = line.split(',');
          const tx = {
            amount: Number(cols[idxAmount] || 0),
            time: idxTime !== -1 ? Number(cols[idxTime] || 0) : 0,
            card_present: String(cols[idxCardPresent] || '').toLowerCase() === 'true',
            country_mismatch: String(cols[idxCountryMismatch] || '').toLowerCase() === 'true',
            velocity_5m: idxVelocity !== -1 ? Number(cols[idxVelocity] || 0) : 0,
          };

          try {
            const res = await predict(tx);
            results.push({ input: tx, output: res });
          } catch (err) {
            results.push({ input: tx, error: err?.message || 'Erreur lors de la prédiction' });
          }
        }

        setBatchResults(results);
      } catch (err) {
        setBatchError(err?.message || 'Erreur lors du traitement du fichier.');
      } finally {
        setBatchLoading(false);
      }
    };

    reader.readAsText(file);
  };

  if (!user) {
    return authView === 'login' ? (
      <Login
        onSuccess={handleAuthSuccess}
        switchToRegister={() => setAuthView('register')}
      />
    ) : (
      <Register
        onSuccess={handleAuthSuccess}
        switchToLogin={() => setAuthView('login')}
      />
    );
  }

  return (

    <div style={styles.container}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <h1 style={styles.title}>Analyse de Risque de Fraude</h1>
        <div
          style={{
            minWidth: 220,
            textAlign: 'right',
            padding: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(148,163,184,0.4)',
          }}
        >
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Connecté</div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleToggleHistory}
              style={{ ...styles.button, padding: '6px 12px', marginTop: 0 }}
            >
              {showHistory ? 'Historique masqué' : 'Voir historique'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                ...styles.button,
                padding: '6px 12px',
                marginTop: 0,
                background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
              }}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
      <div style={styles.tabsBar}>
        <button
          type="button"
          onClick={() => setMode('single')}
          style={mode === 'single' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
        >
          Analyse simple
        </button>
        <button
          type="button"
          onClick={() => setMode('batch')}
          style={mode === 'batch' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
        >
          Analyse par fichier
        </button>
      </div>

      {mode === 'single' && (
        <form onSubmit={handleSubmit} style={styles.formGrid}>

        {/* Section 1: Paramètres de Base */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            columnGap: 16,
            rowGap: 12,
          }}
        >
          <label style={styles.label}>
            Montant de la Transaction (€)
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={e => update('amount', Number(e.target.value))}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Temps écoulé (s depuis 1ère transaction)
            <input
              type="number"
              value={form.time}
              onChange={e => update('time', Number(e.target.value))}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Vélocité (Transactions sur 5 minutes)
            <input
              type="number"
              value={form.velocity_5m}
              onChange={e => update('velocity_5m', Number(e.target.value))}
              style={styles.input}
            />
          </label>
        </div>

        {/* Section 2: Indicateurs Binaires */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: 16,
            rowGap: 12,
            marginTop: 8,
          }}
        >
          <label style={styles.label}>
            Carte Présente ?
            <select
              value={form.card_present ? 'true' : 'false'}
              onChange={e => update('card_present', e.target.value === 'true')}
              style={styles.input}
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </label>
          <label style={styles.label}>
            Pays de Transaction Différent ?
            <select
              value={form.country_mismatch ? 'true' : 'false'}
              onChange={e => update('country_mismatch', e.target.value === 'true')}
              style={styles.input}
            >
              <option value="false">Non</option>
              <option value="true">Oui</option>
            </select>
          </label>
        </div>

        {/* Section 3: Mode Expert */}
        <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.expert}
              onChange={e => update('expert', e.target.checked)}
            />
            Mode Expert (Variables V1 à V28)
          </label>

          {form.expert && (
            <>
              <div style={styles.expertGrid}>
                {Array.from({ length: 28 }, (_, i) => `V${i + 1}`).map(k => (
                  <label key={k} style={styles.label}>
                    {k}
                    <input
                      type="number"
                      step="0.001"
                      value={form.v?.[k] ?? ''}
                      onChange={e => updateV(k, e.target.value)}
                      style={styles.input}
                    />
                  </label>
                ))}
              </div>

              <label style={{ ...styles.checkboxLabel, marginTop: '12px' }}>
                <input
                  type="checkbox"
                  checked={form.useModel}
                  onChange={e => update('useModel', e.target.checked)}
                />
                Utiliser le Modèle Python (Isolation Forest)
              </label>
            </>
          )}
        </div>

        {/* Bouton de Soumission */}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Analyse en cours...' : 'Lancer la Vérification'}
        </button>
      </form>
      )}

      {mode === 'batch' && (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: 0, color: '#4b5563', fontSize: 14 }}>
              Importez un fichier <strong>CSV</strong> exporté depuis Excel contenant les colonnes :
              <strong> amount, card_present, country_mismatch</strong> (optionnellement <strong>time, velocity_5m</strong>).
            </p>
          </div>
          <label style={styles.label}>
            Fichier CSV de transactions
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleBatchFile}
              style={styles.input}
            />
          </label>
          {batchFileName && (
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Fichier sélectionné : {batchFileName}</p>
          )}
          {batchError && <div style={styles.error}>{batchError}</div>}
          {batchLoading && <p style={{ marginTop: 12, color: '#4b5563' }}>Analyse du fichier en cours...</p>}
          {batchResults && batchResults.length > 0 && (
            <div style={styles.resultBox}>
              <h4 style={{ color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '8px' }}>
                Résultats de l'analyse par fichier ({batchResults.length} lignes)
              </h4>

              {batchSummary && (
                <div style={{ marginBottom: 12, fontSize: 14 }}>
                  <p style={{ margin: '4px 0', color: '#e5e7eb' }}>
                    Probabilité moyenne de fraude :{' '}
                    <strong>{(batchSummary.avgProb * 100).toFixed(1)}%</strong>
                  </p>
                  <p style={{ margin: '4px 0', color: '#e5e7eb' }}>
                    Taux de lignes marquées comme fraude :{' '}
                    <strong>{(batchSummary.fraudRate * 100).toFixed(1)}%</strong> ({batchSummary.totalRows} lignes)
                  </p>
                  {batchSummary.criticalRows.length > 0 && (
                    <p style={{ margin: '4px 0', color: '#fecaca' }}>
                      Lignes très critiques (p ≥ 80% à vérifier en priorité) :{' '}
                      <strong>{batchSummary.criticalRows.join(', ')}</strong>
                    </p>
                  )}
                  {batchSummary.borderlineRows.length > 0 && (
                    <p style={{ margin: '4px 0', color: '#e5e7eb' }}>
                      Lignes borderline autour de 50% (≈50% de probabilité) :{' '}
                      <strong>{batchSummary.borderlineRows.join(', ')}</strong>. Ces transactions
                      doivent être revérifiées manuellement et idéalement ré-analysées en
                      <strong> mode expert (vecteurs V1–V28)</strong> pour obtenir plus de détails
                      et être plus sûr du résultat.
                    </p>
                  )}
                </div>
              )}

              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(15,23,42,0.95)' }}>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #1f2937', textAlign: 'left', color: '#e5e7eb' }}>Ligne / ID</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #1f2937', textAlign: 'left', color: '#e5e7eb' }}>Montant</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #1f2937', textAlign: 'left', color: '#e5e7eb' }}>Carte présente</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #1f2937', textAlign: 'left', color: '#e5e7eb' }}>Pays différent</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #1f2937', textAlign: 'left', color: '#e5e7eb' }}>Prob. fraude</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #1f2937', textAlign: 'left', color: '#e5e7eb' }}>Label</th>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #1f2937', textAlign: 'left', color: '#e5e7eb' }}>Erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map((row, idx) => {
                      const p = row.output && typeof row.output.fraud_probability === 'number'
                        ? row.output.fraud_probability
                        : null;
                      const isCritical = p !== null && p >= 0.8;
                      const isBorderline = p !== null && p >= 0.45 && p <= 0.55;

                      const rowStyle = {
                        borderBottom: '1px solid #1f2937',
                        backgroundColor: isCritical
                          ? 'rgba(239,68,68,0.25)'
                          : isBorderline
                            ? 'rgba(234,179,8,0.18)'
                            : 'transparent',
                        color: '#e5e7eb',
                      };

                      return (
                        <tr key={idx} style={rowStyle}>
                          <td style={{ padding: '4px 8px' }}>{row.input.id ?? idx + 1}</td>
                          <td style={{ padding: '4px 8px' }}>{row.input.amount}</td>
                          <td style={{ padding: '4px 8px' }}>{row.input.card_present ? 'Oui' : 'Non'}</td>
                          <td style={{ padding: '4px 8px' }}>{row.input.country_mismatch ? 'Oui' : 'Non'}</td>
                          <td style={{ padding: '4px 8px' }}>
                            {p !== null ? (p * 100).toFixed(1) + '%' : '-'}
                          </td>
                          <td style={{ padding: '4px 8px' }}>
                            {row.output && typeof row.output.fraud_label === 'number'
                              ? row.output.fraud_label === 1 ? 'Fraude' : 'OK'
                              : '-'}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#fecaca' }}>{row.error || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affichage des Messages */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Affichage des Résultats */}
      {result && (
        <div style={styles.resultBox}>
          <Label prob={result.fraud_probability} />
          {result.explanations && result.explanations.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '8px' }}>
                Facteurs d'Explication (SHAP)
              </h4>
              <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                {result.explanations.map((e, idx) => (
                  <li key={idx} style={{ padding: '4px 0', borderBottom: '1px dotted #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{e.factor}</span>
                    <span style={{ fontWeight: 'bold', color: e.contribution > 0 ? '#dc2626' : '#16a34a' }}>
                      {e.contribution > 0 ? `+${e.contribution.toFixed(4)}` : e.contribution.toFixed(4)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Historique simple des analyses de l'utilisateur connecté (affiché via le bouton) */}
      {showHistory && analyses && analyses.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: 4, marginBottom: 8 }}>
            Historique récent
          </h3>
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {analyses.slice(0, 5).map(a => (
              <li key={a._id} style={{ padding: '6px 0', borderBottom: '1px dotted #e5e7eb', fontSize: 14 }}>
                <strong>{new Date(a.createdAt).toLocaleString()}</strong> — prob: {a.result?.fraud_probability} — label: {a.result?.fraud_label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}