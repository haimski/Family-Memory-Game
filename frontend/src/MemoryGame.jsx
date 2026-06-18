import { useEffect, useState } from 'react';
import ImageSettingsModal from './ImageSettingsModal.jsx';

export const EMOJI_POOL = [
  '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸', '🐵', '🦋', '🌟', '🎈', '🌈', '🍎', '🚗', '🎁', '⚽', '🍕', '🎂', '🐢',
];

const MISMATCH_DELAY_MS = 1000;
const MATCH_REVEAL_DELAY_MS = 300;
const POINTS_PER_MATCH = 100;
const PENALTY_PER_MOVE = 10;
const PERFECT_GAME_BONUS = 500;

function getGridConfig(width) {
  if (width < 600) return { cols: 3, rows: 4, pairs: 6 };
  if (width < 900) return { cols: 4, rows: 4, pairs: 8 };
  return { cols: 5, rows: 4, pairs: 10 };
}

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createDeck(pairs) {
  const emojis = EMOJI_POOL.slice(0, pairs);
  const deck = shuffle([...emojis, ...emojis]);
  return deck.map((emoji, index) => ({
    id: `${index}-${emoji}`,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export default function MemoryGame() {
  const [config, setConfig] = useState(() => getGridConfig(window.innerWidth));
  const [cards, setCards] = useState(() => createDeck(config.pairs));
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [cardImages, setCardImages] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load any saved custom card images so the board reflects them immediately,
  // independent of whether the settings modal is ever opened.
  useEffect(() => {
    fetch('/api/images')
      .then((res) => res.json())
      .then((json) => {
        const map = {};
        (json.data || []).forEach((img) => {
          map[img.cardKey] = img.imageUrl;
        });
        setCardImages(map);
      })
      .catch(() => {});
  }, []);

  // Re-derive grid only when the breakpoint category actually changes,
  // so minor resizes (e.g. mobile address bar) don't reset an in-progress game.
  useEffect(() => {
    function handleResize() {
      const next = getGridConfig(window.innerWidth);
      setConfig((prev) => (prev.pairs !== next.pairs ? next : prev));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    startNewGame(config.pairs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (config.pairs > 0 && matches === config.pairs) {
      const totalCards = config.pairs * 2;
      const isPerfectGame = moves === totalCards;
      if (isPerfectGame) {
        setScore((s) => s + PERFECT_GAME_BONUS);
      }
      setWon(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]);

  function startNewGame(pairs) {
    setCards(createDeck(pairs));
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setScore(0);
    setLocked(false);
    setWon(false);
  }

  function handleCardClick(index) {
    if (locked || won) return;
    const card = cards[index];
    if (card.flipped || card.matched) return;

    const flippedCards = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    setCards(flippedCards);
    setMoves((m) => m + 1);
    setScore((s) => s - PENALTY_PER_MOVE);

    const nextSelected = [...selected, index];
    if (nextSelected.length < 2) {
      setSelected(nextSelected);
      return;
    }

    setLocked(true);
    const [firstIndex, secondIndex] = nextSelected;
    const isMatch = flippedCards[firstIndex].emoji === flippedCards[secondIndex].emoji;

    if (isMatch) {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) => (i === firstIndex || i === secondIndex ? { ...c, matched: true } : c))
        );
        setScore((s) => s + POINTS_PER_MATCH);
        setMatches((m) => m + 1);
        setSelected([]);
        setLocked(false);
      }, MATCH_REVEAL_DELAY_MS);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) => (i === firstIndex || i === secondIndex ? { ...c, flipped: false } : c))
        );
        setSelected([]);
        setLocked(false);
      }, MISMATCH_DELAY_MS);
    }
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>משחק זיכרון</h1>
        <div className="stats">
          <div className="stat">
            <span className="stat-label">מהלכים</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat">
            <span className="stat-label">התאמות</span>
            <span className="stat-value">
              {matches}/{config.pairs}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">ניקוד</span>
            <span className="stat-value">{score}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="new-game-btn" onClick={() => startNewGame(config.pairs)}>
            משחק חדש
          </button>
          <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
            הגדרות
          </button>
        </div>
      </header>

      <div className="board" style={{ '--cols': config.cols }}>
        {cards.map((card, index) => {
          const isRevealed = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              type="button"
              className={`card ${isRevealed ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleCardClick(index)}
              aria-label={isRevealed ? card.emoji : 'קלף מוסתר'}
            >
              <div className="card-inner">
                <div className="card-face card-front">❓</div>
                <div className="card-face card-back">
                  {cardImages[card.emoji] ? (
                    <img className="card-image" src={cardImages[card.emoji]} alt={card.emoji} />
                  ) : (
                    card.emoji
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="win-overlay" role="dialog" aria-modal="true">
          <div className="win-modal">
            <h2>כל הכבוד! ניצחת!</h2>
            <p className="final-score-label">ניקוד סופי</p>
            <p className="final-score-value">{score}</p>
            <button className="new-game-btn" onClick={() => startNewGame(config.pairs)}>
              משחק חדש
            </button>
          </div>
        </div>
      )}

      <ImageSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        cardKeys={EMOJI_POOL}
        onSaved={(updated) => setCardImages(updated)}
      />
    </div>
  );
}
