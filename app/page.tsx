"use client";
import React, { useState, useRef, useEffect } from "react";

const NUM_SPACES = 30;

// Updated board size and radii
const BOARD_SIZE = 520;
const CENTER = BOARD_SIZE / 2;
const SPIRAL_START_RADIUS = 200;
const SPIRAL_STEP = 4.2;
const SPIRAL_TURNS = 3.5;
const SPACE_RADIUS = 18;
const HEAD_RX = 40;
const HEAD_RY = 32;

const initialPlayers = [
  { name: "", piece: "pharaoh", position: 0, color: "#d4af37" },
  { name: "", piece: "mummie", position: 0, color: "#b0b0b0" },
];

// Pharaoh and Mummie facts
const PHARAOH_FACTS = [
  "Pepi II became pharaoh at just 8 years old and ruled for over 90 years.",
  "Early pharaohs would marry every royal princess to prevent rivals to the throne.",
  "Thutmose III, a great conqueror, was almost trampled by wild elephants in Syria.",
  "Ramses II had over 90 children—56 boys and 44 girls!",
  "Pharaoh Menes united Upper and Lower Egypt and was said to be killed by a hippopotamus.",
  "Pharaohs were considered gods on earth and intermediaries between the gods and people.",
  "The famous golden mask of Tutankhamun is made of solid gold.",
  "Pharaohs often had their tombs built decades before their death.",
  "Some pharaohs, like Akhenaten, tried to change Egypt's religion to worship a single god.",
  "Pharaohs were often buried with treasures, food, and even boats for their journey to the afterlife."
];

const MUMMIE_FACTS = [
  "Mummification in Egypt started around 2600 BCE and could take up to 70 days.",
  "The process involved removing internal organs, drying the body with natron, and wrapping it in linen.",
  "Not just people—cats, dogs, crocodiles, and birds were also mummified.",
  "Some mummies were covered in gold leaf and buried with amulets for protection.",
  "In the 1800s, so many mummies were found that some were used as train fuel!",
  "Priests sometimes replaced broken fingers or toes with wooden ones during mummification.",
  "King Charles II of England believed 'mummy dust' could keep him young and powerful.",
  "Mummies were often buried with food, water, and even boats for the afterlife.",
  "The word 'mummy' comes from the Arabic 'mumia,' meaning pitch or wax.",
  "Some animal mummies had their own cemeteries, like the Sacred Bulls at Sakkara."
];

function getRandomFact(piece: string) {
  if (piece === "pharaoh") {
    return PHARAOH_FACTS[Math.floor(Math.random() * PHARAOH_FACTS.length)];
  } else {
    return MUMMIE_FACTS[Math.floor(Math.random() * MUMMIE_FACTS.length)];
  }
}

function getPieceIcon(piece: string) {
  if (piece === "pharaoh") {
    return (
      <svg width="36" height="36" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="#d4af37" stroke="#7c6f3a" strokeWidth="2" />
        <text x="14" y="19" textAnchor="middle" fontSize="15" fill="#7c6f3a" fontWeight="bold">👑</text>
      </svg>
    );
  }
  if (piece === "mummie") {
    return (
      <svg width="36" height="36" viewBox="0 0 28 28">
        {/* Mummy head */}
        <ellipse cx="14" cy="14" rx="12" ry="12" fill="#e0e0e0" stroke="#6e6e6e" strokeWidth="2" />
        {/* Bandages */}
        <rect x="4" y="10" width="20" height="3" fill="#cccccc" opacity="0.8" rx="1.5" />
        <rect x="6" y="16" width="16" height="2.5" fill="#cccccc" opacity="0.7" rx="1.2" />
        <rect x="7" y="7" width="14" height="2" fill="#d8d8d8" opacity="0.7" rx="1" />
        {/* Eyes */}
        <ellipse cx="10" cy="15" rx="2" ry="2.2" fill="#222" />
        <ellipse cx="18" cy="15" rx="2" ry="2.2" fill="#222" />
        {/* Eye shine */}
        <ellipse cx="10.7" cy="14.5" rx="0.5" ry="0.7" fill="#fff" opacity="0.7" />
        <ellipse cx="18.7" cy="14.5" rx="0.5" ry="0.7" fill="#fff" opacity="0.7" />
      </svg>
    );
  }
  return null;
}

