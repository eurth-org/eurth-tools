// Runs in the browser, on every page. Nothing here knows about any tool: the door it swings is
// whichever one the build marked as today's.
import { calm, toast } from '@eurth/style';
import yurt from '@eurth/style/assets/eurth-yurt-circle.svg?url';
import { TOASTS } from '../content/copy.js';
import { DELIGHT_MS, isShortcut, isTyping, shouldSwing, wordListener } from '../hub/delight.js';

// Signature touch: today's door swings on its hinge, once, the first time it is on screen.
const door = document.querySelector<HTMLElement>('[data-today]');
if (door && typeof IntersectionObserver !== 'undefined') {
  let swung = false;
  const watcher = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      watcher.disconnect();
      const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const swing = shouldSwing({
        navigation: navigation?.type ?? 'navigate',
        referrer: document.referrer,
        origin: location.origin,
        calendarPaths: ['/', '/advent/'],
        reducedMotion: calm(),
        swung,
      });
      if (!swing) return;
      swung = true;
      door.classList.add('door--swinging');
      setTimeout(() => door.classList.remove('door--swinging'), DELIGHT_MS + 50);
    },
    { threshold: 0.6 },
  );
  watcher.observe(door);
}

// Easter egg: type "yurt" anywhere (but not into a field) and a little yurt is pitched.
const heard = wordListener('yurt');
addEventListener('keydown', (event) => {
  if (isShortcut(event) || isTyping(event.target as HTMLElement | null)) return;
  if (!heard(event.key)) return;
  document.querySelector('.egg-yurt')?.remove();
  const tent = document.createElement('div');
  tent.className = 'egg-yurt';
  tent.setAttribute('aria-hidden', 'true');
  const picture = document.createElement('img');
  picture.src = yurt;
  picture.alt = '';
  tent.append(picture);
  if (!calm()) for (let i = 0; i < 4; i++) tent.append(document.createElement('i'));
  document.body.append(tent);
  toast(TOASTS.yurt);
  setTimeout(() => tent.remove(), 3200);
});
