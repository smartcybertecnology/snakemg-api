// api/index.js — Backend seguro SnakeMG (Vercel)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

// ─── Firebase Admin ───────────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    databaseAuthVariableOverride: null,
  });
}
const db = getDatabase();

// ─── Express ──────────────────────────────────────────────────────────────────
const app = express();

// CORS — libera origem + trata preflight OPTIONS
const corsOptions = {
  origin: [
    "https://playjogosgratis.com",
    "https://www.playjogosgratis.com",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // responde preflight em todas as rotas

app.use(express.json());

// ─── Rotas ────────────────────────────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({ status: "SnakeMG API online" });
});

// POST /score — salva pontuacao
app.post("/score", async (req, res) => {
  try {
    const { player, points } = req.body;

    if (
      !player ||
      typeof player !== "string" ||
      player.trim().length === 0 ||
      player.trim().length > 20
    ) {
      return res.status(400).json({ error: "Nome do jogador invalido (1-20 caracteres)." });
    }

    if (
      points === undefined ||
      points === null ||
      typeof points !== "number" ||
      !Number.isFinite(points) ||
      points < 0 ||
      points > 1000000
    ) {
      return res.status(400).json({ error: "Pontuacao invalida (numero entre 0 e 1.000.000)." });
    }

    const sanitizedPlayer = player.trim();
    // Remove caracteres invalidos para chave Firebase
    const firebaseKey = sanitizedPlayer.replace(/[.#$[\]]/g, "_");
    const ref = db.ref("ranking").child(firebaseKey);

    // Salva apenas se for recorde
    const snapshot = await ref.once("value");
    const existing = snapshot.val();

    if (!existing || points > existing.points) {
      await ref.set({
        player: sanitizedPlayer,
        points: Math.floor(points),
        updatedAt: Date.now(),
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erro em POST /score:", err);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// GET /ranking — retorna top 10
app.get("/ranking", async (req, res) => {
  try {
    const snapshot = await db
      .ref("ranking")
      .orderByChild("points")
      .limitToLast(10)
      .once("value");

    const ranking = [];
    snapshot.forEach((child) => ranking.push(child.val()));
    ranking.sort((a, b) => b.points - a.points);

    return res.status(200).json({ ranking });
  } catch (err) {
    console.error("Erro em GET /ranking:", err);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

module.exports = app;
