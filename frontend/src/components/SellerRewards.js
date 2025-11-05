import React, { useEffect, useState } from "react";
import api from "../api";

export default function SellerRewards() {
  const [rewards, setRewards] = useState([]);
  const [newReward, setNewReward] = useState({ description: "", discount_value: 10 });

  const loadRewards = async () => {
    const res = await api.get("/seller/rewards");
    setRewards(res.data.rewards || []);
  };

  const createReward = async () => {
    await api.post("/seller/rewards", newReward);
    loadRewards();
  };

  useEffect(() => {
    loadRewards();
  }, []);

  return (
    <div>
      <h2>Your Rewards</h2>
      <ul>
        {rewards.map((r) => (
          <li key={r.id}>
            {r.description} ({r.discount_value}{r.discount_type})
          </li>
        ))}
      </ul>

      <h3>Create New Reward</h3>
      <input
        placeholder="Description"
        value={newReward.description}
        onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
      />
      <input
        type="number"
        placeholder="Discount %"
        value={newReward.discount_value}
        onChange={(e) => setNewReward({ ...newReward, discount_value: e.target.value })}
      />
      <button onClick={createReward}>Create</button>
    </div>
  );
}
