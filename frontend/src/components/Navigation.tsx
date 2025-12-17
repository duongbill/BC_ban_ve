import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

export function Navigation() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="modern-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <div className="logo-badge">FM</div>
          <span className="logo-text">Festival Marketplace</span>
        </Link>

        {/* Search Bar */}
        <div className="header-search">
          <svg
            className="search-icon"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Navigation Links */}
        <nav className="header-nav">
          <Link to="/create-festival" className="nav-link">
            Tạo sự kiện
          </Link>
          <Link to="/secondary-market" className="nav-link">
            Chuyển nhượng
          </Link>
          <Link to="/my-tickets" className="nav-link">
            Vé của tôi
          </Link>
          <div className="header-wallet">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              label="Kết nối ví"
              accountStatus="address"
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
