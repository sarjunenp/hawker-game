import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";

export default function Challenge() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current challenge and hawker centres
  useEffect(() => {
    async function fetchData() {
      try {
        const [challengeRes, centresRes] = await Promise.all([
          api.get("/challenges/current"),
          api.get("/centres"),
        ]);
        console.log("📋 Challenge loaded:", challengeRes.data);
        console.log("📍 Centres loaded:", centresRes.data.centres);
        setChallenge(challengeRes.data);
        setCentres(centresRes.data.centres || []);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Submit guess
  const submitGuess = async () => {
    if (!selectedCentre) return alert("Please select a hawker centre first!");
    
    console.log("🎯 Submitting guess:", {
      challenge_id: challenge.id,
      centre_name: selectedCentre.name,
    });

    try {
      const res = await api.post("/guess", {
        challenge_id: challenge.id,
        centre_name: selectedCentre.name,
      });
      console.log("✅ Guess result:", res.data);
      setResult(res.data);
      // Scroll to top when result appears
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error submitting guess:", err);
      console.error("Error response:", err.response?.data);
      alert("Something went wrong – please try again!");
    }
  };

  const handleMarkerClick = (centre) => {
    console.log("🖱️ Clicked centre:", centre);
    setSelectedCentre(centre);
    setResult(null);
  };

  const handleTryAgain = () => {
    navigate('/');
  };

  const handlePlayAgain = () => {
    setResult(null);
    setSelectedCentre(null);
    navigate('/');
  };

  const closeModal = () => {
    setResult(null);
    setSelectedCentre(null);
  };

  if (loading) return <p style={styles.loading}>Loading current challenge...</p>;
  if (!challenge) return <p style={styles.loading}>No active challenge found.</p>;

  return (
    <div className="challenge-container" style={styles.container}>
      <h2 style={styles.title}>🧭 Guess the Hawker Centre!</h2>
      
      <div style={styles.imageContainer}>
        <img
          src={challenge.image_url}
          alt="Challenge"
          style={styles.image}
        />
      </div>

      {selectedCentre && !result && (
        <div style={styles.selectedInfo}>
          📍 Selected: <strong>{selectedCentre.name}</strong>
        </div>
      )}

      <div style={styles.mapWrapper}>
        <MapContainer
          center={[1.35, 103.82]}
          zoom={12}
          style={styles.map}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OSM</a>'
          />
          {centres.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lon]}
              radius={selectedCentre?.id === c.id ? 14 : 10}
              color={selectedCentre?.id === c.id ? "#ef4444" : "#3b82f6"}
              fillColor={selectedCentre?.id === c.id ? "#ef4444" : "#3b82f6"}
              weight={3}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => handleMarkerClick(c),
              }}
            >
              <Popup>
                <div style={styles.popupContent}>
                  <strong style={styles.popupTitle}>{c.name}</strong>
                  <button
                    onClick={() => handleMarkerClick(c)}
                    style={styles.popupBtn}
                  >
                    ✓ Select This Centre
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div style={styles.controls}>
        <button
          onClick={submitGuess}
          disabled={!selectedCentre || result}
          style={{
            ...styles.button,
            backgroundColor: selectedCentre && !result ? "#22c55e" : "#cbd5e1",
            cursor: selectedCentre && !result ? "pointer" : "not-allowed",
          }}
        >
          {selectedCentre ? `🎯 Confirm: ${selectedCentre.name}` : "👆 Select a location on the map"}
        </button>
      </div>

      {/* Full-Screen Result Modal */}
      {result && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button 
              onClick={closeModal}
              style={styles.closeButton}
            >
              ✕
            </button>

            <div style={{
              ...styles.resultCard,
              backgroundColor: result.correct ? "#d1fae5" : "#fee2e2",
              border: result.correct ? "4px solid #10b981" : "4px solid #ef4444",
            }}>
              {/* Result Header */}
              <div style={styles.resultHeader}>
                <div style={styles.resultIcon}>
                  {result.correct ? "🎉" : "😢"}
                </div>
                <h2 style={{ 
                  fontSize: "2.5em", 
                  fontWeight: "800",
                  color: result.correct ? "#065f46" : "#991b1b",
                  margin: "20px 0",
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  {result.correct ? "Correct!" : "Not Quite!"}
                </h2>
                <p style={{ 
                  fontSize: "1.3em", 
                  fontWeight: "600",
                  color: result.correct ? "#065f46" : "#991b1b",
                  marginBottom: "20px",
                }}>
                  {result.message}
                </p>
              </div>

              {/* Correct Answer Info */}
              {result.correct && result.answer && (
                <p style={{ 
                  color: "#065f46", 
                  fontSize: "1.2em",
                  fontWeight: "600",
                  marginBottom: "25px",
                }}>
                  ✅ The answer was: <strong>{result.answer}</strong>
                </p>
              )}

              {/* Points Earned Section */}
              {result.correct && result.points_earned && (
                <div style={styles.pointsCard}>
                  <div style={styles.pointsBadge}>
                    🪙 {result.points_earned} Points
                  </div>
                  <p style={styles.pointsText}>
                    Awesome! You earned {result.points_earned} points!
                  </p>
                  <p style={styles.pointsSubtext}>
                    💡 Visit your wallet to claim rewards!
                  </p>
                </div>
              )}
              
              {/* Action buttons */}
              <div style={styles.actionButtons}>
                {result.correct ? (
                  <>
                    <button 
                      onClick={() => navigate('/wallet')}
                      style={{...styles.actionBtn, backgroundColor: "#667eea"}}
                    >
                      💰 View My Wallet & Claim Rewards
                    </button>
                    <button 
                      onClick={handlePlayAgain}
                      style={{...styles.actionBtn, backgroundColor: "#22c55e"}}
                    >
                      🎮 Play Again
                    </button>
                    <button 
                      onClick={() => navigate('/')}
                      style={{...styles.actionBtn, backgroundColor: "#64748b"}}
                    >
                      🏠 Back to Home
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ 
                      color: "#991b1b", 
                      fontSize: "1.1em",
                      marginTop: "10px", 
                      marginBottom: "15px",
                      fontWeight: "600",
                    }}>
                      💡 Try another game to get a second chance!
                    </p>
                    <button 
                      onClick={handleTryAgain}
                      style={{...styles.actionBtn, backgroundColor: "#ef4444"}}
                    >
                      🔄 Try Another Game
                    </button>
                    <button 
                      onClick={() => navigate('/')}
                      style={{...styles.actionBtn, backgroundColor: "#64748b"}}
                    >
                      🏠 Back to Home
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
    fontFamily: "Poppins, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  title: {
    fontSize: "2.2em",
    fontWeight: "700",
    marginBottom: "25px",
    color: "#1e293b",
  },
  imageContainer: {
    marginBottom: "25px",
  },
  image: {
    maxWidth: "500px",
    width: "90%",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    border: "4px solid #fff",
  },
  selectedInfo: {
    padding: "14px 24px",
    backgroundColor: "#dbeafe",
    borderRadius: "10px",
    display: "inline-block",
    marginBottom: "20px",
    fontSize: "1.15em",
    color: "#1e40af",
    fontWeight: "600",
    border: "2px solid #3b82f6",
  },
  mapWrapper: {
    height: "500px",
    width: "90%",
    maxWidth: "900px",
    margin: "20px auto",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    border: "3px solid #e2e8f0",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  controls: {
    marginTop: "25px",
  },
  button: {
    border: "none",
    color: "#fff",
    padding: "16px 40px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "700",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    minWidth: "300px",
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease",
  },
  modalContent: {
    position: "relative",
    width: "90%",
    maxWidth: "700px",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "slideUp 0.4s ease",
  },
  closeButton: {
    position: "absolute",
    top: "-10px",
    right: "10px",
    background: "#fff",
    border: "3px solid #ef4444",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "24px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#ef4444",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
    zIndex: 1001,
  },
  resultCard: {
    padding: "40px 30px",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  resultHeader: {
    marginBottom: "20px",
  },
  resultIcon: {
    fontSize: "5em",
    marginBottom: "15px",
    animation: "bounce 0.6s ease",
  },
  pointsCard: {
    marginTop: "25px",
    padding: "30px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "20px",
    boxShadow: "0 12px 30px rgba(102, 126, 234, 0.4)",
  },
  pointsBadge: {
    display: "inline-block",
    padding: "20px 40px",
    background: "#fff",
    color: "#667eea",
    fontSize: "2.5em",
    fontWeight: "800",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
  },
  pointsText: {
    color: "#fff",
    fontSize: "1.4em",
    fontWeight: "700",
    margin: "0 0 15px 0",
  },
  pointsSubtext: {
    color: "#e0e7ff",
    fontSize: "1.1em",
    fontWeight: "500",
    margin: 0,
  },
  actionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "30px",
  },
  actionBtn: {
    border: "none",
    color: "#fff",
    padding: "16px 32px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: "700",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
  },
  popupContent: {
    padding: "5px",
    textAlign: "center",
  },
  popupTitle: {
    fontSize: "15px",
    display: "block",
    marginBottom: "10px",
    color: "#1e293b",
  },
  popupBtn: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    width: "100%",
    transition: "background-color 0.2s",
  },
  loading: {
    textAlign: "center",
    padding: "60px 20px",
    fontSize: "1.3em",
    color: "#64748b",
  },
};