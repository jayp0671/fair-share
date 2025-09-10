import React, { useState } from "react";
import TabNav from "../components/TabNav";
import TodoList from "../components/TodoList";
import GroceryList from "../components/GroceryList";
import SettleUp from "../components/SettleUp";

export default function Home() {
  const [tab, setTab] = useState("todos");

  return (
    <div className="container">
      <h1 className="app-title">FairShare</h1>
      <TabNav value={tab} onChange={setTab} />

      {tab === "todos" && <TodoList />}
      {tab === "grocery" && <GroceryList />}
      {tab === "settle" && <SettleUp />}
    </div>
  );
}
