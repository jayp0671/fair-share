import React from "react";

export default function GroceryList() {
  return (
    <div className="card">
      <h2 className="section-title">Grocery</h2>
      <p className="subtle">Add items, claim them, mark bought. Scaffold only.</p>

      <div className="row" style={{ marginTop: 12 }}>
        <input className="input" placeholder="Add an item…" disabled />
        <input className="input" placeholder="Qty…" style={{ maxWidth: 160 }} disabled />
        <button className="btn primary" disabled>Add</button>
      </div>

      <div className="list">
        <div className="listitem muted">No items yet.</div>
      </div>
    </div>
  );
}
