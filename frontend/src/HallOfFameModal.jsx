import { useEffect, useState } from 'react';
import { getScores } from './api.js';

export default function HallOfFameModal({ open, onClose, showNewGameButton, onNewGame }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getScores()
      .then(setScores)
      .catch((err) => setError(err.userMessage || 'שגיאה בחיבור לשרת'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fame-overlay" role="dialog" aria-modal="true">
      <div className="fame-modal">
        <div className="settings-header">
          <h2>טבלת השיאים</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        {loading && <p className="settings-loading">טעינה...</p>}
        {error && !loading && <div className="settings-message error">{error}</div>}

        {!loading && !error && scores.length === 0 && <p className="fame-empty">אין אלופים עדיין</p>}

        {!loading && !error && scores.length > 0 && (
          <table className="fame-table">
            <thead>
              <tr>
                <th>מקום</th>
                <th>שם</th>
                <th>ניקוד</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, index) => (
                <tr key={s._id || index}>
                  <td>{index + 1}</td>
                  <td>{s.name}</td>
                  <td>{s.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="settings-footer">
          {showNewGameButton && (
            <button type="button" className="new-game-btn" onClick={onNewGame}>
              משחק חדש
            </button>
          )}
          <button type="button" className="cancel-btn" onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
