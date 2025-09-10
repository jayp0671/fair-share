import React, { useMemo, useState } from "react";
import useLocalState from "../hooks/useLocalState";

const KEY = "fs.expenses";
const MEMBERS = ["Jay", "Suhu", "Vaisha", "Parvathi"];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toCents(input) {
  const n = Number(String(input).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}
function toDollars(cents) {
  return (cents / 100).toFixed(2);
}

export default function SettleUp() {
  const [expenses, setExpenses] = useLocalState(KEY, []);
  const [me, setMe] = useState(MEMBERS[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shares, setShares] = useState(() =>
    Object.fromEntries(MEMBERS.map((m) => [m, ""]))
  );
  const [error, setError] = useState("");

  const totalSpentCents = useMemo(
    () => expenses.reduce((acc, e) => acc + e.totalCents, 0),
    [expenses]
  );

  const balances = useMemo(() => {
    const net = {};
    MEMBERS.forEach((m) => (net[m] = 0));
    for (const e of expenses) {
      net[e.payer] += e.totalCents;
      for (const s of e.splits) {
        net[s.user] -= s.shareCents;
      }
    }
    return net;
  }, [expenses]);

  function handleShareChange(user, val) {
    setShares({ ...shares, [user]: val });
  }

  function addExpense(e) {
    e.preventDefault();
    const totalCents = toCents(amount);
    if (!totalCents) return;

    // Build splits
    let sumShares = 0;
    const splitObjs = MEMBERS.map((u) => {
      const c = toCents(shares[u] || 0);
      sumShares += c;
      return { user: u, shareCents: c };
    });

    if (sumShares !== totalCents) {
      setError(
        `Shares ($${toDollars(sumShares)}) must add up to total $${toDollars(
          totalCents
        )}`
      );
      return;
    }

    const exp = {
      id: uid(),
      payer: me,
      totalCents,
      splits: splitObjs,
      note: note.trim(),
      date,
      createdAt: Date.now(),
    };
    setExpenses([exp, ...expenses]);
    setAmount("");
    setNote("");
    setShares(Object.fromEntries(MEMBERS.map((m) => [m, ""])));
    setError("");
  }

  function removeExpense(id) {
    setExpenses(expenses.filter((e) => e.id !== id));
  }

  return (
    <div className="card">
      <h2 className="section-title">Settle Up</h2>
      <p className="subtle">
        Log expenses, split however you want, and see who owes who. Stored locally.
      </p>

      {/* Who paid */}
      <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 500, marginRight: 8 }}>I paid:</span>
        {MEMBERS.map((m) => (
          <label key={m} style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
            <input
              type="radio"
              name="payer"
              value={m}
              checked={me === m}
              onChange={(e) => setMe(e.target.value)}
              style={{ marginRight: 4 }}
            />
            {m}
          </label>
        ))}
      </div>

      {/* Add expense */}
      <form className="row" style={{ marginTop: 12, flexDirection: "column", alignItems: "stretch" }} onSubmit={addExpense}>
        <div className="row">
          <input
            className="input"
            placeholder="Description"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <input
            className="input"
            placeholder="Amount (e.g. 25.50)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ maxWidth: 170 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Split Shares</strong>
          {MEMBERS.map((m) => (
            <div key={m} className="row" style={{ marginTop: 6 }}>
              <label style={{ minWidth: 80 }}>{m}</label>
              <input
                className="input"
                placeholder="0.00"
                value={shares[m]}
                onChange={(e) => handleShareChange(m, e.target.value)}
                style={{ maxWidth: 160 }}
              />
            </div>
          ))}
        </div>

        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

        <button className="btn primary" style={{ marginTop: 12 }}>
          Add Expense
        </button>
      </form>

      {/* Summary */}
      <div className="list" style={{ marginTop: 12 }}>
        <div className="listitem">
          <strong>Total Spent:</strong>&nbsp;${toDollars(totalSpentCents)}
        </div>
        <div className="listitem" style={{ display: "block" }}>
          <strong>Balances</strong>
          <div className="subtle" style={{ marginTop: 6 }}>
            {Object.entries(balances).map(([user, cents]) => (
              <div key={user}>
                {user}:{" "}
                {cents === 0
                  ? "even"
                  : cents > 0
                  ? `is owed $${toDollars(cents)}`
                  : `owes $${toDollars(-cents)}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense list */}
      <div className="list">
        {expenses.length === 0 ? (
          <div className="listitem muted">No expenses yet.</div>
        ) : (
          expenses.map((e) => (
            <div key={e.id} className="listitem" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {e.note || "Expense"} · ${toDollars(e.totalCents)}
                </div>
                <div className="subtle">
                  {e.date} · Paid by {e.payer} · Split:{" "}
                  {e.splits.map((s, idx) => (
                    <span key={s.user}>
                      {s.user} ${toDollars(s.shareCents)}
                      {idx < e.splits.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn" onClick={() => removeExpense(e.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
