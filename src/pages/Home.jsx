import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAlertCircle,
  FiDownload,
  FiMicOff,
  FiPhoneCall,
  FiPhoneOff,
  FiRadio,
  FiRefreshCw,
  FiSliders,
  // FiVolume2,
  // FiVolumeX,
  FiX,
} from "react-icons/fi";
import VoiceOrb from "../components/VoiceOrb";
import { useRetell } from "../hooks/useRetell";
import { usePwa } from "../hooks/usePwa";

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: `${6 + (index % 6) * 16}%`,
  y: `${56 + Math.floor(index / 6) * 12}%`,
  size: 4 + (index % 3) * 3,
  color: index % 2 === 0 ? "rgba(228,175,255,0.42)" : "rgba(114,14,217,0.35)",
  driftX: index % 2 === 0 ? 16 : -14,
  driftY: index % 3 === 0 ? -12 : 10,
}));

function FloatingParticles({ interactive = false, mouse, paused = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => {
        const particleX = parseFloat(particle.x);
        const particleY = parseFloat(particle.y);
        const approxX = (particleX / 100) * 1440;
        const approxY = (particleY / 100) * 900;
        const dx = approxX - mouse.x;
        const dy = approxY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const influence = interactive ? Math.max(0, 180 - distance) / 12 : 0;
        const offsetX = influence ? (dx / distance) * influence : 0;
        const offsetY = influence ? (dy / distance) * influence : 0;

        return (
          <motion.span
            key={particle.id}
            animate={
              paused
                ? {
                    x: offsetX,
                    y: offsetY,
                    opacity: 0.2,
                    scale: 1,
                  }
                : {
                    x: [offsetX, particle.driftX + offsetX, offsetX],
                    y: [offsetY, particle.driftY + offsetY, offsetY],
                    opacity: [0.16, 0.72, 0.16],
                    scale: [1, 1.16, 1],
                  }
            }
            transition={{
              duration: 7 + (particle.id % 4) * 1.4,
              repeat: paused ? 0 : Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              boxShadow: `0 0 18px ${particle.color}`,
            }}
            className="absolute rounded-full"
          />
        );
      })}
    </div>
  );
}

