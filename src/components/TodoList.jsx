import React, { useMemo, useState } from "react";
import useLocalState from "../hooks/useLocalState";

const KEY = "fs.todos";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TodoList() {
  const [todos, setTodos] = useLocalState(KEY, []);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | done

  const filtered = useMemo(() => {
    if (filter === "active") return todos.filter(t => !t.done);
    if (filter === "done") return todos.filter(t => t.done);
    return todos;
  }, [todos, filter]);

  function addTodo(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    const t = { id: uid(), title, done: false, createdAt: Date.now() };
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

      <div className="row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
        >All</button>
        <button
          type="button"
          className="btn"
          onClick={() => setFilter("active")}
          aria-pressed={filter === "active"}
        >Active</button>
        <button
          type="button"
          className="btn"
          onClick={() => setFilter("done")}
          aria-pressed={filter === "done"}
        >Done</button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="btn"
          onClick={clearDone}
          disabled={!todos.some(t => t.done)}
        >Clear Completed</button>
      </div>

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
              <div style={{ flex: 1, textDecoration: t.done ? "line-through" : "none" }}>
                {t.title}
              </div>
              <button className="btn" onClick={() => remove(t.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