function getSpacePosition(index: number) {
  if (index === NUM_SPACES - 1) {
    // Last space is the snake's head
    return { cx: CENTER, cy: CENTER };
  }
  const angle = (index / NUM_SPACES) * SPIRAL_TURNS * 2 * Math.PI;
  const radius = SPIRAL_START_RADIUS - (index * SPIRAL_STEP);
  const cx = CENTER + Math.cos(angle) * radius;
  const cy = CENTER + Math.sin(angle) * radius;
  return { cx, cy };
}

// Utility: Catmull-Rom to Bezier for smooth snake body
function catmullRom2bezier(points: {cx: number, cy: number}[]) {
  if (points.length < 2) return '';
  let d = `M${points[0].cx},${points[0].cy}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    // Catmull-Rom to Bezier conversion
    const c1x = p1.cx + (p2.cx - p0.cx) / 6;
    const c1y = p1.cy + (p2.cy - p0.cy) / 6;
    const c2x = p2.cx - (p3.cx - p1.cx) / 6;
    const c2y = p2.cy - (p3.cy - p1.cy) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.cx},${p2.cy}`;
  }
  return d;
}

export default function MehenGame() {
  const [players, setPlayers] = useState(initialPlayers);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerPiece, setWinnerPiece] = useState<string | null>(null);
  const [winnerFact, setWinnerFact] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const handleNameChange = (idx: number, name: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, name } : p)));
  };

  const startGame = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, position: 0 })));
    setCurrentPlayer(0);
    setDice(null);
    setWinner(null);
    setWinnerPiece(null);
    setWinnerFact(null);
    setGameStarted(true);
  };

  const rollDice = () => {
    if (!gameStarted || winner) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    setIsAnimating(true);
    let steps = roll;
    let step = 0;
    const animateMove = () => {
      setPlayers((prev) => {
        return prev.map((p, i) => {
          if (i === currentPlayer) {
            let newPos = p.position + 1;
            if (newPos >= NUM_SPACES - 1) {
              newPos = NUM_SPACES - 1;
            }
            return { ...p, position: newPos };
          }
          return p;
        });
      });
      step++;
      if (step < steps) {
        animationRef.current = setTimeout(animateMove, 220);
      } else {
        setTimeout(() => {
          setIsAnimating(false);
          setDice(null);
          setPlayers((prev) => {
            const p = prev[currentPlayer];
            if (p.position >= NUM_SPACES - 1) {
              setWinner(p.name || p.piece);
              setWinnerPiece(p.piece);
              setWinnerFact(getRandomFact(p.piece));
            }
            return prev;
          });
          setCurrentPlayer((prev) => (prev + 1) % 2);
        }, 400);
      }
    };
    animateMove();
  };

  const newGame = () => {
    setPlayers(initialPlayers);
    setCurrentPlayer(0);
    setDice(null);
    setWinner(null);
    setWinnerPiece(null);
    setWinnerFact(null);
    setGameStarted(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = "Mehen: The Ancient Egyptian Game";
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-yellow-50 py-8">
      <h1 className="text-3xl font-bold mb-2 text-yellow-900 drop-shadow">Mehen: The Ancient Egyptian Game</h1>
      <p className="mb-6 text-yellow-800">Race to the snake's head! Pharaoh vs. Mummie</p>
      {/* Player names and icons row */}
      <div className="flex flex-row items-center justify-center gap-10 mb-6">
        {players.map((p, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="mb-1">{getPieceIcon(p.piece)}</div>
            <div className="font-semibold text-yellow-900 text-lg px-3 py-1 rounded bg-yellow-100 shadow">
              {p.name || (p.piece === "pharaoh" ? "Pharaoh" : "Mummie")}
            </div>
          </div>
        ))}
      </div>
      {!gameStarted && (
        <div className="mb-6 flex flex-col gap-4 bg-yellow-100 p-6 rounded shadow">
          <div className="flex gap-4">
            {players.map((p, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="mb-1 font-semibold text-yellow-900">{p.piece === "pharaoh" ? "Pharaoh" : "Mummie"}</span>
                <input
                  className="border rounded px-2 py-1 text-center"
                  placeholder={`Player ${i + 1} Name`}
                  value={p.name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  maxLength={12}
                />
              </div>
            ))}
          </div>
          <button
            className="mt-4 bg-yellow-700 text-white px-6 py-2 rounded font-bold hover:bg-yellow-800"
            onClick={startGame}
            disabled={players.some((p) => !p.name)}
          >
            Start Game
          </button>
        </div>
      )}
      <div className="relative w-[520px] h-[520px] mb-8">
        {/* Snake spiral board */}
        <svg width={BOARD_SIZE} height={BOARD_SIZE}>
          <defs>
            {/* Snake body gradient */}
            <linearGradient id="snakeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e2c275" />
              <stop offset="100%" stopColor="#bfa14a" />
            </linearGradient>
            {/* Scale pattern */}
            <pattern id="scales" patternUnits="userSpaceOnUse" width="18" height="18">
              <circle cx="9" cy="9" r="7" fill="#d4b96a" fillOpacity="0.5" />
              <circle cx="9" cy="18" r="7" fill="#bfa14a" fillOpacity="0.4" />
            </pattern>
            <mask id="snakeMask">
              {(() => {
                const points = Array.from({ length: NUM_SPACES }, (_, i) => getSpacePosition(i));
                return (
                  <path
                    d={catmullRom2bezier(points)}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={26}
                    strokeLinecap="round"
                  />
                );
              })()}
            </mask>
          </defs>
          {/* Snake body with gradient */}
          {(() => {
            const points = Array.from({ length: NUM_SPACES }, (_, i) => getSpacePosition(i));
            return (
              <path
                d={catmullRom2bezier(points)}
                fill="none"
                stroke="url(#snakeGradient)"
                strokeWidth={26}
                strokeLinecap="round"
              />
            );
          })()}
          {/* Scales overlay */}
          {(() => {
            const points = Array.from({ length: NUM_SPACES }, (_, i) => getSpacePosition(i));
            return (
              <path
                d={catmullRom2bezier(points)}
                fill="none"
                stroke="url(#scales)"
                strokeWidth={26}
                strokeLinecap="round"
                mask="url(#snakeMask)"
              />
            );
          })()}
          {/* Hieroglyphics around the board */}
          {(() => {
            // Some Egyptian-style Unicode symbols (not authentic, but visually similar)
            const glyphs = [
              "𓂀", // Eye of Horus
              "𓆣", // Crocodile
              "𓃾", // Lion
              "𓅓", // Owl
              "𓆑", // Viper
              "𓆗", // Scarab
              "𓋹", // Ankh
              "𓂻", // Walking legs
              "𓃭", // Lion
              "𓅱", // Quail chick
            ];
            const numGlyphs = glyphs.length;
            const outerRadius = SPIRAL_START_RADIUS + 32;
            return glyphs.map((glyph, i) => {
              const angle = (i / numGlyphs) * 2 * Math.PI;
              const x = CENTER + Math.cos(angle) * outerRadius;
              const y = CENTER + Math.sin(angle) * outerRadius;
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fontSize={36}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#bfa14a"
                  style={{ fontFamily: 'serif' }}
                >
                  {glyph}
                </text>
              );
            });
          })()}
          {/* Spaces except last */}
          {Array.from({ length: NUM_SPACES - 1 }, (_, i) => {
            const { cx, cy } = getSpacePosition(i);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={SPACE_RADIUS}
                fill="#fffbe6"
                stroke="#bfa14a"
                strokeWidth={3}
              />
            );
          })}
          {/* Last space on top of the head */}
          {(() => {
            const { cx, cy } = getSpacePosition(NUM_SPACES - 1);
            return (
              <circle
                key={NUM_SPACES - 1}
                cx={cx}
                cy={cy}
                r={SPACE_RADIUS}
                fill="#e2c275"
                stroke="#bfa14a"
                strokeWidth={6}
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}
          {/* Player pieces */}
          {(() => {
            // Group players by position
            const posMap: { [pos: number]: { idx: number; p: typeof players[0] }[] } = {};
            players.forEach((p, idx) => {
              if (!posMap[p.position]) posMap[p.position] = [];
              posMap[p.position].push({ idx, p });
            });
            // Render pieces, offset if more than one on a space
            return Object.entries(posMap).map(([pos, arr]) => {
              const { cx, cy } = getSpacePosition(Number(pos));
              if (arr.length === 1) {
                const { idx, p } = arr[0];
                return (
                  <g key={idx} transform={`translate(${cx - 18},${cy - 18})`}>
                    {getPieceIcon(p.piece)}
                  </g>
                );
              } else {
                // Offset pieces horizontally
                return arr.map(({ idx, p }, i) => (
                  <g
                    key={idx}
                    transform={`translate(${cx - 18 + (i === 0 ? -14 : 14)},${cy - 18})`}
                  >
                    {getPieceIcon(p.piece)}
                  </g>
                ));
              }
            });
          })()}
          {/* Snake head */}
          <g>
            <ellipse
              cx={CENTER}
              cy={CENTER}
              rx={HEAD_RX}
              ry={HEAD_RY}
              fill="#e2c275"
              stroke="#bfa14a"
              strokeWidth={10}
            />
            {/* Fierce eyes (no eyebrow) */}
            <ellipse cx={CENTER - 10} cy={CENTER - 7} rx={5} ry={8} fill="#222" stroke="#fff" strokeWidth={1.5} />
            <ellipse cx={CENTER + 10} cy={CENTER - 7} rx={5} ry={8} fill="#222" stroke="#fff" strokeWidth={1.5} />
            {/* Eye shine */}
            <ellipse cx={CENTER - 8.5} cy={CENTER - 10} rx={1.2} ry={2} fill="#fff" opacity="0.7" />
            <ellipse cx={CENTER + 11.5} cy={CENTER - 10} rx={1.2} ry={2} fill="#fff" opacity="0.7" />
            {/* Nostrils */}
            <ellipse cx={CENTER - 5} cy={CENTER + 5} rx={1.2} ry={2} fill="#a67c00" />
            <ellipse cx={CENTER + 5} cy={CENTER + 5} rx={1.2} ry={2} fill="#a67c00" />
            {/* Fierce mouth with fangs */}
            <path d={`M${CENTER - 12},${CENTER + 18} Q${CENTER},${CENTER + 38} ${CENTER + 12},${CENTER + 18}`} stroke="#a67c00" strokeWidth={5} fill="none" />
            <path d={`M${CENTER - 6},${CENTER + 28} l2,8`} stroke="#fff" strokeWidth={2} />
            <path d={`M${CENTER + 6},${CENTER + 28} l-2,8`} stroke="#fff" strokeWidth={2} />
            {/* Forked tongue */}
            <path d={`M${CENTER},${CENTER + 38} q0,12 8,18`} stroke="#d72600" strokeWidth={2} fill="none" />
            <path d={`M${CENTER},${CENTER + 38} q0,12 -8,18`} stroke="#d72600" strokeWidth={2} fill="none" />
          </g>
        </svg>
        {/* Winner overlay */}
        {winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 rounded p-6">
            <div className="text-2xl font-bold text-yellow-900 mb-2">{winner} wins!</div>
            {winnerPiece && (
              <div className="mb-2">{getPieceIcon(winnerPiece)}</div>
            )}
            {winnerFact && winnerPiece && (
              <div className="mb-4 text-yellow-900 text-center max-w-md text-lg italic">
                <span className="font-bold not-italic">
                  {winnerPiece === "pharaoh" ? "Pharaoh fact: " : "Mummie fact: "}
                </span>
                {winnerFact}
              </div>
            )}
            <button
              className="bg-yellow-700 text-white px-6 py-2 rounded font-bold hover:bg-yellow-800"
              onClick={newGame}
            >
              New Game
            </button>
          </div>
        )}
      </div>
      {/* Dice and controls */}
      {gameStarted && !winner && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-8 items-center">
            <div className="text-lg font-semibold text-yellow-900">
              {players[currentPlayer].name}'s turn
            </div>
            <button
              className="w-20 h-20 bg-yellow-300 border-4 border-yellow-700 rounded-full flex items-center justify-center text-4xl font-bold shadow hover:bg-yellow-400 transition"
              onClick={rollDice}
              disabled={dice !== null || isAnimating}
              aria-label="Roll Dice"
            >
              {dice !== null ? dice : "🎲"}
            </button>
          </div>
          <button
            className="mt-2 text-yellow-700 underline hover:text-yellow-900"
            onClick={newGame}
          >
            New Game
          </button>
        </div>
      )}
    </div>
  );
}
