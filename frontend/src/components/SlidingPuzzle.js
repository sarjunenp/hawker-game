import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { awardPoints } from "../services/pointsService";

export default function SlidingPuzzle() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [emptyIndex, setEmptyIndex] = useState(8);
  const [moves, setMoves] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(true);
  const [pointsAwarded, setPointsAwarded] = useState(false);

  const getMovableTiles = (emptyIdx) => {
    const movable = [];
    const row = Math.floor(emptyIdx / 3);
    const col = emptyIdx % 3;

    if (row > 0) movable.push(emptyIdx - 3);
    if (row < 2) movable.push(emptyIdx + 3);
    if (col > 0) movable.push(emptyIdx - 1);
    if (col < 2) movable.push(emptyIdx + 1);

    return movable;
  };

  const shufflePuzzle = useCallback(() => {
    let shuffled = Array.from({ length: 9 }, (_, i) => i);
    let empty = 8;

    for (let i = 0; i < 100; i++) {
      const movable = getMovableTiles(empty);
      const randomTile = movable[Math.floor(Math.random() * movable.length)];
      [shuffled[empty], shuffled[randomTile]] = [shuffled[randomTile], shuffled[empty]];
      empty = randomTile;
    }

    setTiles(shuffled);
    setEmptyIndex(empty);
    setMoves(0);
  }, []);

  const initializePuzzle = useCallback(() => {
    const initialTiles = Array.from({ length: 9 }, (_, i) => i);
    setTiles(initialTiles);
    setEmptyIndex(8);
    setMoves(0);
    setIsSolved(false);
    setPointsAwarded(false);
  }, []);

  // Fetch challenge image
  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await api.get("/challenges/current");
        console.log("🖼️ Challenge loaded:", res.data);
        setChallenge(res.data);
        initializePuzzle();
      } catch (err) {
        console.error("Error loading challenge:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchChallenge();
  }, [initializePuzzle]);

  // Countdown and preview logic
  useEffect(() => {
    if (showPreview && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showPreview && countdown === 0) {
      setShowPreview(false);
      shufflePuzzle();
    }
  }, [showPreview, countdown, shufflePuzzle]);

  const handleTileClick = (index) => {
    if (showPreview || isSolved) return;

    const movable = getMovableTiles(emptyIndex);
    if (movable.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      setEmptyIndex(index);
      setMoves(moves + 1);

      const solved = newTiles.every((tile, idx) => tile === idx);
      if (solved && !pointsAwarded) {
        setIsSolved(true);
        setPointsAwarded(true);
        
        // Award 50 points
        awardPoints(50, 'sliding_puzzle', 'Completed Sliding Puzzle')
          .then(result => {
            if (result) {
              console.log('✅ Earned 50 points! New balance:', result.new_balance);
            }
          })
          .catch(err => {
            console.error('Failed to award points:', err);
          });
      }
    }
  };

  const resetPuzzle = () => {
    setShowPreview(true);
    setCountdown(3);
    initializePuzzle();
  };

  if (loading) return <p style={styles.loading}>Loading puzzle...</p>;
  if (!challenge) return <p style={styles.loading}>No challenge found.</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🧩 Sliding Puzzle</h1>
        <p style={styles.subtitle}>Arrange the tiles to reveal the hawker stall!</p>

        {showPreview ? (
          <div style={styles.previewBanner}>
            <p style={styles.previewText}>👀 Memorize the image!</p>
            <p style={styles.countdownText}>Shuffling in {countdown}...</p>
          </div>
        ) : (
          <div style={styles.stats}>
            <span style={styles.stat}>Moves: {moves}</span>
            <span style={styles.stat}>
              {isSolved ? "✅ Solved!" : "🎯 Keep going!"}
            </span>
          </div>
        )}
      </div>

      <div style={styles.puzzleWrapper}>
        <div style={styles.puzzleGrid}>
          {tiles.map((tileValue, index) => (
            <div
              key={index}
              style={{
                ...styles.tile,
                ...(index === emptyIndex ? styles.emptyTile : {}),
                backgroundImage:
                  index === emptyIndex ? "none" : `url(${challenge.image_url})`,
                backgroundPosition: getTilePosition(tileValue),
                backgroundSize: "300%",
                cursor:
                  !showPreview &&
                  !isSolved &&
                  getMovableTiles(emptyIndex).includes(index)
                    ? "pointer"
                    : "default",
                opacity: index === emptyIndex ? 0 : 1,
              }}
              onClick={() => handleTileClick(index)}
            />
          ))}
        </div>
      </div>

      {isSolved && (
        <div style={styles.completeModal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>🎉 Puzzle Complete!</h2>
            <p style={styles.modalText}>
              You solved it in <strong>{moves} moves</strong>!
            </p>
            <p style={styles.pointsEarned}>
              🪙 You earned <strong>50 points</strong>!
            </p>
            <p style={styles.modalSubtext}>
              Now it's time to guess which hawker centre this is!
            </p>
            <button
              onClick={() => navigate("/challenge")}
              style={styles.continueButton}
            >
              🎯 Continue to Challenge
            </button>
          </div>
        </div>
      )}

      <button onClick={resetPuzzle} style={styles.resetButton}>
        🔄 Reset Puzzle
      </button>
    </div>
  );
}

