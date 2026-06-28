import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";

/**
 * StockClash
 * ----------
 * A head-to-head "clash" visual for the bidding simulator. Two stocks collide
 * in the center; the impact point shifts toward whichever stock is winning
 * the REAL price race since the bid was placed.
 *
 * IMPORTANT (honesty): the winner is decided by ACTUAL live P&L (real price
 * movement applied to the stake), NEVER by the analysis engine's lean score.
 * The animation visualizes real data, it does not predict an outcome.
 *
 * Props:
 *   tickerA, tickerB   string symbols (e.g. "TCS.NS")
 *   chosen             which ticker the user backed (must equal A or B)
 *   stake              fake-currency amount staked
 *   fetchPnl           async () => ({ pnlA, pnlB })  // real P&L from your backend
 *                        pnlA / pnlB are rupee P&L numbers (can be +/-)
 *   pollMs             how often to refresh live P&L (default 5000)
 *   windowSeconds      bet window length; on expiry, onSettle fires (default 1800 = 30min)
 *   onSettle           ({ winner, pnlA, pnlB, edge }) => void
 */
export default function StockClash({
  tickerA,
  tickerB,
  chosen,
  stake,
  fetchPnl,
  pollMs = 5000,
  windowSeconds = 1800,
  onSettle,
}) {
  const [pnlA, setPnlA] = useState(0);
  const [pnlB, setPnlB] = useState(0);
  const [remaining, setRemaining] = useState(windowSeconds);
  const [settled, setSettled] = useState(false);
  const controlsA = useAnimationControls();
  const controlsB = useAnimationControls();
  const settledRef = useRef(false);

  // bias: -1 (B dominates) .. 0 (even) .. +1 (A dominates), from REAL P&L edge
  const edge = pnlA - pnlB;
  const maxScale = Math.max(Math.abs(pnlA), Math.abs(pnlB), stake * 0.01, 1);
  const bias = Math.max(-1, Math.min(1, edge / maxScale));

  // poll live P&L
  useEffect(() => {
    if (settled) return;
    let alive = true;
    const tick = async () => {
      try {
        const { pnlA: a, pnlB: b } = await fetchPnl();
        if (!alive) return;
        setPnlA(a);
        setPnlB(b);
        // nudge the two fighters toward the center, offset by who's winning
        controlsA.start({ x: 40 + bias * 30, transition: { duration: 0.6 } });
        controlsB.start({ x: -40 + bias * 30, transition: { duration: 0.6 } });
      } catch (e) {
        /* keep last values on a failed poll */
      }
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [settled, bias, fetchPnl, pollMs, controlsA, controlsB]);

  // countdown + settlement
  useEffect(() => {
    if (settled) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1 && !settledRef.current) {
          settledRef.current = true;
          setSettled(true);
          const winner = pnlA === pnlB ? "tie" : pnlA > pnlB ? tickerA : tickerB;
          onSettle && onSettle({ winner, pnlA, pnlB, edge: pnlA - pnlB });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [settled, pnlA, pnlB, tickerA, tickerB, onSettle]);

  const chosenAhead =
    (chosen === tickerA && edge > 0) || (chosen === tickerB && edge < 0);
  const fmt = (n) => (n >= 0 ? `+₹${n.toFixed(0)}` : `−₹${Math.abs(n).toFixed(0)}`);
  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, "0");

  return (
    <div style={styles.wrap}>
      <div style={styles.timer}>
        {settled ? "Settled" : `${mins}:${secs}`}
      </div>

      <div style={styles.arena}>
        {/* Stock A */}
        <motion.div
          animate={controlsA}
          initial={{ x: 0 }}
          style={{ ...styles.fighter, alignItems: "flex-start" }}
        >
          <div style={{ ...styles.tag, opacity: chosen === tickerA ? 1 : 0.55 }}>
            {chosen === tickerA && <span style={styles.youPick}>YOUR PICK</span>}
            <div style={styles.symbol}>{tickerA}</div>
            <div style={{ ...styles.pnl, color: pnlA >= 0 ? "#1db954" : "#e5484d" }}>
              {fmt(pnlA)}
            </div>
          </div>
        </motion.div>

        {/* Impact zone — shifts with the real edge */}
        <motion.div
          animate={{ left: `${50 + bias * 18}%` }}
          transition={{ duration: 0.6 }}
          style={styles.impact}
        >
          <motion.div
            animate={{ scale: settled ? 1 : [1, 1.18, 1] }}
            transition={{ repeat: settled ? 0 : Infinity, duration: 1.4 }}
            style={styles.spark}
          >
            VS
          </motion.div>
        </motion.div>

        {/* Stock B */}
        <motion.div
          animate={controlsB}
          initial={{ x: 0 }}
          style={{ ...styles.fighter, alignItems: "flex-end" }}
        >
          <div style={{ ...styles.tag, opacity: chosen === tickerB ? 1 : 0.55 }}>
            {chosen === tickerB && <span style={styles.youPick}>YOUR PICK</span>}
            <div style={styles.symbol}>{tickerB}</div>
            <div style={{ ...styles.pnl, color: pnlB >= 0 ? "#1db954" : "#e5484d" }}>
              {fmt(pnlB)}
            </div>
          </div>
        </motion.div>
      </div>

      {/* live edge bar */}
      <div style={styles.edgeBarTrack}>
        <motion.div
          animate={{ width: `${50 + bias * 50}%` }}
          transition={{ duration: 0.6 }}
          style={styles.edgeBarFill}
        />
      </div>

      <div style={styles.status}>
        {settled ? (
          <strong>
            {pnlA === pnlB
              ? "Dead even."
              : `${pnlA > pnlB ? tickerA : tickerB} won the race. ` +
                `Your pick ${chosenAhead ? "won" : "lost"}.`}
          </strong>
        ) : (
          <span>
            Live race — your pick ({chosen}) is{" "}
            {edge === 0 ? "even" : chosenAhead ? "ahead" : "behind"} by{" "}
            ₹{Math.abs(edge).toFixed(0)}
          </span>
        )}
      </div>

      <div style={styles.disclaimer}>
        Real market movement, fake currency. This is a simulation — not financial advice.
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    maxWidth: 560,
    margin: "0 auto",
    padding: 20,
    borderRadius: 16,
    background: "#0e1117",
    color: "#e6e8eb",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  timer: {
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 12,
  },
  arena: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: 120,
  },
  fighter: { width: "40%", display: "flex" },
  tag: { display: "flex", flexDirection: "column", gap: 4 },
  youPick: { fontSize: 10, fontWeight: 700, color: "#f5a623", letterSpacing: 1 },
  symbol: { fontSize: 20, fontWeight: 700 },
  pnl: { fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  impact: {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
  },
  spark: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    background: "radial-gradient(circle, #f5a623 0%, #e5484d 80%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 16,
    boxShadow: "0 0 24px rgba(245,166,35,0.6)",
  },
  edgeBarTrack: {
    height: 8,
    background: "#e5484d",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 18,
  },
  edgeBarFill: { height: "100%", background: "#1db954" },
  status: { textAlign: "center", marginTop: 14, fontSize: 15, minHeight: 22 },
  disclaimer: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 11,
    color: "#8b949e",
  },
};
