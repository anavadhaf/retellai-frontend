import { motion } from "framer-motion";
import { FiLoader, FiMicOff, FiPhone, FiPhoneOff } from "react-icons/fi";

function CallButton({ connecting, connected, disabled, isMuted, onClick, onMute }) {
  const label = connecting
    ? "Connecting..."
    : connected
      ? "Hang Up"
      : "Start Conversation";

  const icon = connecting ? (
    <FiLoader className="animate-spin text-2xl" />
  ) : connected ? (
    <FiPhoneOff className="text-2xl" />
  ) : (
    <FiPhone className="text-2xl" />
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        onClick={onClick}
        disabled={disabled}
        className={`flex h-20 w-20 items-center justify-center rounded-full border text-white shadow-2xl transition duration-300 sm:h-24 sm:w-24 ${
          connected
            ? "border-danger/40 bg-danger/90"
            : "border-accent/30 bg-accent/90"
        } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {icon}
      </motion.button>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {label}
      </button>
      <button
        type="button"
        onClick={onMute}
        disabled={!connected}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FiMicOff />
        {isMuted ? "Unmute Mic" : "Mute Mic"}
      </button>
    </div>
  );
}

export default CallButton;