function getTilePosition(tileValue) {
  const row = Math.floor(tileValue / 3);
  const col = tileValue % 3;
  return `${col * 50}% ${row * 50}%`;
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 20px",
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  title: {
    fontSize: "2.5em",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1.2em",
    color: "#f0f0f0",
    marginBottom: "20px",
  },
  previewBanner: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "16px",
    padding: "20px",
    maxWidth: "400px",
    margin: "0 auto",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  },
  previewText: {
    fontSize: "1.3em",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 10px 0",
  },
  countdownText: {
    fontSize: "1.5em",
    fontWeight: "800",
    color: "#667eea",
    margin: 0,
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
  },
  stat: {
    fontSize: "1.1em",
    fontWeight: "600",
    color: "#fff",
    background: "rgba(255,255,255,0.2)",
    padding: "10px 20px",
    borderRadius: "20px",
  },
  puzzleWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "30px",
  },
  puzzleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
    width: "min(400px, 90vw)",
    height: "min(400px, 90vw)",
    backgroundColor: "#1e293b",
    padding: "4px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  tile: {
    aspectRatio: "1",
    backgroundColor: "#fff",
    borderRadius: "8px",
    backgroundSize: "300%",
    backgroundRepeat: "no-repeat",
    transition: "all 0.2s ease",
    border: "2px solid #fff",
  },
  emptyTile: {
    backgroundColor: "rgba(0,0,0,0.3)",
    border: "2px dashed rgba(255,255,255,0.3)",
  },
  resetButton: {
    display: "block",
    margin: "0 auto",
    padding: "15px 40px",
    fontSize: "1.2em",
    fontWeight: "600",
    color: "#fff",
    background: "rgba(255,255,255,0.2)",
    border: "2px solid #fff",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  completeModal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: "24px",
    padding: "40px",
    maxWidth: "500px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  modalTitle: {
    fontSize: "2.5em",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "15px",
  },
  modalText: {
    fontSize: "1.3em",
    color: "#64748b",
    marginBottom: "10px",
  },
  pointsEarned: {
    fontSize: "1.5em",
    fontWeight: "700",
    color: "#22c55e",
    marginBottom: "20px",
    padding: "15px",
    background: "#d1fae5",
    borderRadius: "12px",
  },
  modalSubtext: {
    fontSize: "1.1em",
    color: "#94a3b8",
    marginBottom: "30px",
  },
  continueButton: {
    width: "100%",
    padding: "18px",
    fontSize: "1.3em",
    fontWeight: "700",
    color: "#fff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  loading: {
    textAlign: "center",
    padding: "60px 20px",
    fontSize: "1.3em",
    color: "#fff",
  },
};