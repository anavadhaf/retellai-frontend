function Footer({ backendConnected }) {
  return (
    <footer className="relative z-10 mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-white/50 sm:flex-row sm:text-left">
      <span>Powered by Retell AI</span>
      <span>{backendConnected ? "Backend Connected" : "Backend Waiting"}</span>
      <span>Version 1.0</span>
    </footer>
  );
}

export default Footer;
