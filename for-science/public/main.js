import { App } from './src/ui/app.js';

const app = new App();
app.init().catch((error) => {
  console.error(error);
  const status = document.querySelector('#status');
  status.classList.add('error');
  status.textContent = app.t('status.startError');
  document.querySelector('.frame')?.setAttribute('aria-busy', 'false');
});
