import React, { useMemo, useState } from "react";
import useLocalState from "../hooks/useLocalState";

const KEY = "fs.todos";
const MEMBERS = ["Jay", "Suhu", "Vaisha", "Parvathi"]; // tweak later

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TodoList() {
  const [todos, setTodos] = useLocalState(KEY, []);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | done
  const [me, setMe] = useState(MEMBERS[0]);   // who is adding

  const filtered = useMemo(() => {
    if (filter === "active") return todos.filter(t => !t.done);
    if (filter === "done") return todos.filter(t => t.done);
    return todos;
  }, [todos, filter]);

  function addTodo(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    const t = {
      id: uid(),
      title,
      done: false,
      createdAt: Date.now(),
      addedBy: me,
    };
    setTodos([t, ...todos]);
    setText("");
  }

  function toggle(id) {
    setTodos(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id) {
    setTodos(todos.filter(t => t.id !== id));
  }

  function clearDone() {
    setTodos(todos.filter(t => !t.done));
  }

  return (
    <div className="card">
      <h2 className="section-title">To-Dos</h2>
      <p className="subtle">Quick tasks for the group. Stored locally for now.</p>

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
      <form className="row" style={{ marginTop: 12 }} onSubmit={addTodo}>
        <input
          className="input"
          placeholder="Add a to-do…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn primary" disabled={!text.trim()}>
          Add
        </button>
      </form>

      {/* Filters + actions */}
      <div className="row" style={{ marginTop: 8 }}>
        <button type="button" className="btn" onClick={() => setFilter("all")} aria-pressed={filter === "all"}>All</button>
        <button type="button" className="btn" onClick={() => setFilter("active")} aria-pressed={filter === "active"}>Active</button>
        <button type="button" className="btn" onClick={() => setFilter("done")} aria-pressed={filter === "done"}>Done</button>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn" onClick={clearDone} disabled={!todos.some(t => t.done)}>Clear Completed</button>
      </div>

      {/* List */}
      <div className="list">
        {filtered.length === 0 ? (
          <div className="listitem muted">No to-dos here.</div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="listitem">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ textDecoration: t.done ? "line-through" : "none" }}>
                  {t.title}
                </div>
                <div className="subtle">Added by {t.addedBy}</div>
              </div>
              <button className="btn" onClick={() => remove(t.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
