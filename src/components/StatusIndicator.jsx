import { motion } from "framer-motion";

const statusTone = {
  Idle: "bg-white/45",
  Connecting: "bg-amber-300",
  Listening: "bg-accent",
  "Agent Speaking": "bg-sky-300",
  Disconnected: "bg-white/30",
  Error: "bg-danger",
};

function StatusIndicator({ status, connected }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90">
      <motion.span
        animate={{
          scale: connected ? [1, 1.18, 1] : 1,
          opacity: connected ? [0.6, 1, 0.6] : 0.6,
        }}
        transition={{
          duration: 1.8,
          repeat: connected ? Number.POSITIVE_INFINITY : 0,
          ease: "easeInOut",
        }}
        className={`h-2.5 w-2.5 rounded-full ${statusTone[status] || "bg-white/45"}`}
      />
      <span>{status}</span>
    </div>
  );
}

export default StatusIndicator;
