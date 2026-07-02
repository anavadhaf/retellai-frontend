import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, createWebCall } from "../services/api";
import retellService from "../services/retell";

const defaultErrorState = {
  title: "",
  message: "",
};

const initialState = {
  connected: false,
  connecting: false,
  status: "Idle",
  callId: "",
  duration: 0,
  agentSpeaking: false,
  userSpeaking: false,
  microphonePermission: "prompt",
  error: defaultErrorState,
  backendConnected: false,
  transcript: "",
  speakerOn: true,
  audioRoute: "Speaker",
};

const initialMicModalState = {
  open: false,
  mode: "required",
};

function formatErrorMessage(error) {
  const message = error?.message || "Unknown error";

  if (message.toLowerCase().includes("audio routing")) {
    return {
      title: "Audio routing unavailable",
      message,
    };
  }

  if (message.toLowerCase().includes("microphone control")) {
    return {
      title: "Microphone update failed",
      message,
    };
  }

  if (message.toLowerCase().includes("microphone")) {
    return {
      title: "Microphone access needed",
      message:
        "Please allow microphone access to start a conversation with the assistant.",
    };
  }

  if (message.toLowerCase().includes("backend")) {
    return {
      title: "Backend offline",
      message:
        `The local backend at ${API_BASE_URL} could not be reached. Make sure it is running and try again.`,
    };
  }

  if (message.toLowerCase().includes("timed out")) {
    return {
      title: "Request timed out",
      message:
        "The backend took too long to respond. Retry once the service is ready.",
    };
  }

  if (message.toLowerCase().includes("retell")) {
    return {
      title: "Retell unavailable",
      message:
        "Retell could not initialize this call. Please retry in a moment.",
    };
  }

  return {
    title: "Unknown error",
    message,
  };
}

