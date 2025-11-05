import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getBalance, 
  getTransactions, 
  getRewards, 
  claimReward, 
  getMyRewards 
} from '../services/pointsService';
import './Wallet.css';

const Wallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('balance'); // 'balance', 'rewards', 'myRewards'
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [balanceData, transactionsData, rewardsData, myRewardsData] = await Promise.all([
        getBalance(),
        getTransactions(20),
        getRewards(),
        getMyRewards(),
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData);
      setAvailableRewards(rewardsData);
      setMyRewards(myRewardsData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (reward) => {
    if (balance < reward.points_cost) {
      alert(`⚠️ Not enough points! You need ${reward.points_cost} points but only have ${balance}.`);
      return;
    }

    if (!window.confirm(`Claim "${reward.title}" for ${reward.points_cost} points?`)) {
      return;
    }

    try {
      // Use reward.id or reward.reward_id depending on what your API returns
      const rewardId = reward.id || reward.reward_id;
      
      console.log('🎯 Attempting to claim reward:', reward);
      console.log('📋 Reward ID being sent:', rewardId);
      
      if (!rewardId) {
        throw new Error('Reward ID is missing from reward object');
      }
      
      const result = await claimReward(rewardId);
      
      if (result) {
        // Show success message with point deduction
        alert(`🎉 Success!\n\nYou claimed: ${reward.title}\nPoints deducted: ${reward.points_cost}\nNew balance: ${balance - reward.points_cost}`);
        
        // Refresh data to show updated balance and new reward
        await loadWalletData();
        
        // Switch to My Rewards tab to show the newly claimed reward
        setActiveTab('myRewards');
      }
    } catch (error) {
      console.error('Failed to claim:', error);
      alert(`❌ Failed to claim reward: ${error.message}`);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="wallet-container">
        <div className="loading">
          <div className="loading-spinner">🪙</div>
          <p>Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      {/* Header */}
      <div className="wallet-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back
        </button>
        <h1 className="wallet-title">💰 My Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-icon">🪙</div>
        <div className="balance-info">
          <p className="balance-label">Total Points</p>
          <h2 className="balance-amount">{balance.toLocaleString()}</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance')}
        >
          📊 Transactions
        </button>
        <button
          className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          🎁 Available Rewards
        </button>
        <button
          className={`tab ${activeTab === 'myRewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('myRewards')}
        >
          🏆 My Rewards ({myRewards.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Transactions Tab */}
        {activeTab === 'balance' && (
          <div className="transactions-section">
            <h3 className="section-title">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">📝</p>
                <p className="empty-text">No transactions yet</p>
                <p className="empty-subtext">Start playing games to earn points!</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.map((tx, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-icon">
                      {tx.type === 'earn' ? '➕' : '➖'}
                    </div>
                    <div className="transaction-details">
                      <p className="transaction-description">{tx.description}</p>
                      <p className="transaction-date">{formatDate(tx.timestamp)}</p>
                    </div>
                    <div className={`transaction-amount ${tx.type}`}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="rewards-section">
            <h3 className="section-title">Redeem Your Points</h3>
            {availableRewards.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🎁</p>
                <p className="empty-text">No rewards available</p>
                <p className="empty-subtext">Check back later for new rewards!</p>
              </div>
            ) : (
              <div className="rewards-grid">
                {availableRewards.map((reward) => {
                  const canAfford = balance >= reward.points_cost;
                  
                  // Debug: Log reward structure
                  console.log('🎁 Available reward:', reward);
                  
                  return (
                    <div key={reward.id || reward.reward_id} className={`reward-card ${!canAfford ? 'locked' : ''}`}>
                      <div className="reward-header">
                        <div className="reward-discount">{reward.discount_percentage}% OFF</div>
                        {!canAfford && <div className="reward-lock">🔒</div>}
                      </div>
                      <h4 className="reward-title">{reward.title}</h4>
                      <p className="reward-description">{reward.description}</p>
                      <div className="reward-location">
                        📍 {reward.centre_name}
                      </div>
                      <div className="reward-footer">
                        <div className="reward-cost">
                          <span className="cost-label">Cost:</span>
                          <span className="cost-amount">🪙 {reward.points_cost}</span>
                        </div>
                        <button
                          onClick={() => handleClaimReward(reward)}
                          disabled={!canAfford}
                          className={`claim-button ${canAfford ? 'active' : 'disabled'}`}
                        >
                          {canAfford ? 'Claim' : 'Not Enough Points'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Rewards Tab */}
        {activeTab === 'myRewards' && (
          <div className="my-rewards-section">
            <h3 className="section-title">Your Claimed Rewards</h3>
            {myRewards.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🏆</p>
                <p className="empty-text">No rewards claimed yet</p>
                <p className="empty-subtext">Visit the Available Rewards tab to redeem points!</p>
              </div>
            ) : (
              <div className="my-rewards-list">
                {myRewards.map((reward, index) => {
                  const isUsed = reward.status === 'used';
                  const isExpired = new Date(reward.expiry_date) < new Date();
                  
                  return (
                    <div key={index} className={`my-reward-card ${isUsed ? 'used' : ''} ${isExpired ? 'expired' : ''}`}>
                      <div className="my-reward-header">
                        <div className="reward-badge">{reward.discount_percentage}% OFF</div>
                        {isUsed && <div className="status-badge used">✓ Used</div>}
                        {isExpired && !isUsed && <div className="status-badge expired">⏰ Expired</div>}
                        {!isUsed && !isExpired && <div className="status-badge active">✨ Active</div>}
                      </div>
                      
                      <h4 className="my-reward-title">{reward.title}</h4>
                      <p className="my-reward-description">{reward.description}</p>
                      
                      <div className="my-reward-details">
                        <div className="detail-row">
                          <span className="detail-label">📍 Location:</span>
                          <span className="detail-value">{reward.centre_name}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">💰 Points Spent:</span>
                          <span className="detail-value">{reward.points_cost || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">📅 Claimed:</span>
                          <span className="detail-value">{formatDate(reward.claimed_at)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">⏳ Expires:</span>
                          <span className="detail-value">{formatDate(reward.expiry_date)}</span>
                        </div>
                        {isUsed && (
                          <div className="detail-row">
                            <span className="detail-label">✓ Used:</span>
                            <span className="detail-value">{formatDate(reward.used_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Simple success message - no QR code needed */}
                      {!isUsed && !isExpired && (
                        <div style={{
                          marginTop: '20px',
                          padding: '15px',
                          background: '#d1fae5',
                          borderRadius: '12px',
                          textAlign: 'center',
                        }}>
                          <p style={{
                            color: '#065f46',
                            fontWeight: '700',
                            margin: 0,
                          }}>
                            ✅ Reward Claimed Successfully!
                          </p>
                          <p style={{
                            color: '#065f46',
                            fontSize: '0.9em',
                            margin: '8px 0 0 0',
                          }}>
                            Show this to the seller at {reward.centre_name}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;