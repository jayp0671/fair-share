import React from "react";

export default function TodoList() {
  return (
    <div className="card">
      <h2 className="section-title">To-Dos</h2>
      <p className="subtle">Add and track tasks. This is the scaffold only.</p>

      <div className="row" style={{ marginTop: 12 }}>
        <input className="input" placeholder="Add a to-do…" disabled />
        <button className="btn primary" disabled>Add</button>
      </div>

      <div className="list">
        <div className="listitem muted">No to-dos yet.</div>
      </div>
    </div>
  );
}
