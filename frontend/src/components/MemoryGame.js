import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { awardPoints } from "../services/pointsService";

// Food images for the memory game
const FOOD_IMAGES = [
  { id: 1, name: "Chicken Rice", emoji: "🍗", image: "🍗" },
  { id: 2, name: "Laksa", emoji: "🍜", image: "🍜" },
  { id: 3, name: "Char Kway Teow", emoji: "🍝", image: "🍝" },
  { id: 4, name: "Satay", emoji: "🍢", image: "🍢" },
  { id: 5, name: "Roti Prata", emoji: "🥞", image: "🥞" },
  { id: 6, name: "Nasi Lemak", emoji: "🍛", image: "🍛" },
  { id: 7, name: "Bak Kut Teh", emoji: "🍲", image: "🍲" },
  { id: 8, name: "Rojak", emoji: "🥗", image: "🥗" },
];

export default function MemoryGame() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  // Countdown and preview logic
  useEffect(() => {
    if (showPreview && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showPreview && countdown === 0) {
      setShowPreview(false);
      setGameStarted(true);
    }
  }, [showPreview, countdown]);

  const initializeGame = () => {
    // Create pairs and shuffle
    const pairs = [...FOOD_IMAGES, ...FOOD_IMAGES];
    const shuffled = pairs
      .map((card, index) => ({ ...card, uniqueId: index }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setGameComplete(false);
    setShowPreview(true);
    setCountdown(3);
    setGameStarted(false);
    setPointsAwarded(false);
  };

  const handleCardClick = (card) => {
    // Don't allow clicks during preview
    if (showPreview || !gameStarted) {
      return;
    }

    // Prevent flipping if already flipped or matched
    if (
      flippedCards.length === 2 ||
      flippedCards.includes(card.uniqueId) ||
      matchedCards.includes(card.id)
    ) {
      return;
    }

    const newFlipped = [...flippedCards, card.uniqueId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      const firstCard = cards.find((c) => c.uniqueId === first);
      const secondCard = cards.find((c) => c.uniqueId === second);

      if (firstCard.id === secondCard.id) {
        // Match found!
        setTimeout(() => {
          const newMatched = [...matchedCards, firstCard.id];
          setMatchedCards(newMatched);
          setFlippedCards([]);
          
          // Check if game is complete
          if (newMatched.length === FOOD_IMAGES.length && !pointsAwarded) {
            setGameComplete(true);
            setPointsAwarded(true);
            
            // Award 50 points
            awardPoints(50, 'memory_game', 'Completed Memory Match Game')
              .then(result => {
                if (result) {
                  console.log('✅ Earned 50 points! New balance:', result.new_balance);
                }
              })
              .catch(err => {
                console.error('Failed to award points:', err);
              });
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const isFlipped = (card) => {
    // Show all cards during preview
    if (showPreview) {
      return true;
    }
    // Normal game logic
    return flippedCards.includes(card.uniqueId) || matchedCards.includes(card.id);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🧠 Memory Match Game</h1>
        <p style={styles.subtitle}>Match all the hawker food pairs to continue!</p>
        
        {showPreview ? (
          <div style={styles.previewBanner}>
            <p style={styles.previewText}>
              👀 Memorize the cards!
            </p>
            <p style={styles.countdownText}>
              Starting in {countdown}...
            </p>
          </div>
        ) : (
          <div style={styles.stats}>
            <span style={styles.stat}>Moves: {moves}</span>
            <span style={styles.stat}>
              Matched: {matchedCards.length}/{FOOD_IMAGES.length}
            </span>
          </div>
        )}
      </div>

      <div style={styles.gameBoard}>
        {cards.map((card) => (
          <div
            key={card.uniqueId}
            style={{
              ...styles.card,
              ...(isFlipped(card) ? styles.cardFlipped : {}),
              cursor: showPreview ? "default" : "pointer",
            }}
            onClick={() => handleCardClick(card)}
          >
            <div style={styles.cardInner}>
              <div style={styles.cardFront}>❓</div>
              <div style={styles.cardBack}>{card.image}</div>
            </div>
          </div>
        ))}
      </div>

      {gameComplete && (
        <div style={styles.completeModal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>🎉 Puzzle Complete!</h2>
            <p style={styles.modalText}>
              You completed it in <strong>{moves} moves</strong>!
            </p>
            <p style={styles.pointsEarned}>
              🪙 You earned <strong>50 points</strong>!
            </p>
            <p style={styles.modalSubtext}>
              Now it's time to guess the hawker centre!
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

      <button onClick={initializeGame} style={styles.resetButton}>
        🔄 Restart Game
      </button>
    </div>
  );
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
  gameBoard: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    maxWidth: "600px",
    margin: "0 auto 30px",
  },
  card: {
    aspectRatio: "1",
    background: "#fff",
    borderRadius: "16px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    transformStyle: "preserve-3d",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },
  cardFlipped: {
    transform: "rotateY(180deg)",
  },
  cardInner: {
    width: "100%",
    height: "100%",
    position: "relative",
    transformStyle: "preserve-3d",
  },
  cardFront: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3em",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  cardBack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "4em",
    borderRadius: "16px",
    background: "#fff",
    transform: "rotateY(180deg)",
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
};