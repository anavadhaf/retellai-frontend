import { motion } from "framer-motion";
import { FiActivity } from "react-icons/fi";
import StatusIndicator from "./StatusIndicator";

function Header({ status, connected }) {
  return (
    <header className="relative z-10 flex w-full items-center justify-between gap-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-accent">
          <FiActivity className="text-lg" />
        </div>
        <div>
          <p className="font-sora text-sm font-semibold tracking-[0.18em] text-white/90 uppercase">
            Retell Voice
          </p>
          <p className="text-xs text-white/45">AI calling interface</p>
        </div>
      </motion.div>
      <StatusIndicator status={status} connected={connected} />
    </header>
  );
}

export default Header;
