import React from "react";

export default function TabNav({ value, onChange }) {
  const tabs = [
    { id: "todos", label: "To-Dos" },
    { id: "grocery", label: "Grocery" },
    { id: "settle", label: "Settle Up" },
  ];

  return (
    <div className="tabnav" role="tablist" aria-label="Sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          className="tabbtn"
          role="tab"
          aria-pressed={value === t.id}
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
