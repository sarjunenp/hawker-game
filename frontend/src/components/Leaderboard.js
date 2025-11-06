import React from 'react';

const Leaderboard = () => {
  // Static leaderboard data for POC
  const leaderboardData = [
    { rank: 1, username: 'HawkerMaster88', coins: 15420, badge: '👑' },
    { rank: 2, username: 'FoodieExplorer', coins: 12850, badge: '🥈' },
    { rank: 3, username: 'SGLocalChamp', coins: 10990, badge: '🥉' },
    { rank: 4, username: 'NasiLemakFan', coins: 9560, badge: '' },
    { rank: 5, username: 'ChickenRiceLover', coins: 8730, badge: '' },
    { rank: 6, username: 'LaksaQueen', coins: 7420, badge: '' },
    { rank: 7, username: 'SatayKing', coins: 6890, badge: '' },
    { rank: 8, username: 'HokkienMeeMaster', coins: 5640, badge: '' },
    { rank: 9, username: 'CharKwayTeowPro', coins: 4920, badge: '' },
    { rank: 10, username: 'RotiPrataBoss', coins: 4150, badge: '' },
  ];

  return (
    <div style={styles.leaderboardContainer}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏆 Top Players Leaderboard</h2>
        <p style={styles.subtitle}>Challenge the best hawker hunters in Singapore!</p>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={{...styles.th, ...styles.rankColumn}}>Rank</th>
              <th style={{...styles.th, ...styles.usernameColumn}}>Player</th>
              <th style={{...styles.th, ...styles.coinsColumn}}>Coins</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((player) => (
              <tr 
                key={player.rank} 
                style={{
                  ...styles.row,
                  ...(player.rank <= 3 ? styles.topThree : {}),
                }}
              >
                <td style={styles.td}>
                  <div style={styles.rankCell}>
                    {player.badge && <span style={styles.badge}>{player.badge}</span>}
                    <span style={styles.rankNumber}>{player.rank}</span>
                  </div>
                </td>
                <td style={{...styles.td, ...styles.usernameCell}}>
                  <span style={styles.username}>{player.username}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.coinsCell}>
                    <span style={styles.coinIcon}>🪙</span>
                    <span style={styles.coinAmount}>{player.coins.toLocaleString()}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          💡 Keep playing to climb the ranks and earn more coins!
        </p>
      </div>
    </div>
  );
};

const styles = {
  leaderboardContainer: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '30px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '2em',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 10px 0',
    textShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
  },
  subtitle: {
    fontSize: '1em',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
  },
  tableContainer: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  th: {
    padding: '18px 20px',
    textAlign: 'left',
    fontSize: '0.95em',
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  rankColumn: {
    width: '80px',
    textAlign: 'center',
  },
  usernameColumn: {
    width: 'auto',
  },
  coinsColumn: {
    width: '150px',
    textAlign: 'right',
  },
  row: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
  },
  topThree: {
    background: 'linear-gradient(to right, #fff9e6, #ffffff)',
  },
  td: {
    padding: '16px 20px',
    fontSize: '1em',
    color: '#1e293b',
  },
  rankCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '1.5em',
  },
  rankNumber: {
    fontWeight: '700',
    fontSize: '1.1em',
    color: '#64748b',
  },
  usernameCell: {
    fontWeight: '600',
  },
  username: {
    color: '#1e293b',
  },
  coinsCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  coinIcon: {
    fontSize: '1.3em',
  },
  coinAmount: {
    fontWeight: '700',
    fontSize: '1.1em',
    color: '#f59e0b',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.95em',
    margin: 0,
  },
};

// Add hover effect with CSS-in-JS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  tr:hover {
    background-color: #f8fafc !important;
    transform: scale(1.01);
  }
`;
document.head.appendChild(styleSheet);

export default Leaderboard;