function formatDuration(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function normalizeTranscriptEntry(entry) {
  if (typeof entry === "string") {
    return entry.trim();
  }

  if (Array.isArray(entry)) {
    return entry
      .map((item) => normalizeTranscriptEntry(item))
      .filter(Boolean)
      .join(" ");
  }

  if (entry && typeof entry === "object") {
    const role =
      typeof entry.role === "string" && entry.role.trim()
        ? `${entry.role.trim()}: `
        : "";
    const content =
      typeof entry.content === "string"
        ? entry.content
        : typeof entry.text === "string"
          ? entry.text
          : typeof entry.message === "string"
            ? entry.message
            : "";

    if (content.trim()) {
      return `${role}${content.trim()}`.trim();
    }
  }

  return "";
}

function extractTranscript(payload) {
  const candidate =
    payload?.transcript ??
    payload?.content ??
    payload?.message ??
    payload?.text ??
    "";

  return normalizeTranscriptEntry(candidate);
}

export function useRetell() {
  const [state, setState] = useState(initialState);
  const [micModalState, setMicModalState] = useState(initialMicModalState);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef(null);
  const manualHangupRef = useRef(false);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const microphonePermissionRef = useRef(initialState.microphonePermission);
  const muteDesiredRef = useRef(false);
  const muteSyncInFlightRef = useRef(false);
  const speakerDesiredRef = useRef(initialState.speakerOn);
  const speakerSyncInFlightRef = useRef(false);

  const setMicrophonePermission = useCallback((permission) => {
    microphonePermissionRef.current = permission;
    setState((current) => ({
      ...current,
      microphonePermission: permission,
    }));
  }, []);

  const setMicModal = useCallback((nextState) => {
    setMicModalState((current) => ({
      ...current,
      ...nextState,
    }));
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopMicMonitor = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    analyserRef.current = null;

    setState((current) => ({ ...current, userSpeaking: false }));
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setState((current) => ({
        ...current,
        duration: current.connected ? current.duration + 1 : current.duration,
      }));
    }, 1000);
  }, [clearTimer]);

  const startMicMonitor = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;

    const audioContext = new window.AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 512;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) {
        return;
      }

      analyserRef.current.getByteFrequencyData(data);
      const average =
        data.reduce((sum, value) => sum + value, 0) / data.length || 0;

      setState((current) => {
        const userSpeaking = average > 18;

        if (current.userSpeaking === userSpeaking) {
          return current;
        }

        if (userSpeaking) {
          console.log("USER_STARTED_SPEAKING");
        } else {
          console.log("USER_STOPPED_SPEAKING");
        }

        return {
          ...current,
          userSpeaking,
          status:
            current.agentSpeaking || !current.connected
              ? current.status
              : "Listening",
        };
      });

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }, []);

  const setError = useCallback((error) => {
    const formatted = formatErrorMessage(error);
    console.error("WebRTC error", error);

    setState((current) => ({
      ...current,
      connecting: false,
      connected: false,
      agentSpeaking: false,
      status: "Error",
      error: formatted,
    }));
  }, []);

  const showError = useCallback((error) => {
    const formatted = formatErrorMessage(error);
    console.error("WebRTC error", error);

    setState((current) => ({
      ...current,
      error: formatted,
    }));
  }, []);

  const resetCallVisualState = useCallback(
    (nextStatus = "Idle") => {
      clearTimer();
      stopMicMonitor();
      setIsMuted(false);
      muteDesiredRef.current = false;
      speakerDesiredRef.current = initialState.speakerOn;
      setState((current) => ({
        ...current,
        connected: false,
        connecting: false,
        status: nextStatus,
        duration: 0,
        agentSpeaking: false,
        userSpeaking: false,
        speakerOn: initialState.speakerOn,
        audioRoute: initialState.audioRoute,
      }));
    },
    [clearTimer, stopMicMonitor]
  );

  const logMicrophoneState = useCallback((microphoneState) => {
    console.log(
      "Current microphone track enabled/disabled state",
      microphoneState?.trackStates ?? []
    );
  }, []);

  const syncMuteState = useCallback(async () => {
    if (muteSyncInFlightRef.current || !retellService.getRoom()) {
      return;
    }

    muteSyncInFlightRef.current = true;

    try {
      while (retellService.getRoom()) {
        const targetMuted = muteDesiredRef.current;

        try {
          const microphoneState = await retellService.setMicrophoneEnabled(!targetMuted);
          const actualMuted = !microphoneState.enabled;

          setIsMuted(actualMuted);
          setState((current) => ({
            ...current,
            userSpeaking: actualMuted ? false : current.userSpeaking,
          }));

          if (actualMuted) {
            console.log("Microphone muted");
          } else {
            console.log("Microphone unmuted");
          }

          logMicrophoneState(microphoneState);
        } catch (error) {
          console.error("Mute/unmute error", error);
          const microphoneState = retellService.getMicrophoneState();
          const actualMuted = microphoneState.available
            ? !microphoneState.enabled
            : targetMuted;

          setIsMuted(actualMuted);
          muteDesiredRef.current = actualMuted;
          logMicrophoneState(microphoneState);
          showError(new Error(`Microphone control failed: ${error.message || "Unknown error"}`));
          break;
        }

        if (muteDesiredRef.current === targetMuted) {
          break;
        }
      }
    } finally {
      muteSyncInFlightRef.current = false;
    }
  }, [logMicrophoneState, showError]);

  const logAudioRoutingSupport = useCallback(async () => {
    try {
      const support = await retellService.getAudioRoutingSupport();
      console.log("Browser audio routing support", {
        supported: support.supported,
        canEnumerateDevices: support.canEnumerateDevices,
        canSetElementSinkId: support.canSetElementSinkId,
        canSetAudioContextSinkId: support.canSetAudioContextSinkId,
        devices: support.devices.map((device) => ({
          deviceId: device.deviceId,
          label: device.label,
        })),
      });
    } catch (error) {
      console.error("Audio routing failures", error);
    }
  }, []);

  const syncSpeakerState = useCallback(async () => {
    if (speakerSyncInFlightRef.current || !retellService.getRoom()) {
      return;
    }

    speakerSyncInFlightRef.current = true;

    try {
      while (retellService.getRoom()) {
        const targetSpeakerOn = speakerDesiredRef.current;

        try {
          const result = await retellService.setSpeakerRoute(targetSpeakerOn);
          const routeLabel = targetSpeakerOn ? "Speaker" : "Earpiece";

          setState((current) => ({
            ...current,
            speakerOn: targetSpeakerOn,
            audioRoute: result.device.label || routeLabel,
          }));

          if (targetSpeakerOn) {
            console.log("Speaker enabled -> Routing audio to loud speaker");
          } else {
            console.log("Speaker disabled -> Routing audio to earpiece");
          }

          console.log("Current audio output device", result.device);
        } catch (error) {
          console.error("Audio routing failures", error);
          setState((current) => ({
            ...current,
            speakerOn: !targetSpeakerOn,
            audioRoute: !targetSpeakerOn ? "Speaker" : "Earpiece",
          }));
          speakerDesiredRef.current = !targetSpeakerOn;
          showError(new Error(`Audio routing failed: ${error.message || "Unknown error"}`));
          break;
        }

        if (speakerDesiredRef.current === targetSpeakerOn) {
          break;
        }
      }
    } finally {
      speakerSyncInFlightRef.current = false;
    }
  }, [showError]);

  useEffect(() => {
    const unsubs = [
      retellService.on("call_started", () => {
        console.log("CALL_STARTED");
        console.log("Call connected");
        setState((current) => ({
          ...current,
          connected: true,
          connecting: false,
          status: "Connecting",
          error: defaultErrorState,
        }));
        const microphoneState = retellService.getMicrophoneState();
        const actualMuted = microphoneState.available
          ? !microphoneState.enabled
          : false;
        muteDesiredRef.current = actualMuted;
        setIsMuted(actualMuted);
        logMicrophoneState(microphoneState);
        void logAudioRoutingSupport();
      }),
      retellService.on("call_ready", () => {
        console.log("CONNECTION_ESTABLISHED");
        console.log("Call connected");
        startTimer();
        setState((current) => ({
          ...current,
          connected: true,
          connecting: false,
          status: current.agentSpeaking ? "Agent Speaking" : "Listening",
        }));
      }),
      retellService.on("call_ended", () => {
        console.log("CALL_ENDED");
        console.log("Call disconnected");
        manualHangupRef.current = false;
        resetCallVisualState("Disconnected");
      }),
      retellService.on("agent_start_talking", () => {
        console.log("AGENT_STARTED_SPEAKING");
        setState((current) => ({
          ...current,
          agentSpeaking: true,
          status: "Agent Speaking",
        }));
      }),
      retellService.on("agent_stop_talking", () => {
        console.log("AGENT_STOPPED_SPEAKING");
        setState((current) => ({
          ...current,
          agentSpeaking: false,
          status: current.connected ? "Listening" : current.status,
        }));
      }),
      retellService.on("update", (payload) => {
        console.log("UPDATE", payload);
        const transcript = extractTranscript(payload);

        if (!transcript) {
          return;
        }

        setState((current) => ({
          ...current,
          transcript,
        }));
      }),
      retellService.on("metadata", (payload) => {
        console.log("METADATA", payload);
      }),
      retellService.on("node_transition", (payload) => {
        console.log("NODE_TRANSITION", payload);
      }),
      retellService.on("error", (message) => {
        console.log("ERROR", message);
        resetCallVisualState("Error");
        setError(new Error(message || "Retell unavailable"));
      }),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
      clearTimer();
      stopMicMonitor();
      retellService.destroy();
    };
  }, [
    clearTimer,
    logAudioRoutingSupport,
    logMicrophoneState,
    resetCallVisualState,
    setError,
    startTimer,
    stopMicMonitor,
  ]);

  const getMicrophonePermissionState = useCallback(async () => {
    if (!navigator.permissions?.query) {
      console.log("MIC_PERMISSION_QUERY_UNAVAILABLE");
      return microphonePermissionRef.current;
    }

    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone",
      });

      console.log("MIC_PERMISSION_STATE", permissionStatus.state);
      return permissionStatus.state;
    } catch (error) {
      console.log("MIC_PERMISSION_QUERY_FAILED", error);
      return microphonePermissionRef.current;
    }
  }, []);

  const requestMicrophoneAccess = useCallback(async (modalMode = "required") => {
    if (microphonePermissionRef.current === "granted") {
      console.log("MIC_PERMISSION_ALREADY_GRANTED");
      return true;
    }

    try {
      console.log("MIC_PERMISSION_REQUEST_START");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("MIC_PERMISSION_REQUEST_GRANTED");
      console.log("Microphone permission granted");
      stream.getTracks().forEach((track) => track.stop());

      setMicModal(initialMicModalState);
      setMicrophonePermission("granted");

      return true;
    } catch (error) {
      console.log("MIC_PERMISSION_REQUEST_DENIED", error);
      console.log("Microphone permission denied");
      setMicrophonePermission("denied");
      setMicModal({
        open: true,
        mode: modalMode,
      });
      throw new Error("Microphone permission denied");
    }
  }, [setMicModal, setMicrophonePermission]);

  const ensureMicrophonePermission = useCallback(async () => {
    console.log("MIC_PERMISSION_PREFLIGHT_START");

    const permissionState = await getMicrophonePermissionState();
    setMicrophonePermission(permissionState);

    if (permissionState === "granted") {
      console.log("MIC_PERMISSION_PREFLIGHT_GRANTED");
      setMicModal(initialMicModalState);
      return true;
    }

    if (permissionState === "denied") {
      console.log("MIC_PERMISSION_PREFLIGHT_BLOCKED");
      setMicModal({
        open: true,
        mode: "blocked",
      });
      return false;
    }

    try {
      await requestMicrophoneAccess("required");
      return true;
    } catch (error) {
      console.log("MIC_PERMISSION_PREFLIGHT_FAILED", error);
      return false;
    }
  }, [getMicrophonePermissionState, requestMicrophoneAccess, setMicModal, setMicrophonePermission]);

  const startConversation = useCallback(async () => {
    manualHangupRef.current = false;
    speakerDesiredRef.current = true;
    muteDesiredRef.current = false;
    setState((current) => ({
      ...current,
      connecting: true,
      status: "Connecting",
      error: defaultErrorState,
      transcript: "",
      speakerOn: true,
      audioRoute: "Speaker",
    }));

    try {
      await requestMicrophoneAccess();
      const call = await createWebCall();

      setState((current) => ({
        ...current,
        callId: call.callId || "",
        backendConnected: true,
      }));

      await startMicMonitor();
      await retellService.startCall({
        accessToken: call.accessToken,
      });
    } catch (error) {
      stopMicMonitor();
      setError(error);
    }
  }, [requestMicrophoneAccess, setError, startMicMonitor, stopMicMonitor]);

  const retryMicrophonePermission = useCallback(async () => {
    console.log("MIC_PERMISSION_RETRY_START");

    try {
      await requestMicrophoneAccess("blocked");
      return true;
    } catch (error) {
      console.log("MIC_PERMISSION_RETRY_FAILED", error);
      setMicModal({
        open: true,
        mode: "blocked",
      });
      return false;
    }
  }, [requestMicrophoneAccess, setMicModal]);

  const stopConversation = useCallback(() => {
    manualHangupRef.current = true;
    console.log("CONNECTION_LOST");
    console.log("Call disconnected");
    retellService.stopCall();
  }, []);

  const toggleMute = useCallback(() => {
    if (!state.connected) {
      return;
    }

    const nextMuted = !muteDesiredRef.current;
    muteDesiredRef.current = nextMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      setState((current) => ({
        ...current,
        userSpeaking: false,
      }));
    }

    void syncMuteState();
  }, [state.connected, syncMuteState]);

  const toggleSpeaker = useCallback(() => {
    if (!state.connected) {
      return;
    }

    const nextSpeakerOn = !speakerDesiredRef.current;
    speakerDesiredRef.current = nextSpeakerOn;

    setState((current) => ({
      ...current,
      speakerOn: nextSpeakerOn,
      audioRoute: nextSpeakerOn ? "Speaker" : "Earpiece",
    }));

    void syncSpeakerState();
  }, [state.connected, syncSpeakerState]);

  const clearError = useCallback(() => {
    setState((current) => ({
      ...current,
      error: defaultErrorState,
      status: current.connected ? current.status : "Idle",
    }));
  }, []);

  const controls = useMemo(
    () => ({
      ensureMicrophonePermission,
      retryMicrophonePermission,
      startConversation,
      stopConversation,
      toggleMute,
      toggleSpeaker,
      clearError,
      setMicModal,
    }),
    [
      clearError,
      ensureMicrophonePermission,
      retryMicrophonePermission,
      setMicModal,
      startConversation,
      stopConversation,
      toggleMute,
      toggleSpeaker,
    ]
  );

  return {
    ...state,
    isMuted,
    durationLabel: formatDuration(state.duration),
    micModalState,
    controls,
  };
}
