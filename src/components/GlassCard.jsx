function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`glass-panel rounded-4xl border border-white/10 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export default GlassCard;
