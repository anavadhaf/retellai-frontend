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

  stopCall() {
    this.client?.stopCall();
  }

  mute() {
    this.client?.mute();
  }

  unmute() {
    this.client?.unmute();
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
