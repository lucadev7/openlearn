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
import { ComingSoon } from "./pages/ComingSoon";

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
            <Route
              path="/paths"
              element={
                <ComingSoon
                  phase={4}
                  title="KI-Lernpfade"
                  desc="Aus deinem Ziel, dem Prüfungsdatum und deinen Schwächen erstellt die KI einen adaptiven Lernpfad, der sich an deinen Fortschritt anpasst."
                />
              }
            />
            <Route
              path="/oral"
              element={
                <ComingSoon
                  phase={4}
                  title="Mündliche Prüfung"
                  desc="Übe mündliche Prüfungen oder Interviews mit einem KI-Prüfer, der zu deinem Thema nachfragt und dir am Ende Feedback gibt."
                />
              }
            />
            <Route
              path="/exams"
              element={
                <ComingSoon
                  phase={6}
                  title="Tests & Prüfungen"
                  desc="Zeitgesteuerte Test-Simulationen aus deinem Fragenpool oder KI-generiert — mit Auswertung nach Thema."
                />
              }
            />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route
              path="/shop"
              element={
                <ComingSoon
                  phase={5}
                  title="Shop"
                  desc="Gib verdiente Coins für kosmetische Themes, Avatare und Card-Backs aus — rein optisch, kein Pay-to-Win."
                />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