function WaveField({ paused = false }) {
  const wavePaths = [
    "M-40 170 C 80 120, 160 220, 280 170 S 480 110, 620 170 S 860 240, 1040 170 S 1280 100, 1480 170 S 1700 240, 1880 170",
    "M-30 205 C 90 160, 200 255, 340 205 S 560 145, 720 205 S 980 275, 1160 205 S 1420 135, 1640 205 S 1840 255, 1980 205",
    "M-60 250 C 80 210, 220 310, 400 250 S 700 180, 920 250 S 1240 320, 1460 250 S 1760 175, 1980 250",
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[38vh] min-h-[18rem] overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-full bg-[linear-gradient(180deg,transparent_0%,rgba(3,3,6,0.12)_28%,rgba(3,3,6,0.72)_100%)]" />
      <motion.svg
        viewBox="0 0 1600 360"
        preserveAspectRatio="none"
        animate={paused ? { x: "0%" } : { x: ["0%", "-8%", "0%"] }}
        transition={{
          duration: 18,
          repeat: paused ? 0 : Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute inset-x-[-8%] bottom-[-2%] h-full w-[116%] opacity-95"
      >
        <defs>
          <linearGradient id="wave-stroke" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(114,14,217,0.05)" />
            <stop offset="45%" stopColor="rgba(114,14,217,0.7)" />
            <stop offset="100%" stopColor="rgba(228,175,255,0.25)" />
          </linearGradient>
          <linearGradient id="wave-fill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(114,14,217,0.18)" />
            <stop offset="100%" stopColor="rgba(114,14,217,0)" />
          </linearGradient>
          <filter id="wave-blur">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        {wavePaths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#wave-stroke)"
            strokeWidth={index === 1 ? 1.6 : 1}
            filter="url(#wave-blur)"
            initial={false}
            animate={
              paused
                ? {
                    translateY: 0,
                    opacity: 0.45,
                  }
                : {
                    translateY: [0, index % 2 === 0 ? -10 : 8, 0],
                    opacity: [0.35, 0.9, 0.35],
                  }
            }
            transition={{
              duration: 7 + index * 1.6,
              repeat: paused ? 0 : Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
        <path
          d="M0 220 C 180 140, 340 280, 540 220 S 900 150, 1180 220 S 1460 300, 1600 240 L1600 360 L0 360 Z"
          fill="url(#wave-fill)"
          opacity="0.35"
        />
      </motion.svg>
    </div>
  );
}

function StatusChip({ icon, label, accent = false }) {
  const Icon = icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] ${
        accent
          ? "border-[#E4AFFF]/20 bg-[#E4AFFF]/10 text-[#f2ddff]"
          : "border-white/10 bg-white/[0.04] text-white/60"
      }`}
    >
      {Icon ? <Icon className="text-[0.9rem]" /> : null}
      <span>{label}</span>
    </div>
  );
}

function ControlButton({
  label,
  icon,
  active = false,
  disabled = false,
  onClick,
  accent = false,
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -3, scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-14 w-14 items-center justify-center rounded-full border text-lg transition duration-300 sm:h-16 sm:w-16 ${
        accent
          ? "border-[#E4AFFF]/35 bg-[linear-gradient(135deg,#720ED9_0%,#E4AFFF_100%)] text-white shadow-[0_0_40px_rgba(228,175,255,0.28)]"
          : active
            ? "border-[#E4AFFF]/30 bg-[#E4AFFF]/12 text-white shadow-[0_0_30px_rgba(228,175,255,0.16)]"
            : "border-white/10 bg-white/[0.05] text-white/72"
      } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
    >
      {icon}
    </motion.button>
  );
}

function Home() {
  const state = useRetell();
  const pwa = usePwa();
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });

  const isCallActive = state.connected || state.connecting;

  const presenceLabel = useMemo(() => {
    if (state.agentSpeaking) {
      return "Speaking";
    }

    if (state.userSpeaking) {
      return "Listening";
    }

    if (state.connecting) {
      return "Connecting";
    }

    if (state.isMuted) {
      return "Muted";
    }

    return "Ready";
  }, [state.agentSpeaking, state.connecting, state.isMuted, state.userSpeaking]);

  const subLabel = useMemo(() => {
    if (state.agentSpeaking) {
      return "Aufi is responding in real time";
    }

    if (state.userSpeaking) {
      return "Aufi is tuned in and listening";
    }

    if (state.connecting) {
      return "Starting your voice session";
    }

    return "Ready whenever you are";
  }, [state.agentSpeaking, state.connecting, state.userSpeaking]);

  const connectionLabel = state.connected ? "Connected" : state.connecting ? "Connecting" : "Offline";

  const handlePrimaryAction = async () => {
    if (state.connected || state.connecting) {
      state.controls.stopConversation();
      return;
    }

    const permissionGranted = await state.controls.ensureMicrophonePermission();

    if (!permissionGranted) {
      console.log("START_CONVERSATION_ABORTED_MIC_PERMISSION");
      return;
    }

    state.controls.startConversation();
  };

  const handleMicModalPrimaryAction = async () => {
    const permissionGranted = await state.controls.retryMicrophonePermission();

    if (!permissionGranted) {
      return;
    }

    await state.controls.startConversation();
  };

  return (
    <main
      className="app-shell relative min-h-screen overflow-hidden bg-[#050505] px-4 py-4 text-white sm:px-6 lg:px-8"
      data-app-hidden={pwa.animationsPaused}
      onMouseMove={(event) => {
        if (isCallActive) {
          return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        setMouse({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
      }}
      onMouseLeave={() => setMouse({ x: -9999, y: -9999 })}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(126,44,223,0.24),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(228,175,255,0.11),transparent_18%),linear-gradient(180deg,#050505_0%,#030305_50%,#020202_100%)]" />
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(228,175,255,0.18),rgba(114,14,217,0.14)_35%,transparent_72%)] blur-3xl transition-opacity duration-300"
        style={{
          left: `${mouse.x}px`,
          top: `${mouse.y}px`,
          width: "24rem",
          height: "24rem",
          opacity: isCallActive ? 0 : mouse.x < 0 ? 0 : 1,
        }}
      />
      <FloatingParticles interactive={!isCallActive} mouse={mouse} paused={pwa.animationsPaused} />
      <WaveField paused={pwa.animationsPaused} />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <div className="pointer-events-none fixed inset-x-4 top-4 z-30 mx-auto flex max-w-xl justify-center">
          <div className="pointer-events-auto flex w-full flex-col gap-3">
            {pwa.updateAvailable ? (
              <button
                type="button"
                onClick={pwa.applyUpdate}
                className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-[rgba(12,12,16,0.82)] px-4 py-3 text-sm font-medium text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <FiRefreshCw />
                Update Aufi
              </button>
            ) : null}
            {!pwa.isOnline ? (
              <div className="self-center rounded-full border border-white/10 bg-[rgba(12,12,16,0.82)] px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/70 backdrop-blur-xl">
                Offline Mode
              </div>
            ) : null}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isCallActive ? (
            <motion.section
              key="active-call"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -22 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-1 flex-col"
            >
              <div className="flex items-center justify-center pt-3 sm:pt-5">
                <StatusChip label={state.durationLabel} />
              </div>

              <div className="flex flex-1 flex-col items-center justify-center pb-28 pt-8 sm:pb-36 sm:pt-6">
                <div className="flex max-w-3xl flex-col items-center text-center">
                  <div className="sr-only">
                    <StatusChip
                      icon={FiRadio}
                      label={connectionLabel}
                      accent={state.connected || state.connecting}
                    />
                  </div>

                  <VoiceOrb
                    connected={state.connected}
                    connecting={state.connecting}
                    agentSpeaking={state.agentSpeaking}
                    userSpeaking={state.userSpeaking}
                    animationsPaused={pwa.animationsPaused}
                  />

                  <motion.p
                    key={presenceLabel}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-6 font-display text-[2rem] tracking-[-0.05em] text-white sm:mt-8 sm:text-[3rem]"
                  >
                    {presenceLabel}
                  </motion.p>
                  <p className="mt-3 max-w-md text-sm leading-7 text-white/58 sm:text-base">
                    {subLabel}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <StatusChip label={state.status} accent />
                    {/* {state.isMuted ? <StatusChip label="Microphone Muted" /> : null} */}
                  </div>

                  <div className="sr-only" aria-live="polite">
                    {state.transcript || "Transcript pending"}
                  </div>
                </div>
              </div>

              <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 18 }}
                  className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(12,12,16,0.78)] px-3 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <ControlButton
                    label={state.isMuted ? "Unmute microphone" : "Mute microphone"}
                    icon={<FiMicOff />}
                    active={state.isMuted}
                    disabled={!state.connected}
                    onClick={state.controls.toggleMute}
                  />
                  {/* <ControlButton
                    label={state.speakerOn ? "Speaker on" : "Speaker off"}
                    icon={state.speakerOn ? <FiVolume2 /> : <FiVolumeX />}
                    active={state.speakerOn}
                    disabled={!state.connected}
                    onClick={state.controls.toggleSpeaker}
                  /> */}
                  <ControlButton
                    label="Settings"
                    icon={<FiSliders />}
                    disabled
                  />
                  <ControlButton
                    label="End call"
                    icon={state.connecting ? <FiPhoneCall /> : <FiPhoneOff />}
                    accent
                    onClick={handlePrimaryAction}
                  />
                </motion.div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-1 flex-col justify-center"
            >
              <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-14 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
                  <div className="mt-6 space-y-4">
                    <p className="font-display text-[3.4rem] leading-[0.95] tracking-[-0.08em] text-white sm:text-[5rem] lg:text-[6rem]">
                      Aufi
                    </p>
                    <p className="mx-auto max-w-xl text-sm leading-7 text-white/62 sm:text-base sm:leading-8">
                     Skip the search. Just ask. Get fast, reliable HR support whenever you need it.   
                    </p>
                  </div>

                  <div className="sr-only mt-7 flex flex-wrap items-center justify-center gap-3">
                    <StatusChip
                      label={
                        state.microphonePermission === "granted"
                          ? "Mic Ready"
                          : state.microphonePermission === "denied"
                            ? "Mic Blocked"
                            : "Mic Permission Pending"
                      }
                    />
                    <StatusChip
                      label={state.backendConnected ? "Backend Connected" : "Backend Waiting"}
                    />
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrimaryAction}
                    disabled={state.connecting}
                    className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#E4AFFF]/30 bg-[linear-gradient(135deg,#720ED9_0%,#E4AFFF_100%)] px-7 py-4 text-sm font-semibold text-white shadow-[0_0_50px_rgba(228,175,255,0.24)] transition hover:shadow-[0_0_70px_rgba(228,175,255,0.34)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-8 sm:text-base"
                  >
                    <FiPhoneCall className="text-lg" />
                    Begin Conversation
                  </motion.button>
                </div>

                <div className="relative flex w-full max-w-sm items-center justify-center lg:hidden">
                  <VoiceOrb
                    connected={false}
                    connecting={false}
                    agentSpeaking={false}
                    userSpeaking={false}
                    animationsPaused={pwa.animationsPaused}
                  />
                </div>

                {pwa.installSupported || pwa.isStandalone || pwa.offlineReady ? (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {pwa.installSupported ? (
                      <button
                        type="button"
                        onClick={pwa.promptInstall}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white/82 transition hover:bg-white/[0.08]"
                      >
                        <FiDownload />
                        Install Aufi
                      </button>
                    ) : null}
                    {pwa.isStandalone ? (
                      <StatusChip label="Installed PWA" />
                    ) : null}
                    {pwa.offlineReady ? (
                      <StatusChip label="Offline Ready" />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {state.error.message ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-4 top-4 z-40 mx-auto w-full max-w-xl"
          >
            <div className="rounded-[1.8rem] border border-red-400/20 bg-[rgba(22,8,24,0.92)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-300">
                  <FiAlertCircle className="text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-white">
                    {state.error.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/70">
                    {state.error.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={state.controls.clearError}
                  className="rounded-full border border-white/10 p-2 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <FiX />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {state.micModalState.open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(19,11,28,0.98),rgba(4,4,6,1))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#E4AFFF]">
                <FiMicOff className="text-xl" />
              </div>
              <p className="font-display text-2xl text-white">
                {state.micModalState.mode === "blocked"
                  ? "Microphone Permission Blocked"
                  : "Microphone Access Required"}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/68">
                {state.micModalState.mode === "blocked"
                  ? "Microphone access has been blocked for this website."
                  : "Aufi needs microphone access so you can start a voice conversation."}
              </p>
              {state.micModalState.mode === "blocked" ? (
                <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/72">
                  <p className="font-medium text-white">To continue:</p>
                  <p className="mt-2">Chrome</p>
                  <p>&rarr; Tap the lock icon beside the address bar</p>
                  <p>&rarr; Permissions</p>
                  <p>&rarr; Microphone</p>
                  <p>&rarr; Allow</p>
                </div>
              ) : null}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => state.controls.setMicModal({ open: false })}
                  className="flex-1 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/78 transition hover:bg-white/[0.06]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleMicModalPrimaryAction}
                  className="flex-1 rounded-full bg-[linear-gradient(135deg,#720ED9_0%,#E4AFFF_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {state.micModalState.mode === "blocked" ? "Try Again" : "Grant Permission"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

export default Home;
