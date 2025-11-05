import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import MemoryGame from "./components/MemoryGame";
import SlidingPuzzle from "./components/SlidingPuzzle";
import WordScramble from "./components/WordScramble";
import Challenge from "./components/Challenge";
import Seller from "./components/Seller";
import WalletBadge from "./components/WalletBadge";
import Wallet from "./components/Wallet";
import Callback from "./callback";
import ProtectedRoute from "./components/ProtectedRoute";
import "leaflet/dist/leaflet.css";
import "./App.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);

    if (token) {
      try {
        const idToken = localStorage.getItem("id_token");
        if (idToken) {
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          const groups = payload["cognito:groups"] || [];
          
          let isSellerUser = false;
          if (Array.isArray(groups)) {
            isSellerUser = groups.some(g => {
              const groupStr = typeof g === 'string' ? g.trim() : String(g).trim();
              const cleanGroup = groupStr.startsWith('[') && groupStr.endsWith(']')
                ? groupStr.slice(1, -1)
                : groupStr;
              return cleanGroup.toLowerCase() === 'sellers';
            });
          }
          
          setIsSeller(isSellerUser);
        }
      } catch (e) {
        console.error('Error parsing token:', e);
        setIsSeller(false);
      }
    } else {
      setIsSeller(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    setIsSeller(false);
    window.location.href = "/";
  };

  const loginUrl = `${process.env.REACT_APP_COGNITO_DOMAIN}/login?client_id=${process.env.REACT_APP_CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${process.env.REACT_APP_REDIRECT_URI}`;

  return (
    <BrowserRouter>
      {/* Responsive Navbar */}
      <nav className="app-nav">
        {/* Left side - Home */}
        <div className="nav-home">
          <a href="/" className="nav-link">Home</a>
        </div>

        {/* Center - Game links (hidden on mobile when not logged in) */}
        {isLoggedIn && (
          <div className="nav-games">
            <a href="/memory-game" className="nav-link">Memory</a>
            <a href="/sliding-puzzle" className="nav-link">Puzzle</a>
            <a href="/word-scramble" className="nav-link">Word</a>
            {isSeller && <a href="/seller" className="nav-link">Seller</a>}
          </div>
        )}

        {/* Right side - Wallet + Auth */}
        <div className="nav-auth">
          {isLoggedIn && <WalletBadge />}
          {isLoggedIn ? (
            <button onClick={handleLogout} className="nav-btn">
              Logout
            </button>
          ) : (
            <a href={loginUrl} className="nav-btn-link">Login</a>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route 
          path="/memory-game" 
          element={
            <ProtectedRoute>
              <MemoryGame />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sliding-puzzle" 
          element={
            <ProtectedRoute>
              <SlidingPuzzle />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/word-scramble" 
          element={
            <ProtectedRoute>
              <WordScramble />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/challenge" 
          element={
            <ProtectedRoute>
              <Challenge />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller" 
          element={
            <ProtectedRoute>
              <Seller />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </BrowserRouter>
  );
}