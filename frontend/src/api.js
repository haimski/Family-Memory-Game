// VITE_API_URL points fetches at an absolute backend origin (needed when the
// frontend and backend are deployed as separate Vercel projects/domains).
// Left unset, paths resolve relative to the current origin (same-domain
// deploys, or the Vite dev proxy in vite.config.js).
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(userMessage, cause) {
    super(userMessage);
    this.name = 'ApiError';
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

async function request(path, options = {}) {
  if (!navigator.onLine) {
    throw new ApiError('בדוק את החיבור לאינטרנט');
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new ApiError('שגיאה בחיבור לשרת', err);
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    // non-JSON response body, fall through to status check below
  }

  if (!response.ok) {
    throw new ApiError(json?.message || 'שגיאה בחיבור לשרת', json);
  }

  return json;
}

export function getHealth() {
  return request('/api/health');
}

// Not used by the memory game UI yet, kept for a future hosting-plans view.
export function getHostingPlans() {
  return request('/api/hosting-plans');
}

export async function getImages() {
  const json = await request('/api/images');
  const map = {};
  (json.data || []).forEach((img) => {
    map[img.cardKey] = img.imageUrl;
  });
  return map;
}

export function updateImage(cardKey, imageUrl) {
  return request('/api/images/update', {
    method: 'POST',
    body: JSON.stringify({ cardKey, imageUrl: imageUrl || '' }),
  });
}

// Sorted descending by score, at most 5 entries (the backend itself never
// stores more than that, this isn't just a client-side slice).
export async function getScores() {
  const json = await request('/api/scores');
  return json.data || [];
}

export function submitScore(name, score) {
  return request('/api/scores', {
    method: 'POST',
    body: JSON.stringify({ name, score }),
  });
}
