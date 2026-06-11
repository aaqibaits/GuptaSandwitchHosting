import React, { useState, useEffect } from "react";
import { fetchOutlets } from "../../services/dishesApi";
import "./AdminTopbar.css";

export default function Topbar({ title, selectedOutlet, onOutletChange }) {
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    fetchOutlets()
      .then((data) => setOutlets(data.map((o) => o.name)))
      .catch(() => setOutlets([]));
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <select
          className="topbar-select"
          value={selectedOutlet}
          onChange={(e) => onOutletChange(e.target.value)}
        >
          <option value="All Outlets">All Outlets</option>
          {outlets.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <div className="topbar-avatar">A</div>
      </div>
    </header>
  );
}