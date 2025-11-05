// pointsService.js - Helper functions for points

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Award points to the current user
 * @param {number} amount - Points to award
 * @param {string} source - Source of points (e.g., 'memory_game', 'sliding_puzzle')
 * @param {string} description - Description of the action
 * @returns {Promise<Object>} Response with new balance
 */
export const awardPoints = async (amount, source, description) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('No auth token found');
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/points/earn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        source,
        description,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Dispatch event to update wallet badge
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { newBalance: data.new_balance, pointsEarned: amount } 
      }));
      
      return data;
    } else {
      console.error('Failed to award points:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error awarding points:', error);
    return null;
  }
};

/**
 * Get user's current balance
 * @returns {Promise<number>} Current points balance
 */
export const getBalance = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return 0;
    }

    const response = await fetch(`${API_BASE_URL}/points/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.total_points;
    }
    
    return 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};

/**
 * Get user's transaction history
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Array>} Array of transactions
 */
export const getTransactions = async (limit = 20) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/points/transactions?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.transactions;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

/**
 * Get all available rewards
 * @returns {Promise<Array>} Array of rewards
 */
export const getRewards = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    // ✅ FIX: Add authentication check
    if (!token) {
      console.warn('No auth token found for getRewards');
      return [];
    }

    console.log('🎁 Fetching available rewards from:', `${API_BASE_URL}/rewards`);

    // ✅ FIX: Add authentication headers
    const response = await fetch(`${API_BASE_URL}/rewards`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Rewards response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Rewards data received:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        console.log(`Found ${data.length} rewards (array format)`);
        return data;
      } else if (data.rewards && Array.isArray(data.rewards)) {
        console.log(`Found ${data.rewards.length} rewards (object format)`);
        return data.rewards;
      } else {
        console.warn('⚠️ Unexpected rewards format:', data);
        return [];
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to fetch rewards:', response.status, errorText);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching rewards:', error);
    return [];
  }
};

/**
 * Claim a reward
 * @param {string} rewardId - ID of the reward to claim
 * @returns {Promise<Object>} Claim result
 */
export const claimReward = async (rewardId) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('No auth token found');
      return null;
    }

    // Try to get user_id from token
    let userId = null;
    try {
      const idToken = localStorage.getItem('id_token');
      if (idToken) {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        userId = payload.sub || payload['cognito:username'];
      }
    } catch (e) {
      console.error('Error parsing token for user_id:', e);
    }

    const requestBody = { 
      reward_id: rewardId,
      ...(userId && { user_id: userId })
    };

    console.log('🎯 Claiming reward:', rewardId);
    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('🌐 API URL:', `${API_BASE_URL}/rewards/claim`);

    const response = await fetch(`${API_BASE_URL}/rewards/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📬 Response status:', response.status);
    console.log('📬 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Response body (raw):', responseText);

    if (response.ok) {
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn('Response is not JSON:', responseText);
        data = { message: responseText };
      }
      
      console.log('✅ Claim successful:', data);
      
      // Dispatch event to update wallet badge
      window.dispatchEvent(new CustomEvent('pointsUpdated'));
      
      return data;
    } else {
      console.error('❌ Claim failed with status:', response.status);
      console.error('❌ Error response:', responseText);
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
        throw new Error(errorData.error || errorData.message || errorData.body || 'Failed to claim reward');
      } catch (e) {
        if (e.message && e.message !== 'Failed to claim reward') {
          throw e; // Re-throw if it's our custom error
        }
        throw new Error(`Server error: ${responseText || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('💥 Error claiming reward:', error);
    console.error('💥 Error details:', error.message);
    throw error;
  }
};

/**
 * Get user's claimed rewards
 * @returns {Promise<Array>} Array of claimed rewards
 */
export const getMyRewards = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/rewards/my-rewards`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.rewards;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching my rewards:', error);
    return [];
  }
};

export default {
  awardPoints,
  getBalance,
  getTransactions,
  getRewards,
  claimReward,
  getMyRewards,
};