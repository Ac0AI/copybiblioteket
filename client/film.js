// Explainer films are plain DOM scenes. The active chapter's progress bar is the clock:
// when its CSS animation ends the next scene starts, so pausing CSS pauses the whole film.
import { t, onLanguageChange } from './i18n.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function film(root) {
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const chapters = [...root.querySelectorAll('[data-chapter]')];
  const toggle = root.querySelector('.film-toggle');
  let index = 0, userPaused = reducedMotion.matches, offscreen = false;

  function restart(node) {node.classList.remove('is-active');void node.offsetWidth;node.classList.add('is-active');}
  function show(next) {
    index = (next + scenes.length) % scenes.length;
    scenes.forEach((scene,i) => {if (i === index) restart(scene); else scene.classList.remove('is-active');});
    chapters.forEach((chapter,i) => {
      chapter.classList.toggle('is-done',i < index);
      if (i === index) {chapter.removeAttribute('aria-current');void chapter.offsetWidth;chapter.setAttribute('aria-current','step');}
      else chapter.removeAttribute('aria-current');
    });
  }
  function update() {
    root.classList.toggle('is-paused',userPaused);
    root.classList.toggle('is-offscreen',offscreen || document.hidden);
    toggle?.setAttribute('aria-label',t(userPaused ? 'filmPlay' : 'filmPause'));
    toggle?.setAttribute('aria-pressed',String(!userPaused));
  }
  root.addEventListener('animationend',event => {
    if (event.animationName !== 'film-progress' || reducedMotion.matches) return;
    show(index + 1);
  });
  chapters.forEach((chapter,i) => chapter.addEventListener('click',() => {show(i);if (reducedMotion.matches) {userPaused = true;update();}}));
  toggle?.addEventListener('click',() => {userPaused = !userPaused;update();});
  new IntersectionObserver(([entry]) => {offscreen = !entry.isIntersecting;update();},{threshold:.25}).observe(root);
  document.addEventListener('visibilitychange',update);
  onLanguageChange(update);
  show(0);update();
  return {show};
}

export function films() {return [...document.querySelectorAll('[data-film]')].map(film);}
