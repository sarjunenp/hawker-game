import React, { useState, useEffect } from "react";
import api from "../api";

export default function Seller() {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState("");
  const [file, setFile] = useState(null);
  const [shopDescription, setShopDescription] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastChallenges, setPastChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  // Load list of hawker centres
  useEffect(() => {
    async function loadCentres() {
      try {
        const res = await api.get("/centres");
        setCentres(res.data.centres || []);
      } catch (err) {
        console.error("Failed to load centres", err);
      }
    }
    loadCentres();
  }, []);

  // Load past challenges created by this seller
  useEffect(() => {
    loadPastChallenges();
  }, []);

  const loadPastChallenges = async () => {
    setLoadingChallenges(true);
    try {
      console.log("🔄 Fetching past challenges...");
      const res = await api.get("/seller/challenges");
      console.log("📋 API Response:", res);
      console.log("📋 Response data:", res.data);
      console.log("📋 Challenges array:", res.data.challenges);
      console.log("📋 Number of challenges:", res.data.challenges?.length || 0);
      
      const challengesArray = res.data.challenges || [];
      console.log("📋 Setting challenges:", challengesArray);
      setPastChallenges(challengesArray);
    } catch (err) {
      console.error("❌ Failed to load past challenges", err);
      console.error("❌ Error details:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      setPastChallenges([]);
    } finally {
      setLoadingChallenges(false);
    }
  };

  // Handle boost challenge
  const handleBoostChallenge = async (challengeId) => {
    if (!window.confirm("Boost this challenge for 1000 coins? This will make it appear more frequently to players!")) {
      return;
    }

    try {
      // Deduct 1000 coins using the new spend endpoint
      const res = await api.post("/points/spend", {
        amount: 1000,
        source: "challenge_boost",
        description: `Boosted challenge ${challengeId}`
      });

      if (res.data) {
        alert("🚀 Challenge boosted successfully! Your challenge will now appear more frequently.");
        // Trigger wallet badge update
        window.dispatchEvent(new CustomEvent('pointsUpdated'));
      }
    } catch (err) {
      console.error("❌ Failed to boost challenge:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  // Handle buy coins
  const handleBuyCoins = async () => {
    if (!window.confirm("Purchase 1000 coins? This is a demo, so coins will be added instantly!")) {
      return;
    }

    try {
      const res = await api.post("/points/earn", {
        amount: 1000,
        source: "purchase",
        description: "Purchased 1000 coins"
      });

      if (res.data) {
        alert("🪙 Success! 1000 coins added to your wallet!");
        // Trigger wallet badge update
        window.dispatchEvent(new CustomEvent('pointsUpdated'));
      }
    } catch (err) {
      console.error("❌ Failed to buy coins:", err);
      alert(`❌ Error: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle image selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus(""); // Clear previous status
  };

  // Handle description change with character limit
  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setShopDescription(text);
    }
  };

  // Combined: Upload to S3 AND create challenge
  const handleSubmit = async () => {
    if (!file) {
      setStatus("⚠️ Please select an image first!");
      return;
    }
    if (!selectedCentre) {
      setStatus("⚠️ Please select a hawker centre!");
      return;
    }
    if (!shopDescription.trim()) {
      setStatus("⚠️ Please add a shop description!");
      return;
    }
    if (shopDescription.trim().length < 20) {
      setStatus("⚠️ Shop description should be at least 20 characters!");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Step 1: Request presigned URL with original filename
      setStatus("📤 Preparing upload...");
      
      const urlRes = await api.post("/seller/upload-url", { 
        file_name: file.name 
      });
      const { upload_url, public_url, challenge_id } = urlRes.data;

      console.log("📋 Challenge ID:", challenge_id);
      console.log("🔗 Upload URL:", upload_url);
      console.log("🔗 Public URL:", public_url);

      // Step 2: Upload file directly to S3
      setStatus("📤 Uploading image to S3...");
      
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      console.log("✅ Image uploaded to:", public_url);

      // Step 3: Create challenge in DynamoDB with the same ID and shop description
      setStatus("💾 Creating challenge...");
      
      const challengeRes = await api.post("/seller/challenge", {
        image_url: public_url,
        answer_hawker_centre_id: selectedCentre,
        challenge_id: challenge_id,  // Use the same ID from upload
        shop_description: shopDescription.trim(), // Add shop description
      });

      console.log("✅ Challenge created:", challengeRes.data);
      
      setStatus("🎉 Challenge created successfully!");
      
      // Reload past challenges to show the new one
      await loadPastChallenges();
      
      // Reset form
      setFile(null);
      setSelectedCentre("");
      setShopDescription("");
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

    } catch (err) {
      console.error("❌ Error:", err);
      console.error("❌ Response:", err.response?.data);
      setStatus(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧑‍🍳 Seller Dashboard</h2>
      <p style={styles.subtitle}>
        Upload your hawker stall photo, tag the correct hawker centre, and add a description to create a new challenge!
      </p>

      <div style={styles.card}>
        {/* Hawker Centre Selection */}
        <div style={styles.section}>
          <label style={styles.label}>Select Hawker Centre:</label>
          <select
            style={styles.select}
            value={selectedCentre}
            onChange={(e) => setSelectedCentre(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">-- Choose a hawker centre --</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Shop Description */}
        <div style={styles.section}>
          <label style={styles.label}>
            Shop Description: 
            <span style={styles.charCount}>
              ({shopDescription.length}/500 characters)
            </span>
          </label>
          <textarea
            style={styles.textarea}
            value={shopDescription}
            onChange={handleDescriptionChange}
            disabled={isSubmitting}
            placeholder="Tell customers about your stall! What makes it special? What are your signature dishes? (20-500 characters)"
            rows="4"
          />
          {shopDescription.length > 0 && shopDescription.length < 20 && (
            <p style={styles.hint}>
              ⚠️ Please write at least {20 - shopDescription.length} more characters
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div style={styles.section}>
          <label style={styles.label}>Upload Stall Image:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={isSubmitting}
            style={styles.fileInput}
          />
          {file && (
            <p style={styles.fileName}>
              📎 Selected: {file.name}
            </p>
          )}
        </div>

        {/* Single Submit Button */}
        <button
          onClick={handleSubmit}
          style={{
            ...styles.submitBtn,
            backgroundColor:
              file && selectedCentre && shopDescription.trim().length >= 20 && !isSubmitting ? "#22c55e" : "#cbd5e1",
            cursor:
              file && selectedCentre && shopDescription.trim().length >= 20 && !isSubmitting ? "pointer" : "not-allowed",
          }}
          disabled={!file || !selectedCentre || shopDescription.trim().length < 20 || isSubmitting}
        >
          {isSubmitting ? "⏳ Processing..." : "🚀 Upload & Create Challenge"}
        </button>

        {status && (
          <p style={{
            ...styles.status,
            color: status.includes("❌") ? "#ef4444" : 
                   status.includes("⚠️") ? "#f59e0b" : "#22c55e"
          }}>
            {status}
          </p>
        )}
      </div>

      {/* Past Challenges Section */}
      <div style={styles.challengesSection}>
        <h3 style={styles.sectionTitle}>📜 Your Past Challenges</h3>
        
        {loadingChallenges ? (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Loading your challenges...</p>
          </div>
        ) : pastChallenges.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>📭</p>
            <p style={styles.emptyText}>No challenges created yet</p>
            <p style={styles.emptySubtext}>Upload your first challenge above!</p>
          </div>
        ) : (
          <div style={styles.challengesList}>
            {pastChallenges.map((challenge, index) => {
              // Find the centre name
              const centre = centres.find(c => c.id === parseInt(challenge.answer_hawker_centre_id));
              const centreName = centre ? centre.name : `Centre #${challenge.answer_hawker_centre_id}`;
              
              return (
                <div key={challenge.id || index} style={styles.challengeCard} className="challenge-card">
                  {/* Challenge Image */}
                  <div style={styles.challengeImageContainer}>
                    <img 
                      src={challenge.image_url} 
                      alt="Challenge" 
                      style={styles.challengeImage}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                      }}
                    />
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: challenge.status === 'active' ? '#22c55e' : '#64748b'
                    }}>
                      {challenge.status === 'active' ? '✅ Active' : '🔒 Inactive'}
                    </div>
                  </div>
                  
                  {/* Challenge Details */}
                  <div style={styles.challengeDetails}>
                    <div style={styles.challengeHeader}>
                      <h4 style={styles.challengeTitle}>📍 {centreName}</h4>
                    </div>
                    
                    {challenge.shop_description && (
                      <p style={styles.challengeDescription}>
                        "{challenge.shop_description}"
                      </p>
                    )}

                    {/* Boost Button */}
                    <div style={styles.challengeActions}>
                      <button
                        onClick={() => handleBoostChallenge(challenge.id)}
                        style={styles.boostButton}
                        className="boost-button"
                      >
                        🚀 Boost Challenge (1000 coins)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buy Coins Section */}
      <div style={styles.buyCoinsSection}>
        <div style={styles.buyCoinsCard}>
          <div style={styles.buyCoinsIcon}>🪙</div>
          <h3 style={styles.buyCoinsTitle}>Need More Coins?</h3>
          <p style={styles.buyCoinsText}>
            Purchase coins to boost your challenges and increase visibility!
          </p>
          <div style={styles.buyCoinsOffer}>
            <div style={styles.coinAmount}>1,000 Coins</div>
            <div style={styles.coinPrice}>Demo Purchase</div>
          </div>
          <button
            onClick={handleBuyCoins}
            style={styles.buyCoinsButton}
            className="buy-coins-button"
          >
            💰 Buy 1,000 Coins
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Inline Styles ---
const styles = {
  container: {
    textAlign: "center",
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "40px 20px",
  },
  title: {
    fontSize: "2em",
    fontWeight: "700",
    marginBottom: "10px",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: "1.1em",
    color: "#64748b",
    marginBottom: "30px",
    maxWidth: "600px",
    margin: "0 auto 30px",
    lineHeight: "1.6",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
  },
  section: {
    marginBottom: "25px",
    textAlign: "left",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#334155",
    fontSize: "14px",
  },
  charCount: {
    float: "right",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "400",
  },
  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    outline: "none",
    transition: "border 0.2s ease",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    outline: "none",
    transition: "border 0.2s ease",
    fontSize: "14px",
    backgroundColor: "#fff",
    fontFamily: "'Poppins', sans-serif",
    resize: "vertical",
    minHeight: "100px",
  },
  hint: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#f59e0b",
    fontStyle: "italic",
  },
  fileInput: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
  },
  fileName: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#64748b",
    fontStyle: "italic",
  },
  submitBtn: {
    width: "100%",
    marginTop: "25px",
    padding: "16px 24px",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  status: {
    marginTop: "20px",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#f1f5f9",
    fontWeight: "600",
    fontSize: "14px",
  },
  // Past Challenges Section
  challengesSection: {
    maxWidth: "1000px",
    margin: "40px auto 0",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
  },
  sectionTitle: {
    fontSize: "1.5em",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "20px",
    textAlign: "left",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px",
  },
  loadingText: {
    fontSize: "1.1em",
    color: "#64748b",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyIcon: {
    fontSize: "4em",
    marginBottom: "15px",
  },
  emptyText: {
    fontSize: "1.3em",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "5px",
  },
  emptySubtext: {
    fontSize: "1em",
    color: "#94a3b8",
  },
  challengesList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  challengeCard: {
    display: "flex",
    gap: "20px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    transition: "all 0.3s ease",
  },
  challengeImageContainer: {
    position: "relative",
    flexShrink: 0,
  },
  challengeImage: {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "3px solid #fff",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  statusBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  challengeDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  challengeHeader: {
    marginBottom: "10px",
  },
  challengeTitle: {
    fontSize: "1.3em",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 5px 0",
  },
  challengeDescription: {
    fontSize: "0.95em",
    color: "#475569",
    lineHeight: "1.6",
    fontStyle: "italic",
    margin: "10px 0",
    padding: "10px",
    background: "#fff",
    borderRadius: "8px",
    borderLeft: "3px solid #667eea",
  },
  challengeActions: {
    marginTop: "15px",
    paddingTop: "15px",
    borderTop: "2px solid #e2e8f0",
  },
  boostButton: {
    width: "100%",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
  },
  // Buy Coins Section
  buyCoinsSection: {
    maxWidth: "1000px",
    margin: "30px auto 0",
  },
  buyCoinsCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 12px 30px rgba(102, 126, 234, 0.4)",
    textAlign: "center",
    color: "#fff",
  },
  buyCoinsIcon: {
    fontSize: "4em",
    marginBottom: "15px",
    animation: "bounce 2s ease-in-out infinite",
  },
  buyCoinsTitle: {
    fontSize: "2em",
    fontWeight: "800",
    margin: "0 0 15px 0",
    color: "#fff",
  },
  buyCoinsText: {
    fontSize: "1.1em",
    marginBottom: "25px",
    opacity: 0.95,
  },
  buyCoinsOffer: {
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "25px",
    backdropFilter: "blur(10px)",
  },
  coinAmount: {
    fontSize: "2.5em",
    fontWeight: "800",
    marginBottom: "5px",
  },
  coinPrice: {
    fontSize: "1.2em",
    fontWeight: "600",
    opacity: 0.9,
  },
  buyCoinsButton: {
    padding: "16px 40px",
    background: "#fff",
    color: "#667eea",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
  },
};

// --- Small hover/focus animation ---
const hoverEffect = `
  button:not(:disabled):hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
  select:focus, input:focus, textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  
  /* Challenge card hover effect */
  .challenge-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateX(4px);
  }
  
  /* Boost button hover */
  .boost-button:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4) !important;
  }
  
  /* Buy coins button hover */
  .buy-coins-button:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
  }
  
  /* Coin icon animation */
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .challenge-card {
      flex-direction: column;
    }
    
    .challenge-card img {
      width: 100%;
      height: 200px;
    }
  }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = hoverEffect;
document.head.appendChild(styleSheet);