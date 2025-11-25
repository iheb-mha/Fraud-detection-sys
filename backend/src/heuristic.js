export function computeRisk(tx) {
  let score = 0;
  const contrib = [];

  // Amount contribution
  if (tx.amount > 1000) {
    score += 0.45; contrib.push({ factor: 'amount_>1000', contribution: 0.45 });
  } else if (tx.amount > 200) {
    score += 0.25; contrib.push({ factor: 'amount_200_1000', contribution: 0.25 });
  } else if (tx.amount > 50) {
    score += 0.10; contrib.push({ factor: 'amount_50_200', contribution: 0.10 });
  }

  // Card not present
  if (tx.card_present === false) {
    score += 0.25; contrib.push({ factor: 'card_not_present', contribution: 0.25 });
  }

  // Country mismatch
  if (tx.country_mismatch === true) {
    score += 0.20; contrib.push({ factor: 'country_mismatch', contribution: 0.20 });
  }

  // Velocity (transactions last 5 min)
  if (typeof tx.velocity_5m === 'number') {
    if (tx.velocity_5m >= 6) { score += 0.35; contrib.push({ factor: 'velocity_>=6', contribution: 0.35 }); }
    else if (tx.velocity_5m >= 3) { score += 0.20; contrib.push({ factor: 'velocity_3_5', contribution: 0.20 }); }
  }

  // Optional PCA components anomaly
  if (tx.v && typeof tx.v === 'object') {
    const keys = Object.keys(tx.v).filter(k => /^V([1-9]|1\d|2\d|28)$/.test(k));
    if (keys.length > 0) {
      const sumAbs = keys.reduce((acc, k) => acc + Math.abs(Number(tx.v[k]) || 0), 0);
      const anomaly = Math.min(1, sumAbs / 50);
      const c = 0.3 * anomaly;
      if (c > 0) {
        score += c; contrib.push({ factor: 'pca_anomaly', contribution: Number(c.toFixed(3)) });
      }
    }
  }

  // Clamp
  score = Math.max(0, Math.min(1, score));
  return { score, contributions: contrib };
}
