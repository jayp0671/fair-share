import React from "react";

export default function SettleUp() {
  return (
    <div className="card">
      <h2 className="section-title">Settle Up</h2>
      <p className="subtle">Track expenses and who owes who. Scaffold only.</p>

      <div className="list" style={{ marginTop: 12 }}>
        <div className="listitem">
          <strong>Total Spent:</strong> <span className="muted">—</span>
        </div>
        <div className="listitem">
          <strong>Balances:</strong> <span className="muted">—</span>
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <input className="input" placeholder="Description" disabled />
        <input className="input" placeholder="Amount (e.g. 25.50)" disabled />
        <button className="btn primary" disabled>Add Expense</button>
      </div>

      <div className="list">
        <div className="listitem muted">No expenses yet.</div>
      </div>
    </div>
  );
}
