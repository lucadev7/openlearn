import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/global.css";
import { ThemeProvider } from "./theme/ThemeProvider";
import { Layout } from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import Decks from "./pages/Decks";
import DeckDetail from "./pages/DeckDetail";
import CardEditor from "./pages/CardEditor";
import Settings from "./pages/Settings";
import StatsPage from "./pages/Stats";
import Achievements from "./pages/Achievements";
import Tutor from "./pages/Tutor";
import Material from "./pages/Material";
import Shop from "./pages/Shop";
import Exams from "./pages/Exams";
import Oral from "./pages/Oral";
import Paths from "./pages/Paths";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/study" element={<Study />} />
            <Route path="/decks" element={<Decks />} />
            <Route path="/decks/:id" element={<DeckDetail />} />
            <Route path="/decks/:deckId/cards/new" element={<CardEditor />} />
            <Route path="/cards/:id/edit" element={<CardEditor />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="/tutor" element={<Tutor />} />
            <Route path="/material" element={<Material />} />
            <Route path="/paths" element={<Paths />} />
            <Route path="/oral" element={<Oral />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/shop" element={<Shop />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
