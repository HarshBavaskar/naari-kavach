import { MotionConfig } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/anek-devanagari/wdth.css';
import '@fontsource/mukta/400.css';
import '@fontsource/mukta/500.css';
import '@fontsource/mukta/600.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { CrashGuard } from './components/CrashGuard';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" turns transform animations off when the OS asks for less motion. */}
    <MotionConfig reducedMotion="user">
      {/* If anything breaks, Call 112 and the helplines stay on screen. */}
      <CrashGuard>
        <App />
      </CrashGuard>
    </MotionConfig>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
