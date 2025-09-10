import React, { useMemo, useState } from "react";
import useLocalState from "../hooks/useLocalState";

const KEY = "fs.groceries";
const MEMBERS = ["Jay", "Suhu", "Vaisha", "Parvathi"]; // tweak later if needed

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function GroceryList() {
  const [items, setItems] = useLocalState(KEY, []);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [filter, setFilter] = useState("needed"); // needed | bought | all
  const [me, setMe] = useState(MEMBERS[0]); // who is adding

  const filtered = useMemo(() => {
    if (filter === "needed") return items.filter(i => i.status === "needed");
    if (filter === "bought") return items.filter(i => i.status === "bought");
    return items;
  }, [items, filter]);

  function addItem(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const item = {
      id: uid(),
      name: n,
      qty: qty.trim(),
      status: "needed",    // needed | bought
      addedBy: me,         // track who added
      createdAt: Date.now(),
    };
    setItems([item, ...items]);
    setName("");
    setQty("");
  }

  function markBought(id) {
    setItems(items.map(i => i.id === id ? { ...i, status: "bought" } : i));
  }
  function moveToNeeded(id) {
    setItems(items.map(i => i.id === id ? { ...i, status: "needed" } : i));
  }
  function remove(id) {
    setItems(items.filter(i => i.id !== id));
  }
  function clearBought() {
    setItems(items.filter(i => i.status !== "bought"));
  }

  return (
    <div className="card">
      <h2 className="section-title">Grocery</h2>
      <p className="subtle">Add items and mark bought. Stored locally for now.</p>

      {/* Identity switcher with radios */}
<div className="row" style={{ marginTop: 12, alignItems: "center" }}>
  <span style={{ fontSize: 14, fontWeight: 500, marginRight: 8 }}>I am:</span>
  {MEMBERS.map((m) => (
    <label key={m} style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
      <input
        type="radio"
        name="me"
        value={m}
        checked={me === m}
        onChange={(e) => setMe(e.target.value)}
        style={{ marginRight: 4 }}
      />
      {m}
    </label>
  ))}
</div>

      {/* Add form */}
      <form className="row" style={{ marginTop: 12 }} onSubmit={addItem}>
        <input
          className="input"
          placeholder="Add an item…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Qty (e.g. 2, 1lb)"
          style={{ maxWidth: 160 }}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <button className="btn primary" disabled={!name.trim()}>Add</button>
      </form>

      {/* Filters + actions */}
      <div className="row" style={{ marginTop: 8 }}>
        <button type="button" className="btn" onClick={() => setFilter("needed")} aria-pressed={filter==="needed"}>Needed</button>
        <button type="button" className="btn" onClick={() => setFilter("bought")} aria-pressed={filter==="bought"}>Bought</button>
        <button type="button" className="btn" onClick={() => setFilter("all")} aria-pressed={filter==="all"}>All</button>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn" onClick={clearBought} disabled={!items.some(i => i.status==="bought")}>Clear Bought</button>
      </div>

      {/* List */}
      <div className="list">
        {filtered.length === 0 ? (
          <div className="listitem muted">Nothing here yet.</div>
        ) : (
          filtered.map(i => (
            <div key={i.id} className="listitem">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {i.name} {i.qty ? <span className="muted">· {i.qty}</span> : null}
                </div>
                <div className="subtle">
                  {i.status === "needed" ? "Needed" : "Bought"} · Added by {i.addedBy}
                </div>
              </div>

              {i.status === "needed" ? (
                <button className="btn primary" onClick={() => markBought(i.id)}>Mark Bought</button>
              ) : (
                <button className="btn" onClick={() => moveToNeeded(i.id)}>Move to Needed</button>
              )}
              <button className="btn" onClick={() => remove(i.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
