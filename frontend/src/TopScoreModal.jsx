import { useState } from 'react';
import { ApiError, submitScore } from './api.js';

const NETWORK_MESSAGES = new Set(['בדוק את החיבור לאינטרנט', 'שגיאה בחיבור לשרת']);

const TITLES = {
  record: 'כל הכבוד אלוף! קבעת שיא נקודות חדש',
  top5: 'כל הכבוד! נכנסת לרשימת חמשת השיאנים הגדולים',
};

export default function TopScoreModal({ open, tier, score, onSaved, onSkip }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await submitScore(trimmed, score);
      onSaved();
    } catch (err) {
      const text =
        err instanceof ApiError && NETWORK_MESSAGES.has(err.userMessage) ? err.userMessage : 'נכשל בשמירת הניקוד';
      setError(text);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="win-overlay" role="dialog" aria-modal="true">
      <div className="win-modal">
        <h2>{TITLES[tier]}</h2>
        <p className="final-score-label">ניקוד סופי</p>
        <p className="final-score-value">{score}</p>

        {error && <div className="settings-message error">{error}</div>}

        <input
          type="text"
          className="name-input"
          placeholder="השם שלך"
          value={name}
          disabled={saving}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />

        <div className="settings-footer">
          <button type="button" className="new-game-btn" disabled={saving || !name.trim()} onClick={handleSave}>
            {saving ? 'טעינה...' : 'שמור ניקוד'}
          </button>
          <button type="button" className="cancel-btn" disabled={saving} onClick={onSkip}>
            משחק חדש
          </button>
        </div>
      </div>
    </div>
  );
}
