# Local HTTPS

1. Install dependencies with `npm install`.
2. Start the Vite dev server with `npm run dev`.
3. Open `https://localhost:5175` on your computer, or `https://<local-ip>:5175` from another device on the same Wi-Fi.
4. Accept the self-signed certificate warning once so the page loads as a secure context.

After that, Android Chrome should treat the app as secure and `navigator.mediaDevices.getUserMedia()` should be available for the existing microphone permission flow.
