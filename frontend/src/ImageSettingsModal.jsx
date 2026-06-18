import { useEffect, useState } from 'react';
import { useImages } from './ImagesContext.jsx';
import { ApiError, updateImage } from './api.js';

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const NETWORK_MESSAGES = new Set(['בדוק את החיבור לאינטרנט', 'שגיאה בחיבור לשרת']);

function validateImageUrl(url) {
  return new Promise((resolve) => {
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      resolve({ ok: false, message: 'תמונה לא תקינה' });
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ ok: true, url: trimmed });
    img.onerror = () => resolve({ ok: false, message: 'תמונה לא תקינה' });
    img.src = trimmed;
  });
}

function validateFile(file) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { ok: false, message: 'סוג קובץ לא נתמך. ניתן להעלות PNG, JPEG, GIF, WEBP או SVG' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, message: 'הקובץ גדול מהמותר (מקסימום 2MB)' };
  }
  return { ok: true };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('file read error'));
    reader.readAsDataURL(file);
  });
}

export default function ImageSettingsModal({ open, onClose, cardKeys }) {
  const { images, loading: imagesLoading, error: imagesError, refetch, setImages } = useImages();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [draftImages, setDraftImages] = useState({});
  const [urlInputs, setUrlInputs] = useState({});
  const [busyKeys, setBusyKeys] = useState({});
  const [dragOverKey, setDragOverKey] = useState(null);

  // Seed the draft from the globally-loaded images each time the modal opens,
  // so edits start from the latest known server state without a duplicate fetch.
  useEffect(() => {
    if (open) {
      setMessage(null);
      setDraftImages(images);
      setUrlInputs({});
    }
  }, [open, images]);

  if (!open) return null;

  function setBusy(key, value) {
    setBusyKeys((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUrlSubmit(key) {
    const url = (urlInputs[key] || '').trim();
    if (!url || busyKeys[key] || saving) return;
    setBusy(key, true);
    setMessage(null);
    const result = await validateImageUrl(url);
    setBusy(key, false);
    if (!result.ok) {
      setMessage({ type: 'error', text: result.message });
      return;
    }
    setDraftImages((prev) => ({ ...prev, [key]: result.url }));
    setUrlInputs((prev) => ({ ...prev, [key]: '' }));
  }

  async function handleFile(key, file) {
    if (!file || busyKeys[key] || saving) return;
    setBusy(key, true);
    setMessage(null);
    const result = validateFile(file);
    if (!result.ok) {
      setBusy(key, false);
      setMessage({ type: 'error', text: result.message });
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDraftImages((prev) => ({ ...prev, [key]: dataUrl }));
    } catch {
      setMessage({ type: 'error', text: 'תמונה לא תקינה' });
    } finally {
      setBusy(key, false);
    }
  }

  function handleResetKey(key) {
    if (busyKeys[key] || saving) return;
    setDraftImages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleDrop(key, event) {
    event.preventDefault();
    setDragOverKey(null);
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    handleFile(key, file);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setMessage(null);

    const changedKeys = cardKeys.filter((key) => (draftImages[key] || '') !== (images[key] || ''));

    try {
      await Promise.all(changedKeys.map((key) => updateImage(key, draftImages[key])));
      setMessage({ type: 'success', text: 'הצליח!' });
      setImages(draftImages);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      const text = err instanceof ApiError && NETWORK_MESSAGES.has(err.userMessage) ? err.userMessage : 'נכשל בעדכון תמונות';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;
    onClose();
  }

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>ערוך תמונות</h2>
          <button type="button" className="close-btn" onClick={handleCancel} aria-label="סגור">
            ✕
          </button>
        </div>

        {message && <div className={`settings-message ${message.type}`}>{message.text}</div>}

        {imagesError && !imagesLoading && (
          <div className="settings-message error">
            {imagesError}{' '}
            <button type="button" className="retry-link" onClick={refetch}>
              נסה שוב
            </button>
          </div>
        )}

        {imagesLoading ? (
          <p className="settings-loading">טעינה...</p>
        ) : (
          <div className="image-grid">
            {cardKeys.map((key) => {
              const customUrl = draftImages[key];
              const isBusy = !!busyKeys[key];
              return (
                <div
                  key={key}
                  className={`image-row ${dragOverKey === key ? 'drag-over' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverKey(key);
                  }}
                  onDragLeave={() => setDragOverKey(null)}
                  onDrop={(e) => handleDrop(key, e)}
                >
                  <div className="image-preview card-face card-back">
                    {customUrl ? <img className="card-image" src={customUrl} alt={key} /> : key}
                  </div>

                  <div className="image-controls">
                    <div className="url-input-group">
                      <input
                        type="text"
                        placeholder="הוסף מ-URL"
                        value={urlInputs[key] || ''}
                        disabled={isBusy || saving}
                        onChange={(e) => setUrlInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUrlSubmit(key);
                        }}
                      />
                      <button
                        type="button"
                        disabled={isBusy || saving || !(urlInputs[key] || '').trim()}
                        onClick={() => handleUrlSubmit(key)}
                      >
                        הוסף מ-URL
                      </button>
                    </div>

                    <label className="file-input-label">
                      הוסף קובץ
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        disabled={isBusy || saving}
                        onChange={(e) => handleFile(key, e.target.files && e.target.files[0])}
                      />
                    </label>

                    <button
                      type="button"
                      className="reset-btn"
                      disabled={isBusy || saving || !customUrl}
                      onClick={() => handleResetKey(key)}
                    >
                      אפס לברירת מחדל
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="settings-footer">
          <button type="button" className="new-game-btn" disabled={saving || imagesLoading} onClick={handleSave}>
            {saving ? 'טעינה...' : 'שמור'}
          </button>
          <button type="button" className="cancel-btn" disabled={saving} onClick={handleCancel}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
