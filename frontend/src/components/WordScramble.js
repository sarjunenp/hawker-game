import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { awardPoints } from "../services/pointsService";

// Word bank with scrambled versions and hints
const FOOD_ITEMS = [
  { word: "LAKSA", scrambled: "ASKLA", hint: "Spicy coconut noodle soup" },
  { word: "SATAY", scrambled: "YASTA", hint: "Grilled meat skewers with peanut sauce" },
  { word: "ROTI PRATA", scrambled: "TRAIT PARO", hint: "Crispy Indian flatbread" },
  { word: "CHAR KWAY TEOW", scrambled: "WRAY CHAT KETO", hint: "Stir-fried flat rice noodles" },
  { word: "CHICKEN RICE", scrambled: "RICE CHIKENC", hint: "Singapore's national dish" },
  { word: "HOKKIEN MEE", scrambled: "MEEK HOKIN", hint: "Prawn noodles in rich broth" },
  { word: "CHILLI CRAB", scrambled: "CRAB LICHI", hint: "Famous seafood dish with sweet sauce" },
  { word: "BAK KUT TEH", scrambled: "TUK BAK THE", hint: "Peppery pork rib soup" },
  { word: "NASI LEMAK", scrambled: "KALE MISAN", hint: "Coconut rice with sambal and egg" },
  { word: "CARROT CAKE", scrambled: "TRACK CORE", hint: "Fried radish cake (not dessert!)" },
  { word: "ROJAK", scrambled: "JAKRO", hint: "Fruit and vegetable salad with sauce" },
  { word: "POPIAH", scrambled: "PHAIPO", hint: "Fresh spring rolls" },
  { word: "KAYA TOAST", scrambled: "TOAST YAKA", hint: "Breakfast with coconut jam" },
  { word: "MEE GORENG", scrambled: "GONE MEER", hint: "Spicy fried yellow noodles" },
  { word: "FISH BALL", scrambled: "BALL FISH", hint: "Bouncy seafood balls in soup" },
];

