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

/** Fix tiny rounding drift so splits sum to total */
function normalizeSharesToTotal(splitObjs, totalCents) {
  const sum = splitObjs.reduce((a, s) => a + s.shareCents, 0);
  let diff = totalCents - sum; // + add, - remove
  if (diff === 0) return splitObjs;

  const nonZero = splitObjs
    .map((s, idx) => ({ idx, ...s }))
    .filter((x) => x.shareCents > 0);
  const bucket = nonZero.length ? nonZero : splitObjs.map((s, idx) => ({ idx, ...s }));

  let k = 0;
  while (diff !== 0 && bucket.length > 0) {
    const b = bucket[k % bucket.length];
    if (diff > 0) {
      splitObjs[b.idx].shareCents += 1;
      diff -= 1;
    } else {
      const canTake = Math.min(1, splitObjs[b.idx].shareCents);
      if (canTake > 0) {
        splitObjs[b.idx].shareCents -= 1;
        diff += 1;
      }
    }
    k++;
  }
  return splitObjs;
}

/** Convert nets into pairwise payments (greedy minimal transfers) */
function computeSettlements(nets) {
  const creditors = [];
  const debtors = [];
  Object.entries(nets).forEach(([name, cents]) => {
    if (cents > 0) creditors.push({ name, cents });
    else if (cents < 0) debtors.push({ name, cents: -cents });
  });
  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].cents, creditors[j].cents);
    if (pay > 0) {
      transfers.push({ from: debtors[i].name, to: creditors[j].name, cents: pay });
      debtors[i].cents -= pay;
      creditors[j].cents -= pay;
    }
    if (debtors[i].cents === 0) i++;
    if (creditors[j].cents === 0) j++;
  }
  return transfers;
}

/** Build per-person paid, share(=owed), net */
function computeBalances(expenses) {
  const paid = {}, share = {}, net = {};
  MEMBERS.forEach((m) => { paid[m] = 0; share[m] = 0; net[m] = 0; });

  for (const e of expenses) {
    paid[e.payer] += e.totalCents;
    for (const s of e.splits) share[s.user] += s.shareCents;
  }
  MEMBERS.forEach((m) => {
    net[m] = paid[m] - share[m];
    if (Math.abs(net[m]) < 1) net[m] = 0; // avoid -0
  });

  const totalPaid = Object.values(paid).reduce((a, b) => a + b, 0);
  const totalShare = Object.values(share).reduce((a, b) => a + b, 0);
  return { paid, share, net, totalPaid, totalShare };
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

  const { paid, share, net, totalPaid, totalShare } = useMemo(
    () => computeBalances(expenses),
    [expenses]
  );

  const settlements = useMemo(() => computeSettlements(net), [net]);

  function handleShareChange(user, val) {
    setShares({ ...shares, [user]: val });
  }

  function splitEqually() {
    const totalCents = toCents(amount);
    if (!totalCents) return;
    const per = Math.floor(totalCents / MEMBERS.length);
    const remainder = totalCents - per * MEMBERS.length;
    const next = {};
    MEMBERS.forEach((m, idx) => {
      next[m] = toDollars(per + (idx < remainder ? 1 : 0));
    });
    setShares(next);
  }

  function addExpense(e) {
    e.preventDefault();
    const totalCents = toCents(amount);
    if (!totalCents) return;

    let splitObjs = MEMBERS.map((u) => ({
      user: u,
      shareCents: toCents(shares[u] || 0),
    }));

    // allow tiny drift, then normalize
    const sumShares = splitObjs.reduce((a, s) => a + s.shareCents, 0);
    const drift = Math.abs(totalCents - sumShares);
    if (drift > 0 && drift <= Math.max(2, MEMBERS.length)) {
      splitObjs = normalizeSharesToTotal(splitObjs, totalCents);
    }

    const finalSum = splitObjs.reduce((a, s) => a + s.shareCents, 0);
    if (finalSum !== totalCents) {
      setError(
        `Shares ($${toDollars(finalSum)}) must add up to total $${toDollars(totalCents)}`
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

  const netCheck = totalPaid - totalShare; // should be 0

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
      <form
        className="row"
        style={{ marginTop: 12, flexDirection: "column", alignItems: "stretch" }}
        onSubmit={addExpense}
      >
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
          <button
            type="button"
            className="btn"
            onClick={splitEqually}
            style={{ marginLeft: 8 }}
            title="Auto-fill equal shares"
          >
            Split equally
          </button>
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
          <strong>Per-person Summary</strong>
          <div className="subtle" style={{ marginTop: 6 }}>
            {MEMBERS.map((m) => (
              <div key={m}>
                {m}: paid ${toDollars(paid[m])}, <span title="Fair share across all splits.">share</span> ${toDollars(share[m])},{" "}
                <strong>
                  net:{" "}
                  {net[m] === 0
                    ? "even"
                    : net[m] > 0
                    ? `is owed $${toDollars(net[m])}`
                    : `owes $${toDollars(-net[m])}`}
                </strong>
              </div>
            ))}
            <div style={{ marginTop: 6, fontStyle: "italic" }}>
              Net check: {netCheck === 0 ? "OK" : `⚠ mismatch ${toDollars(netCheck)} (should be $0.00)`}
            </div>
          </div>
        </div>

        <div className="listitem" style={{ display: "block" }}>
          <strong>Settle-up Suggestions</strong>
          <div className="subtle" style={{ marginTop: 6 }}>
            {settlements.length === 0 ? (
              <div>All settled.</div>
            ) : (
              <>
                <div style={{ marginBottom: 6 }}>
                  {settlements.length} payment{settlements.length > 1 ? "s" : ""} needed to settle up:
                </div>
                {settlements.map((t, idx) => (
                  <div key={idx}>
                    {t.from} → {t.to}: ${toDollars(t.cents)}
                  </div>
                ))}
              </>
            )}
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
              <button className="btn" onClick={() => removeExpense(e.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
