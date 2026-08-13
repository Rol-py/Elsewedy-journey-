import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Mobile-first GPS journey guide — served over LAN/HTTPS for phone testing.
// Geolocation requires a "secure context" (HTTPS or localhost). Plain
// `npm run dev` stays on HTTP for simple desktop-browser work; run
// `npm run dev:https` instead to get an instant self-signed HTTPS
// certificate so you can open the LAN URL on a phone on the same Wi-Fi
// (see README.md for the accept-the-certificate step and alternatives
// like a tunnel or a real deploy).
const useHttps = process.env.HTTPS === 'true';

export default defineConfig({
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
  server: {
    host: true,
    port: 5173,
    https: useHttps
  },
  preview: {
    host: true,
    port: 4173
  }
});
