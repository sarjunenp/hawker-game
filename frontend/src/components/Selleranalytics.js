import React from 'react';

const SellerAnalytics = () => {
  // Static analytics data for POC
  const challengeStats = [
    {
      id: 1,
      storeName: "Old Airport Road Food Centre",
      totalAttempts: 456,
      correctGuesses: 342,
      incorrectGuesses: 114,
      successRate: 75,
      trending: 'up',
    },
    {
      id: 2,
      storeName: "Maxwell Food Centre",
      totalAttempts: 389,
      correctGuesses: 267,
      incorrectGuesses: 122,
      successRate: 69,
      trending: 'up',
    },
    {
      id: 3,
      storeName: "Tekka Centre",
      totalAttempts: 312,
      correctGuesses: 156,
      incorrectGuesses: 156,
      successRate: 50,
      trending: 'down',
    },
    {
      id: 4,
      storeName: "Tiong Bahru Market",
      totalAttempts: 278,
      correctGuesses: 223,
      incorrectGuesses: 55,
      successRate: 80,
      trending: 'up',
    },
    {
      id: 5,
      storeName: "Golden Mile Food Centre",
      totalAttempts: 201,
      correctGuesses: 141,
      incorrectGuesses: 60,
      successRate: 70,
      trending: 'stable',
    },
  ];

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 75) return '#22c55e';
    if (rate >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Calculate totals
  const totals = challengeStats.reduce((acc, stat) => ({
    totalAttempts: acc.totalAttempts + stat.totalAttempts,
    correctGuesses: acc.correctGuesses + stat.correctGuesses,
    incorrectGuesses: acc.incorrectGuesses + stat.incorrectGuesses,
  }), { totalAttempts: 0, correctGuesses: 0, incorrectGuesses: 0 });

  const overallSuccessRate = totals.totalAttempts > 0 
    ? Math.round((totals.correctGuesses / totals.totalAttempts) * 100) 
    : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Challenge Performance Dashboard</h2>
        <p style={styles.subtitle}>Track how players are performing on your challenges</p>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={{...styles.summaryCard, ...styles.cardBlue}}>
          <div style={styles.summaryIcon}>🎯</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Total Attempts</div>
            <div style={styles.summaryValue}>{totals.totalAttempts.toLocaleString()}</div>
          </div>
        </div>

        <div style={{...styles.summaryCard, ...styles.cardGreen}}>
          <div style={styles.summaryIcon}>✅</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Correct Guesses</div>
            <div style={styles.summaryValue}>{totals.correctGuesses.toLocaleString()}</div>
          </div>
        </div>

        <div style={{...styles.summaryCard, ...styles.cardRed}}>
          <div style={styles.summaryIcon}>❌</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Incorrect Guesses</div>
            <div style={styles.summaryValue}>{totals.incorrectGuesses.toLocaleString()}</div>
          </div>
        </div>

        <div style={{...styles.summaryCard, ...styles.cardPurple}}>
          <div style={styles.summaryIcon}>🎖️</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryLabel}>Success Rate</div>
            <div style={styles.summaryValue}>{overallSuccessRate}%</div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div style={styles.tableContainer}>
        <h3 style={styles.tableTitle}>Challenge Breakdown</h3>
        
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={{...styles.th, textAlign: 'left'}}>Store Name</th>
                <th style={styles.th}>Total Attempts</th>
                <th style={styles.th}>✅ Correct</th>
                <th style={styles.th}>❌ Incorrect</th>
                <th style={styles.th}>Success Rate</th>
                <th style={styles.th}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {challengeStats.map((stat) => (
                <tr key={stat.id} style={styles.row}>
                  <td style={{...styles.td, ...styles.storeNameCell}}>
                    <div style={styles.storeInfo}>
                      <div style={styles.storeIcon}>🏪</div>
                      <span style={styles.storeName}>{stat.storeName}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.attemptsBadge}>{stat.totalAttempts}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.correctBadge}>{stat.correctGuesses}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.incorrectBadge}>{stat.incorrectGuesses}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.successRateCell}>
                      <div style={styles.progressBarContainer}>
                        <div 
                          style={{
                            ...styles.progressBar,
                            width: `${stat.successRate}%`,
                            backgroundColor: getSuccessRateColor(stat.successRate),
                          }}
                        />
                      </div>
                      <span 
                        style={{
                          ...styles.successRateText,
                          color: getSuccessRateColor(stat.successRate),
                        }}
                      >
                        {stat.successRate}%
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.trendIcon}>{getTrendIcon(stat.trending)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      <div style={styles.insightsContainer}>
        <h3 style={styles.insightsTitle}>💡 Insights & Recommendations</h3>
        <div style={styles.insightsGrid}>
          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>🏆</div>
            <div style={styles.insightContent}>
              <h4 style={styles.insightHeading}>Top Performer</h4>
              <p style={styles.insightText}>
                <strong>Tiong Bahru Market</strong> has the highest success rate at 80%!
              </p>
            </div>
          </div>

          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>⚠️</div>
            <div style={styles.insightContent}>
              <h4 style={styles.insightHeading}>Needs Attention</h4>
              <p style={styles.insightText}>
                <strong>Tekka Centre</strong> has a 50% success rate. Consider improving image quality.
              </p>
            </div>
          </div>

          <div style={styles.insightCard}>
            <div style={styles.insightIcon}>🔥</div>
            <div style={styles.insightContent}>
              <h4 style={styles.insightHeading}>Most Popular</h4>
              <p style={styles.insightText}>
                <strong>Old Airport Road</strong> has the most attempts (456). Keep it up!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '2em',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '1.1em',
    color: '#64748b',
    margin: 0,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '25px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease',
  },
  cardBlue: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  },
  cardGreen: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  },
  cardRed: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  cardPurple: {
    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
  },
  summaryIcon: {
    fontSize: '3em',
    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: '0.9em',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: '5px',
  },
  summaryValue: {
    fontSize: '2.2em',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1',
  },
  tableContainer: {
    background: '#fff',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
    marginBottom: '30px',
  },
  tableTitle: {
    fontSize: '1.5em',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '20px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  th: {
    padding: '15px 20px',
    textAlign: 'center',
    fontSize: '0.9em',
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  row: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '18px 20px',
    textAlign: 'center',
    fontSize: '0.95em',
    color: '#1e293b',
  },
  storeNameCell: {
    textAlign: 'left',
  },
  storeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  storeIcon: {
    fontSize: '1.5em',
  },
  storeName: {
    fontWeight: '600',
    fontSize: '1em',
  },
  attemptsBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: '8px',
    fontWeight: '700',
  },
  correctBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontWeight: '700',
  },
  incorrectBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontWeight: '700',
  },
  successRateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'center',
  },
  progressBarContainer: {
    width: '100px',
    height: '10px',
    background: '#e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
  successRateText: {
    fontWeight: '700',
    fontSize: '1em',
    minWidth: '45px',
  },
  trendIcon: {
    fontSize: '1.5em',
  },
  insightsContainer: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    borderRadius: '16px',
    padding: '30px',
  },
  insightsTitle: {
    fontSize: '1.5em',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '20px',
    textAlign: 'center',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  insightCard: {
    display: 'flex',
    gap: '15px',
    padding: '20px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  insightIcon: {
    fontSize: '2.5em',
    flexShrink: 0,
  },
  insightContent: {
    flex: 1,
  },
  insightHeading: {
    fontSize: '1.1em',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  insightText: {
    fontSize: '0.95em',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
};

// Add hover effect
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  tr:hover {
    background-color: #f8fafc !important;
  }
  
  .summary-card:hover {
    transform: translateY(-4px);
  }
  
  @media (max-width: 768px) {
    table {
      font-size: 0.85em;
    }
    th, td {
      padding: 12px 10px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default SellerAnalytics;