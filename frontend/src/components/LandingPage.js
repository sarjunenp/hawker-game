import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";

// Fun facts data
const HAWKER_FACTS = [
  "Maxwell Food Centre, opened in 1986, is home to the famous Tian Tian Hainanese Chicken Rice!",
  "Lau Pa Sat was built in 1894 and is Singapore's oldest Victorian filigree cast iron market structure.",
  "Chinatown Complex has over 260 stalls, making it one of Singapore's largest hawker centres!",
  "Old Airport Road Food Centre was built on the former site of Kallang Airport.",
  "Tekka Centre in Little India is a vibrant hub for authentic Indian cuisine and fresh produce.",
  "Adam Road Food Centre is a favorite late-night supper spot, operating until the early morning hours.",
  "Tiong Bahru Market, built in 1951, is one of Singapore's oldest hawker centres.",
  "Golden Mile Food Centre specializes in Thai cuisine and is known as 'Little Thailand'.",
  "East Coast Lagoon Food Village offers stunning seaside views while you eat.",
  "Zion Riverside Food Centre is famous for its Fried Hokkien Prawn Mee and Fried Carrot Cake!"
];

const DELICACY_FACTS = [
  "Hainanese Chicken Rice is Singapore's national dish, featuring poached chicken with fragrant rice.",
  "Laksa combines Chinese and Malay elements in a spicy coconut curry noodle soup.",
  "Char Kway Teow is stir-fried flat rice noodles with prawns, cockles, and dark soy sauce.",
  "Satay are grilled meat skewers served with peanut sauce, cucumber, and onions.",
  "Roti Prata is a crispy Indian flatbread that's perfect with curry or sugar!",
  "Bak Kut Teh literally means 'meat bone tea' - a peppery pork rib soup.",
  "Chilli Crab is Singapore's most iconic seafood dish with a sweet and savory tomato-chilli sauce.",
  "Nasi Lemak features coconut rice with fried chicken, egg, ikan bilis, and sambal.",
  "Hokkien Prawn Mee combines yellow noodles and rice vermicelli in a rich prawn broth.",
  "Kaya Toast with soft-boiled eggs and coffee is Singapore's quintessential breakfast!"
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hawkerFact, setHawkerFact] = useState("");
  const [delicacyFact, setDelicacyFact] = useState("");
  const [featuredChallenges, setFeaturedChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);

    // Check if redirected due to auth requirement
    if (searchParams.get("auth") === "required") {
      setShowLoginPrompt(true);
    }

    // Set random fun facts
    setHawkerFact(HAWKER_FACTS[Math.floor(Math.random() * HAWKER_FACTS.length)]);
    setDelicacyFact(DELICACY_FACTS[Math.floor(Math.random() * DELICACY_FACTS.length)]);

    // Load featured challenges
    loadFeaturedChallenges();
  }, [searchParams]);

  const loadFeaturedChallenges = async () => {
    try {
      // Get all active challenges
      const res = await api.get("/challenges/all");
      const allChallenges = res.data.challenges || [];
      
      // Filter challenges that have shop_description
      const challengesWithDesc = allChallenges.filter(c => c.shop_description && c.shop_description.trim());
      
      // Shuffle and pick 3 random challenges
      const shuffled = challengesWithDesc.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      
      setFeaturedChallenges(selected);
    } catch (err) {
      console.error("Failed to load featured challenges:", err);
      setFeaturedChallenges([]);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const handleLogin = () => {
    const loginUrl = `${process.env.REACT_APP_COGNITO_DOMAIN}/login?client_id=${process.env.REACT_APP_CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${process.env.REACT_APP_REDIRECT_URI}`;
    window.location.href = loginUrl;
  };

  const handleGameSelect = (game) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate(game);
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <div style={styles.container}>
      {showLoginPrompt && (
        <div style={styles.alertBanner}>
          <p style={styles.alertText}>
            🔒 Please log in to start playing!
          </p>
          <button onClick={() => setShowLoginPrompt(false)} style={styles.closeBtn}>
            ✕
          </button>
        </div>
      )}

      <div style={styles.hero}>
        <h1 style={styles.title}>🍜 Hawker Guesser 🎯</h1>
        <p style={styles.tagline}>
          Test your memory and knowledge of Singapore's iconic hawker centres!
        </p>
      </div>

      {/* Fun Facts Section */}
      <div style={styles.funFactsContainer}>
        <div style={styles.funFactCard}>
          <div style={styles.funFactIcon}>🏪</div>
          <h3 style={styles.funFactTitle}>Did You Know?</h3>
          <p style={styles.funFactText}>{hawkerFact}</p>
        </div>
        
        <div style={styles.funFactCard}>
          <div style={styles.funFactIcon}>🍽️</div>
          <h3 style={styles.funFactTitle}>Local Delicacy</h3>
          <p style={styles.funFactText}>{delicacyFact}</p>
        </div>
      </div>

      {/* Featured Challenges Section */}
      <div style={styles.featuredSection}>
        <h2 style={styles.featuredTitle}>🌟 Featured Hawker Stalls</h2>
        <p style={styles.featuredSubtitle}>Discover authentic local favorites from our sellers!</p>
        
        {loadingChallenges ? (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Loading featured stalls...</p>
          </div>
        ) : featuredChallenges.length === 0 ? (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>No featured stalls available right now. Check back soon!</p>
          </div>
        ) : (
          <div style={styles.challengesGrid} className="challenges-grid">
            {featuredChallenges.map((challenge, index) => (
              <div key={challenge.id || index} style={styles.challengeCard}>
                <div style={styles.challengeImageContainer}>
                  <img 
                    src={challenge.image_url} 
                    alt="Hawker stall" 
                    style={styles.challengeImage}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                    }}
                  />
                  <div style={styles.featuredBadge}>⭐ Featured</div>
                </div>
                <div style={styles.challengeContent}>
                  <p style={styles.challengeDescription}>
                    "{challenge.shop_description}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>How to Play</h2>
        <div style={styles.steps}>
          <div style={styles.step}>
            <span style={styles.stepNumber}>1</span>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Choose Your Game</h3>
              <p style={styles.stepText}>
                Pick between Memory Match, Sliding Puzzle or Word Scramble - all are fun!
              </p>
            </div>
          </div>

          <div style={styles.step}>
            <span style={styles.stepNumber}>2</span>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Complete the Puzzle</h3>
              <p style={styles.stepText}>
                Match food pairs, arrange puzzle tiles or unscramble words to unlock the challenge
              </p>
            </div>
          </div>

          <div style={styles.step}>
            <span style={styles.stepNumber}>3</span>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Guess the Location</h3>
              <p style={styles.stepText}>
                Identify which hawker centre the photo is from on the map
              </p>
            </div>
          </div>

          <div style={styles.step}>
            <span style={styles.stepNumber}>4</span>
            <div style={styles.stepContent}>
              <h3 style={styles.stepTitle}>Win Rewards</h3>
              <p style={styles.stepText}>
                Get it right and win reward coins that you can convert to discount offers on authentic local cuisine!
              </p>
            </div>
          </div>
        </div>

        {isLoggedIn ? (
          <div style={styles.gameOptions}>
            <button 
              onClick={() => handleGameSelect('/memory-game')}
              style={styles.gameOptionBtn}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={styles.gameEmoji}>🧠</span>
              <span style={styles.gameTitle}>Memory Match</span>
              <span style={styles.gameDesc}>Match pairs of hawker food cards</span>
            </button>
            
            <button 
              onClick={() => handleGameSelect('/sliding-puzzle')}
              style={styles.gameOptionBtn}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={styles.gameEmoji}>🧩</span>
              <span style={styles.gameTitle}>Sliding Puzzle</span>
              <span style={styles.gameDesc}>Arrange tiles to reveal the image</span>
            </button>

            <button 
              onClick={() => handleGameSelect('/word-scramble')}
              style={styles.gameOptionBtn}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={styles.gameEmoji}>🔤</span>
              <span style={styles.gameTitle}>Word Scramble</span>
              <span style={styles.gameDesc}>Unscramble hawker food names</span>
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={handleLogin}
              style={styles.loginButton}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔐 Login to Play
            </button>
            <p style={styles.loginNote}>
              You need to log in to start playing the game
            </p>
          </>
        )}
      </div>

      {/* Become a Seller Section - Only shown when logged in */}
      {isLoggedIn && (
        <div style={styles.sellerCard}>
          <div style={styles.sellerIcon}>🏪</div>
          <h2 style={styles.sellerTitle}>Are You a Hawker Seller?</h2>
          <p style={styles.sellerDescription}>
            Join our platform and showcase your stall to thousands of food lovers! 
            Share your delicious offerings and attract more customers through our game.
          </p>
          <a 
            href="https://forms.gle/mAMReLzto9ZKyzin9"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.sellerButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
            }}
          >
            📝 Apply to Become a Seller
          </a>
          <p style={styles.sellerNote}>
            ✨ Join our growing community of hawker vendors!
          </p>
        </div>
      )}

      <div style={styles.features}>
        <div style={styles.feature}>
          <span style={styles.featureIcon}>🎮</span>
          <p style={styles.featureText}>3 Fun Games</p>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureIcon}>📍</span>
          <p style={styles.featureText}>Explore Hawkers</p>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureIcon}>🪙</span>
          <p style={styles.featureText}>Accumulate Reward Coins</p>
        </div>
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
    position: "relative",
  },
  alertBanner: {
    position: "fixed",
    top: "60px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#fef3c7",
    border: "2px solid #f59e0b",
    borderRadius: "12px",
    padding: "15px 50px 15px 20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  alertText: {
    margin: 0,
    fontSize: "1.1em",
    fontWeight: "600",
    color: "#92400e",
  },
  closeBtn: {
    position: "absolute",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "1.5em",
    cursor: "pointer",
    color: "#92400e",
    padding: "0",
    lineHeight: "1",
  },
  hero: {
    textAlign: "center",
    marginBottom: "40px",
    animation: "fadeIn 1s ease-in",
  },
  title: {
    fontSize: "3em",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "15px",
    textShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },
  tagline: {
    fontSize: "1.3em",
    color: "#f0f0f0",
    fontWeight: "300",
  },
  funFactsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    maxWidth: "1000px",
    margin: "0 auto 40px",
  },
  funFactCard: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    padding: "25px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
    transition: "transform 0.3s ease",
    cursor: "default",
  },
  funFactIcon: {
    fontSize: "3em",
    marginBottom: "10px",
  },
  funFactTitle: {
    fontSize: "1.3em",
    fontWeight: "700",
    color: "#667eea",
    marginBottom: "12px",
  },
  funFactText: {
    fontSize: "0.95em",
    color: "#334155",
    lineHeight: "1.6",
    fontStyle: "italic",
  },
  // Featured Challenges Section
  featuredSection: {
    maxWidth: "1200px",
    margin: "0 auto 40px",
    textAlign: "center",
  },
  featuredTitle: {
    fontSize: "2.5em",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "10px",
    textShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },
  featuredSubtitle: {
    fontSize: "1.2em",
    color: "#f0f0f0",
    marginBottom: "30px",
    fontWeight: "300",
  },
  loadingContainer: {
    padding: "60px 20px",
  },
  loadingText: {
    fontSize: "1.2em",
    color: "#fff",
    fontStyle: "italic",
  },
  emptyContainer: {
    padding: "60px 20px",
  },
  emptyText: {
    fontSize: "1.2em",
    color: "#f0f0f0",
    fontStyle: "italic",
  },
  challengesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "25px",
    marginBottom: "20px",
  },
  challengeCard: {
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease",
  },
  challengeImageContainer: {
    position: "relative",
    width: "100%",
    height: "220px",
    overflow: "hidden",
  },
  challengeImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  featuredBadge: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.9em",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  challengeContent: {
    padding: "25px",
  },
  challengeDescription: {
    fontSize: "1.05em",
    color: "#334155",
    lineHeight: "1.7",
    fontStyle: "italic",
    minHeight: "80px",
    display: "-webkit-box",
    WebkitLineClamp: 4,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  card: {
    maxWidth: "750px",
    margin: "0 auto 40px",
    background: "#fff",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  cardTitle: {
    fontSize: "2em",
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: "30px",
  },
  steps: {
    marginBottom: "40px",
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "25px",
  },
  stepNumber: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5em",
    fontWeight: "700",
    flexShrink: 0,
    marginRight: "20px",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: "1.3em",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "8px",
  },
  stepText: {
    fontSize: "1em",
    color: "#64748b",
    lineHeight: "1.6",
  },
  gameOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },
  gameOptionBtn: {
    padding: "30px 20px",
    fontSize: "1em",
    fontWeight: "700",
    color: "#fff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  gameEmoji: {
    fontSize: "3em",
  },
  gameTitle: {
    fontSize: "1.3em",
    fontWeight: "700",
  },
  gameDesc: {
    fontSize: "0.9em",
    fontWeight: "400",
    opacity: 0.9,
    textAlign: "center",
  },
  loginButton: {
    width: "100%",
    padding: "20px",
    fontSize: "1.5em",
    fontWeight: "700",
    color: "#fff",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(245, 158, 11, 0.4)",
    transition: "all 0.3s ease",
  },
  loginNote: {
    marginTop: "15px",
    textAlign: "center",
    fontSize: "0.95em",
    color: "#64748b",
    fontStyle: "italic",
  },
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    maxWidth: "750px",
    margin: "0 auto",
    flexWrap: "wrap",
  },
  feature: {
    textAlign: "center",
    color: "#fff",
  },
  featureIcon: {
    fontSize: "3em",
    display: "block",
    marginBottom: "10px",
  },
  featureText: {
    fontSize: "1.1em",
    fontWeight: "600",
  },
  // Seller Application Card
  sellerCard: {
    maxWidth: "750px",
    margin: "0 auto 40px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(16, 185, 129, 0.3)",
    textAlign: "center",
    color: "#fff",
  },
  sellerIcon: {
    fontSize: "4em",
    marginBottom: "20px",
    animation: "bounce 2s infinite",
  },
  sellerTitle: {
    fontSize: "2em",
    fontWeight: "700",
    marginBottom: "15px",
    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  sellerDescription: {
    fontSize: "1.1em",
    lineHeight: "1.7",
    marginBottom: "30px",
    opacity: 0.95,
    maxWidth: "600px",
    margin: "0 auto 30px",
  },
  sellerButton: {
    display: "inline-block",
    padding: "18px 40px",
    fontSize: "1.3em",
    fontWeight: "700",
    color: "#10b981",
    background: "#fff",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
    transition: "all 0.3s ease",
    textDecoration: "none",
    marginBottom: "15px",
  },
  sellerNote: {
    fontSize: "1em",
    marginTop: "15px",
    opacity: 0.9,
    fontStyle: "italic",
  },
};

// Add hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .challenge-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.4) !important;
  }
  
  .challenge-card:hover img {
    transform: scale(1.1);
  }
  
  /* Responsive: 1 column on mobile, 2 on tablet, 3 on desktop */
  @media (max-width: 768px) {
    .challenges-grid {
      grid-template-columns: 1fr !important;
    }
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    .challenges-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
`;
document.head.appendChild(styleSheet);