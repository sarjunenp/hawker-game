import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WalletBadge.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const WalletBadge = () => {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBalance();
    
    // Listen for points updates from other components
    window.addEventListener('pointsUpdated', fetchBalance);
    
    return () => {
      window.removeEventListener('pointsUpdated', fetchBalance);
    };
  }, []);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/points/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPoints(data.total_points);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    navigate('/wallet');
  };

  if (loading) {
    return (
      <div className="wallet-badge">
        <span className="wallet-icon">🪙</span>
        <span className="wallet-points">...</span>
      </div>
    );
  }

  return (
    <div className="wallet-badge" onClick={handleClick}>
      <span className="wallet-icon">🪙</span>
      <span className="wallet-points">{points.toLocaleString()}</span>
    </div>
  );
};

export default WalletBadge;