export default function WordScramble() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("playing"); // "playing", "won", "lost"
  const [lives, setLives] = useState(3);
  const [wordQueue, setWordQueue] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [userGuess, setUserGuess] = useState("");
  const [completedWords, setCompletedWords] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // Shuffle and pick 5 random words
    const shuffled = [...FOOD_ITEMS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);
    
    setWordQueue(selected);
    setCurrentWord(selected[0]);
    setLives(3);
    setCompletedWords([]);
    setUserGuess("");
    setShowHint(false);
    setFeedback(null);
    setGameState("playing");
    setPointsAwarded(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!userGuess.trim()) return;

    const normalizedGuess = userGuess.trim().toUpperCase();
    const correctAnswer = currentWord.word.toUpperCase();

    if (normalizedGuess === correctAnswer) {
      // Correct answer!
      setFeedback({ type: "success", message: "✅ Correct!" });
      setCompletedWords([...completedWords, currentWord]);
      
      // Remove current word from queue
      const newQueue = wordQueue.filter(w => w.word !== currentWord.word);
      
      // Check if won
      if (completedWords.length + 1 >= 5 && !pointsAwarded) {
        setGameState("won");
        setPointsAwarded(true);
        
        // Award 50 points
        awardPoints(50, 'word_scramble', 'Completed Word Scramble Game')
          .then(result => {
            if (result) {
              console.log('✅ Earned 50 points! New balance:', result.new_balance);
            }
          })
          .catch(err => {
            console.error('Failed to award points:', err);
          });
      } else {
        // Move to next word
        setTimeout(() => {
          setCurrentWord(newQueue[0]);
          setWordQueue(newQueue);
          setUserGuess("");
          setShowHint(false);
          setFeedback(null);
        }, 1000);
      }
    } else {
      // Wrong answer
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback({ type: "error", message: "❌ Not quite! Try again." });
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);

      if (newLives <= 0) {
        // Game over
        setGameState("lost");
      } else {
        // Move current word to back of queue
        const newQueue = [...wordQueue.slice(1), currentWord];
        
        setTimeout(() => {
          setCurrentWord(newQueue[0]);
          setWordQueue(newQueue);
          setUserGuess("");
          setShowHint(false);
          setFeedback(null);
        }, 1500);
      }
    }
  };

  const handleSkip = () => {
    // Move current word to back of queue
    const newQueue = [...wordQueue.slice(1), currentWord];
    setCurrentWord(newQueue[0]);
    setWordQueue(newQueue);
    setUserGuess("");
    setShowHint(false);
    setFeedback(null);
  };

  const handlePlayAgain = () => {
    startNewGame();
  };

  const handleGoToChallenge = () => {
    navigate("/challenge");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  // Game Won Screen
  if (gameState === "won") {
    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={styles.winIcon}>🎉</div>
          <h1 style={styles.winTitle}>You Win!</h1>
          <p style={styles.winSubtitle}>You've mastered the hawker food names!</p>
          
          <div style={styles.scoreCard}>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Words Completed:</span>
              <span style={styles.scoreValue}>5/5 ✅</span>
            </div>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Lives Remaining:</span>
              <span style={styles.scoreValue}>{"❤️".repeat(lives)}</span>
            </div>
          </div>

          <p style={styles.pointsEarned}>
            🪙 You earned <strong>50 points</strong>!
          </p>

          <div style={styles.completedList}>
            <h3 style={styles.completedTitle}>Words You Mastered:</h3>
            {completedWords.map((word, index) => (
              <div key={index} style={styles.completedItem}>
                ✅ {word.word}
              </div>
            ))}
          </div>

          <div style={styles.buttonGroup}>
            <button onClick={handleGoToChallenge} style={styles.primaryButton}>
              🎯 Go to Challenge
            </button>
            <button onClick={handlePlayAgain} style={styles.secondaryButton}>
              🔄 Play Again
            </button>
            <button onClick={handleGoHome} style={styles.tertiaryButton}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (gameState === "lost") {
    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={styles.loseIcon}>💔</div>
          <h1 style={styles.loseTitle}>Out of Lives!</h1>
          <p style={styles.loseSubtitle}>Don't worry, you can try again!</p>
          
          <div style={styles.scoreCard}>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Words Completed:</span>
              <span style={styles.scoreValue}>{completedWords.length}/5</span>
            </div>
          </div>

          {completedWords.length > 0 && (
            <div style={styles.completedList}>
              <h3 style={styles.completedTitle}>Words You Got Right:</h3>
              {completedWords.map((word, index) => (
                <div key={index} style={styles.completedItem}>
                  ✅ {word.word}
                </div>
              ))}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button onClick={handlePlayAgain} style={styles.primaryButton}>
              🔄 Try Again
            </button>
            <button onClick={handleGoHome} style={styles.tertiaryButton}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing Screen
  return (
    <div style={styles.container}>
      <div style={styles.gameCard}>
        <h1 style={styles.title}>🍜 Word Scramble</h1>
        <p style={styles.subtitle}>Unscramble the hawker food names!</p>

        {/* Stats Bar */}
        <div style={styles.statsBar}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Progress:</span>
            <span style={styles.statValue}>{completedWords.length}/5 ✅</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Lives:</span>
            <span style={styles.statValue}>{"❤️".repeat(lives)}</span>
          </div>
        </div>

        {/* Current Word */}
        {currentWord && (
          <div style={styles.wordSection}>
            <div style={styles.scrambledWord}>
              {currentWord.scrambled.split("").map((letter, index) => (
                <span 
                  key={index} 
                  style={{
                    ...styles.letter,
                    ...(shakeAnimation ? styles.letterShake : {})
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>

            {/* Hint Button */}
            <button
              onClick={() => setShowHint(!showHint)}
              style={styles.hintButton}
            >
              💡 {showHint ? "Hide" : "Show"} Hint
            </button>

            {showHint && (
              <div style={styles.hintBox}>
                💭 {currentWord.hint}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                placeholder="Type your answer..."
                style={styles.input}
                autoFocus
              />
              <button type="submit" style={styles.submitButton}>
                Submit
              </button>
            </form>

            {/* Feedback */}
            {feedback && (
              <div style={{
                ...styles.feedback,
                backgroundColor: feedback.type === "success" ? "#d1fae5" : "#fee2e2",
                color: feedback.type === "success" ? "#065f46" : "#991b1b",
              }}>
                {feedback.message}
              </div>
            )}

            {/* Skip Button */}
            <button onClick={handleSkip} style={styles.skipButton}>
              ⏭️ Skip this word
            </button>
          </div>
        )}

        {/* Completed Words Progress */}
        {completedWords.length > 0 && (
          <div style={styles.progressSection}>
            <h3 style={styles.progressTitle}>✅ Completed Words:</h3>
            <div style={styles.progressList}>
              {completedWords.map((word, index) => (
                <div key={index} style={styles.progressChip}>
                  {word.word}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 20px",
    fontFamily: "'Poppins', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  gameCard: {
    maxWidth: "700px",
    width: "100%",
    background: "#fff",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  title: {
    fontSize: "2.5em",
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1.2em",
    color: "#64748b",
    textAlign: "center",
    marginBottom: "30px",
  },
  statsBar: {
    display: "flex",
    justifyContent: "space-around",
    padding: "20px",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)",
    borderRadius: "16px",
    marginBottom: "30px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  statLabel: {
    fontSize: "0.9em",
    color: "#64748b",
    fontWeight: "600",
  },
  statValue: {
    fontSize: "1.5em",
    fontWeight: "700",
    color: "#1e293b",
  },
  wordSection: {
    textAlign: "center",
  },
  scrambledWord: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  letter: {
    fontSize: "2.5em",
    fontWeight: "800",
    color: "#667eea",
    backgroundColor: "#f0f9ff",
    padding: "15px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.2)",
    transition: "transform 0.2s",
  },
  letterShake: {
    animation: "shake 0.5s",
  },
  hintButton: {
    padding: "10px 20px",
    fontSize: "1em",
    fontWeight: "600",
    color: "#667eea",
    background: "#f0f9ff",
    border: "2px solid #667eea",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "20px",
    transition: "all 0.3s ease",
  },
  hintBox: {
    padding: "15px 20px",
    backgroundColor: "#fef3c7",
    border: "2px solid #f59e0b",
    borderRadius: "12px",
    color: "#92400e",
    fontSize: "1.1em",
    fontWeight: "600",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    flex: 1,
    padding: "15px 20px",
    fontSize: "1.1em",
    border: "3px solid #e2e8f0",
    borderRadius: "12px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  submitButton: {
    padding: "15px 30px",
    fontSize: "1.1em",
    fontWeight: "700",
    color: "#fff",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
    transition: "transform 0.2s",
  },
  feedback: {
    padding: "15px 20px",
    borderRadius: "12px",
    fontSize: "1.1em",
    fontWeight: "700",
    marginBottom: "15px",
  },
  skipButton: {
    padding: "10px 20px",
    fontSize: "0.95em",
    fontWeight: "600",
    color: "#64748b",
    background: "#f1f5f9",
    border: "2px solid #cbd5e1",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  progressSection: {
    marginTop: "30px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "16px",
  },
  progressTitle: {
    fontSize: "1.1em",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "15px",
  },
  progressList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  progressChip: {
    padding: "8px 16px",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: "8px",
    fontSize: "0.95em",
    fontWeight: "600",
  },
  // Result Screens
  resultCard: {
    maxWidth: "600px",
    width: "100%",
    background: "#fff",
    borderRadius: "24px",
    padding: "50px 40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  winIcon: {
    fontSize: "6em",
    marginBottom: "20px",
  },
  winTitle: {
    fontSize: "3em",
    fontWeight: "800",
    color: "#22c55e",
    marginBottom: "10px",
  },
  winSubtitle: {
    fontSize: "1.3em",
    color: "#64748b",
    marginBottom: "30px",
  },
  loseIcon: {
    fontSize: "6em",
    marginBottom: "20px",
  },
  loseTitle: {
    fontSize: "3em",
    fontWeight: "800",
    color: "#ef4444",
    marginBottom: "10px",
  },
  loseSubtitle: {
    fontSize: "1.3em",
    color: "#64748b",
    marginBottom: "30px",
  },
  scoreCard: {
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "16px",
    marginBottom: "30px",
  },
  scoreItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    fontSize: "1.2em",
  },
  scoreLabel: {
    fontWeight: "600",
    color: "#64748b",
  },
  scoreValue: {
    fontWeight: "800",
    color: "#1e293b",
    fontSize: "1.3em",
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
  completedList: {
    marginBottom: "30px",
    textAlign: "left",
  },
  completedTitle: {
    fontSize: "1.3em",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "15px",
  },
  completedItem: {
    padding: "10px 15px",
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: "10px",
    marginBottom: "10px",
    fontSize: "1.1em",
    fontWeight: "600",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  primaryButton: {
    padding: "16px 32px",
    fontSize: "1.2em",
    fontWeight: "700",
    color: "#fff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(102, 126, 234, 0.4)",
    transition: "transform 0.2s",
  },
  secondaryButton: {
    padding: "14px 28px",
    fontSize: "1.1em",
    fontWeight: "700",
    color: "#fff",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(34, 197, 94, 0.3)",
    transition: "transform 0.2s",
  },
  tertiaryButton: {
    padding: "12px 24px",
    fontSize: "1em",
    fontWeight: "600",
    color: "#64748b",
    background: "#f1f5f9",
    border: "2px solid #cbd5e1",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};