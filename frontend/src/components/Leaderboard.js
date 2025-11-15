import React, { useEffect, useState } from "react";
import api from "../api";

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get("/leaderboard");
      console.log("🏆 Leaderboard data:", response.data);
      setLeaderboardData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🏆 Leaderboard</h3>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error || !leaderboardData) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>🏆 Leaderboard</h3>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Unable to load leaderboard</p>
          <button onClick={fetchLeaderboard} style={styles.retryButton}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const { top_10, current_user } = leaderboardData;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🏆 Leaderboard</h3>
      <p style={styles.subtitle}>Top Players by Points</p>

      {/* Top 10 List */}
      <div style={styles.leaderboardList}>
        {top_10.map((entry, index) => (
          <div
            key={index}
            style={{
              ...styles.leaderboardItem,
              ...(entry.is_current_user ? styles.currentUserItem : {}),
            }}
          >
            {/* Rank Badge */}
            <div style={{
              ...styles.rankBadge,
              ...(index === 0 ? styles.firstPlace : {}),
              ...(index === 1 ? styles.secondPlace : {}),
              ...(index === 2 ? styles.thirdPlace : {}),
              ...(entry.is_current_user ? styles.currentUserRank : {}),
            }}>
              {index === 0 && "🥇"}
              {index === 1 && "🥈"}
              {index === 2 && "🥉"}
              {index > 2 && `#${entry.rank}`}
            </div>

            {/* Username */}
            <div style={styles.username}>
              {entry.is_current_user && <span style={styles.youBadge}>YOU</span>}
              {!entry.is_current_user && entry.username}
            </div>

            {/* Points */}
            <div style={styles.points}>
              <span style={styles.coinIcon}>🪙</span>
              <span style={styles.pointsValue}>{entry.points}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Current User Position (if outside top 10) */}
      {current_user.show_separately && (
        <div style={styles.currentUserSection}>
          <div style={styles.separator}>
            <span style={styles.separatorDots}>• • •</span>
          </div>
          
          <div style={{...styles.leaderboardItem, ...styles.currentUserItem}}>
            <div style={{...styles.rankBadge, ...styles.currentUserRank}}>
              #{current_user.rank}
            </div>
            
            <div style={styles.username}>
              <span style={styles.youBadge}>YOU</span>
            </div>
            
            <div style={styles.points}>
              <span style={styles.coinIcon}>🪙</span>
              <span style={styles.pointsValue}>{current_user.points}</span>
            </div>
          </div>

          <p style={styles.rankInfo}>
            You're ranked #{current_user.rank} out of {current_user.total_players} players
          </p>
        </div>
      )}

      {/* Current User Stats (if in top 10) */}
      {!current_user.show_separately && current_user.rank && (
        <div style={styles.userStatsSection}>
          <p style={styles.userStats}>
            🎉 You're in the top 10! Ranked #{current_user.rank} with {current_user.points} points
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <button onClick={fetchLeaderboard} style={styles.refreshButton}>
        🔄 Refresh Leaderboard
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "40px auto 20px",
    padding: "30px",
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "2em",
    fontWeight: "800",
    textAlign: "center",
    color: "#1e293b",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "1.1em",
    textAlign: "center",
    color: "#64748b",
    marginBottom: "25px",
    fontWeight: "500",
  },
  loadingContainer: {
    padding: "40px",
    textAlign: "center",
  },
  loadingText: {
    fontSize: "1.1em",
    color: "#64748b",
    fontStyle: "italic",
  },
  errorContainer: {
    padding: "40px",
    textAlign: "center",
  },
  errorText: {
    fontSize: "1.1em",
    color: "#ef4444",
    marginBottom: "20px",
  },
  retryButton: {
    padding: "12px 24px",
    fontSize: "1em",
    fontWeight: "600",
    color: "#fff",
    background: "#3b82f6",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  leaderboardList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  leaderboardItem: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    background: "#f8fafc",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    border: "2px solid transparent",
  },
  currentUserItem: {
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    border: "2px solid #f59e0b",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
  },
  rankBadge: {
    minWidth: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.3em",
    fontWeight: "800",
    borderRadius: "10px",
    background: "#e2e8f0",
    color: "#475569",
    marginRight: "16px",
  },
  firstPlace: {
    background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
    color: "#92400e",
    boxShadow: "0 4px 12px rgba(255, 215, 0, 0.4)",
  },
  secondPlace: {
    background: "linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)",
    color: "#374151",
    boxShadow: "0 4px 12px rgba(192, 192, 192, 0.4)",
  },
  thirdPlace: {
    background: "linear-gradient(135deg, #cd7f32 0%, #e6a157 100%)",
    color: "#451a03",
    boxShadow: "0 4px 12px rgba(205, 127, 50, 0.4)",
  },
  currentUserRank: {
    background: "#f59e0b",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
  },
  username: {
    flex: 1,
    fontSize: "1.15em",
    fontWeight: "600",
    color: "#1e293b",
  },
  youBadge: {
    display: "inline-block",
    padding: "6px 16px",
    background: "#667eea",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "0.95em",
    fontWeight: "700",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
  },
  points: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1.2em",
    fontWeight: "700",
    color: "#1e293b",
  },
  coinIcon: {
    fontSize: "1.3em",
  },
  pointsValue: {
    minWidth: "60px",
    textAlign: "right",
  },
  currentUserSection: {
    marginTop: "30px",
  },
  separator: {
    textAlign: "center",
    margin: "20px 0",
  },
  separatorDots: {
    fontSize: "1.5em",
    color: "#cbd5e1",
    letterSpacing: "8px",
  },
  rankInfo: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "1em",
    color: "#64748b",
    fontWeight: "600",
  },
  userStatsSection: {
    marginTop: "20px",
    padding: "16px",
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    borderRadius: "12px",
    border: "2px solid #3b82f6",
  },
  userStats: {
    margin: 0,
    fontSize: "1.1em",
    fontWeight: "600",
    color: "#1e40af",
    textAlign: "center",
  },
  refreshButton: {
    width: "100%",
    marginTop: "25px",
    padding: "14px",
    fontSize: "1em",
    fontWeight: "600",
    color: "#fff",
    background: "#64748b",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};