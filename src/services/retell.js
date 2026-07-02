import { RetellWebClient } from "retell-client-js-sdk";

class RetellService {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = new RetellWebClient();
    }

    return this.client;
  }

  async startCall(config) {
    const client = this.getClient();
    await client.startCall(config);
    await client.startAudioPlayback();
  }

  getRoom() {
    return this.client?.room;
  }

  getMicrophonePublications() {
    const room = this.getRoom();
    const publications = room?.localParticipant?.audioTrackPublications;

    if (!publications) {
      return [];
    }

    return Array.from(publications.values()).filter(
      (publication) => publication.source === "microphone"
    );
  }

  getMicrophoneState() {
    const publications = this.getMicrophonePublications();
    const trackStates = publications.map((publication) => {
      const track = publication.audioTrack ?? publication.track;
      const mediaStreamTrack = track?.mediaStreamTrack;
      const enabled = Boolean(mediaStreamTrack?.enabled);
      const muted = Boolean(track?.isMuted ?? publication.isMuted);

      return {
        id: mediaStreamTrack?.id ?? publication.trackSid ?? "unknown",
        enabled,
        muted,
        readyState: mediaStreamTrack?.readyState ?? "unknown",
      };
    });

    const hasTracks = trackStates.length > 0;
    const enabled = hasTracks && trackStates.every((track) => track.enabled && !track.muted);

    return {
      available: hasTracks,
      enabled,
      trackStates,
    };
  }

  async setMicrophoneEnabled(enabled) {
    const room = this.getRoom();

    if (!room?.localParticipant) {
      throw new Error("Microphone control unavailable because the active call is missing");
    }

    await room.localParticipant.setMicrophoneEnabled(enabled);

    return this.getMicrophoneState();
  }

  async getAudioRoutingSupport() {
    const room = this.getRoom();
    const canEnumerateDevices = Boolean(navigator.mediaDevices?.enumerateDevices);
    const audioElements = Array.from(document.querySelectorAll("audio"));
    const canSetElementSinkId = audioElements.some(
      (element) => typeof element.setSinkId === "function"
    );
    const audioContext = room?.audioContext;
    const canSetAudioContextSinkId = Boolean(
      audioContext && typeof audioContext.setSinkId === "function"
    );
    const devices = canEnumerateDevices
      ? (await navigator.mediaDevices.enumerateDevices()).filter(
          (device) => device.kind === "audiooutput"
        )
      : [];

    return {
      supported:
        Boolean(room?.switchActiveDevice) &&
        canEnumerateDevices &&
        (canSetElementSinkId || canSetAudioContextSinkId),
      canEnumerateDevices,
      canSetElementSinkId,
      canSetAudioContextSinkId,
      devices,
    };
  }

  selectAudioOutputDevice(devices, speakerOn) {
    if (!devices.length) {
      return null;
    }

    const scoreDevice = (device, patterns) => {
      const haystack = `${device.label} ${device.deviceId}`.toLowerCase();

      return patterns.reduce(
        (score, pattern, index) => (haystack.includes(pattern) ? score + patterns.length - index : score),
        0
      );
    };

    const speakerPatterns = ["speaker", "loudspeaker", "handsfree", "default"];
    const earpiecePatterns = ["earpiece", "receiver", "phone", "communications"];
    const patterns = speakerOn ? speakerPatterns : earpiecePatterns;

    const rankedDevices = devices
      .map((device) => ({
        device,
        score: scoreDevice(device, patterns),
      }))
      .sort((left, right) => right.score - left.score);

    if (!rankedDevices.length || rankedDevices[0].score === 0) {
      return null;
    }

    return rankedDevices[0].device;
  }

  async setSpeakerRoute(speakerOn) {
    const room = this.getRoom();

    if (!room?.switchActiveDevice) {
      throw new Error("Audio routing is unavailable because the active call is missing");
    }

    const support = await this.getAudioRoutingSupport();

    if (!support.supported) {
      throw new Error("Audio routing is not supported in this browser");
    }

    const targetDevice = this.selectAudioOutputDevice(support.devices, speakerOn);

    if (!targetDevice) {
      throw new Error(
        speakerOn
          ? "Audio routing could not find a loud speaker output device"
          : "Audio routing could not find an earpiece output device"
      );
    }

    await room.switchActiveDevice("audiooutput", targetDevice.deviceId, false);

    return {
      device: targetDevice,
      support,
    };
  }

  stopCall() {
    this.client?.stopCall();
  }

  async mute() {
    return this.setMicrophoneEnabled(false);
  }

  async unmute() {
    return this.setMicrophoneEnabled(true);
  }

  destroy() {
    this.client?.stopCall();
    this.client?.removeAllListeners?.();
    this.client = null;
  }

  on(eventName, handler) {
    const client = this.getClient();
    client.on(eventName, handler);

    return () => {
      client.off(eventName, handler);
    };
  }
}

const retellService = new RetellService();

export default retellService;
