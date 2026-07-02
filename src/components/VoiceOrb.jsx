import { motion } from "framer-motion";
import { FiMic } from "react-icons/fi";

function VoiceOrb({
  connected,
  agentSpeaking,
  userSpeaking,
  connecting,
  animationsPaused = false,
}) {
  const isActive = connected || connecting;
  const statusScale = agentSpeaking ? 1.12 : userSpeaking ? 1.08 : connecting ? 1.04 : 0.98;
  const statusOpacity = agentSpeaking ? 0.95 : userSpeaking ? 0.82 : connecting ? 0.72 : 0.54;

  return (
    <div className="relative flex h-[18rem] w-[18rem] items-center justify-center sm:h-[24rem] sm:w-[24rem] lg:h-[28rem] lg:w-[28rem]">
      <motion.div
        animate={
          animationsPaused
            ? {
                scale: isActive ? 0.98 : 0.94,
                opacity: isActive ? 0.24 : 0.16,
              }
            : {
                scale: isActive ? [0.98, 1.04, 0.98] : [0.94, 0.98, 0.94],
                opacity: isActive ? [0.24, 0.42, 0.24] : [0.16, 0.24, 0.16],
              }
        }
        transition={{
          duration: agentSpeaking ? 1.6 : 3.4,
          repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(228,175,255,0.34),rgba(114,14,217,0.22)_34%,rgba(114,14,217,0.06)_60%,transparent_74%)] blur-3xl"
      />

      <motion.div
        animate={
          animationsPaused
            ? {
                rotate: 0,
                scale: 1,
              }
            : {
                rotate: 360,
                scale: [1, statusScale, 1],
              }
        }
        transition={{
          rotate: {
            duration: 18,
            repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
            ease: "linear",
          },
          scale: {
            duration: userSpeaking ? 1.8 : 3.8,
            repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
        className="absolute h-[88%] w-[88%] rounded-full border border-[#E4AFFF]/18 bg-[conic-gradient(from_90deg,rgba(114,14,217,0.1),rgba(228,175,255,0.66),rgba(114,14,217,0.12),rgba(228,175,255,0.44),rgba(114,14,217,0.1))] blur-[2px]"
      />

      <motion.div
        animate={
          animationsPaused
            ? {
                rotate: 0,
                scale: 1,
              }
            : {
                rotate: -360,
                scale: agentSpeaking ? [1, 1.05, 1] : [0.98, 1.01, 0.98],
              }
        }
        transition={{
          rotate: {
            duration: 26,
            repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
            ease: "linear",
          },
          scale: {
            duration: agentSpeaking ? 1.3 : 4.4,
            repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
        className="absolute h-[74%] w-[74%] rounded-full border border-white/10"
      >
        <div className="absolute inset-4 rounded-full border border-[#E4AFFF]/14" />
        <div className="absolute left-[14%] top-[20%] h-5 w-5 rounded-full bg-[#E4AFFF]/40 blur-md" />
        <div className="absolute bottom-[16%] right-[18%] h-10 w-10 rounded-full bg-[#720ED9]/25 blur-xl" />
      </motion.div>

      <motion.div
        animate={
          animationsPaused
            ? {
                scale: isActive ? 1 : 0.97,
                boxShadow: `0 0 40px rgba(114,14,217,${statusOpacity * 0.3})`,
              }
            : {
                scale: isActive ? [1, 1.03, 1] : [0.97, 1, 0.97],
                boxShadow: [
                  "0 0 40px rgba(114,14,217,0.14)",
                  `0 0 110px rgba(228,175,255,${statusOpacity})`,
                  "0 0 40px rgba(114,14,217,0.14)",
                ],
              }
        }
        transition={{
          duration: agentSpeaking ? 1.5 : userSpeaking ? 2 : 4,
          repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="relative flex h-[58%] w-[58%] items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.92),rgba(233,214,255,0.72)_10%,rgba(228,175,255,0.28)_24%,rgba(114,14,217,0.38)_54%,rgba(10,10,16,0.98)_100%)]"
      >
        <div className="absolute inset-[10px] rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.22),rgba(228,175,255,0.14)_28%,rgba(114,14,217,0.12)_58%,rgba(6,6,10,0.92)_100%)]" />
        <motion.div
          animate={
            animationsPaused
              ? {
                  scale: agentSpeaking ? 0.92 : 0.94,
                  opacity: isActive ? 0.52 : 0.36,
                }
              : {
                  scale: agentSpeaking ? [0.92, 1.1, 0.92] : [0.94, 1.02, 0.94],
                  opacity: isActive ? [0.52, 0.9, 0.52] : [0.36, 0.54, 0.36],
                }
          }
          transition={{
            duration: agentSpeaking ? 1.2 : 3.2,
            repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgba(228,175,255,0.85),rgba(228,175,255,0.14)_34%,transparent_70%)] blur-lg"
        />
        <motion.div
          animate={
            animationsPaused
              ? {
                  y: 0,
                  scale: connecting ? 0.95 : 0.98,
                }
              : {
                  y: userSpeaking ? [0, -4, 0] : [0, -2, 0],
                  scale: connecting ? [0.95, 1, 0.95] : [0.98, 1.02, 0.98],
                }
          }
          transition={{
            duration: userSpeaking ? 0.9 : 2.6,
            repeat: animationsPaused ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl text-white/80 backdrop-blur-md sm:h-24 sm:w-24"
        >
          <FiMic />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default VoiceOrb;
