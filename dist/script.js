(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.getElementById('motion-toggle');
  const soundButton = document.getElementById('sound-toggle');
  const monitorButton = document.getElementById('monitor-toggle');
  const replayButton = document.getElementById('replay-boot');
  const dialog = document.getElementById('boot-dialog');
  const bootForm = document.getElementById('boot-form');
  const bootInput = document.getElementById('boot-input');
  const bootLog = document.getElementById('boot-log');
  const runButton = document.getElementById('run-boot');
  const shell = document.getElementById('shell');
  const shellForm = document.getElementById('shell-form');
  const shellInput = document.getElementById('shell-input');
  const shellOutput = document.getElementById('shell-output');
  const INTRO_KEY = 'michal-workbench-v3-intro';
  const COMMAND = 'LOAD "MICHAL",8,1';
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  let manuallyPaused = false;
  let soundOn = false;
  let audioContext;
  let bootEpoch = 0;
  let typingEpoch = 0;
  let autoTyping = false;
  let loading = false;
  const commandHistory = [];
  let historyIndex = 0;
  let historyDraft = '';
  let launchingControl = null;
  function motionOff() { return reduced.matches || manuallyPaused; }
  function readSession(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
  function writeSession(key, value) { try { sessionStorage.setItem(key, value); } catch { /* Preferences remain optional. */ } }

  function tone(frequency, duration = .065, offset = 0) {
    if (!soundOn) return;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      const start = audioContext.currentTime + offset;
      oscillator.type = 'square';
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(.014, start);
      volume.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
      oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
    } catch { /* Sound is a voluntary extra; the page still works without it. */ }
  }
  function toggleSound() {
    soundOn = !soundOn;
    soundButton.textContent = soundOn ? 'Sound: on' : 'Sound: off';
    soundButton.setAttribute('aria-pressed', String(soundOn));
    if (soundOn) tone(523, .1);
  }
  const screens = ['colour', 'green', 'amber'];
  const savedScreen = readSession('michal-workbench-screen');
  let screenIndex = Math.max(0, screens.indexOf(savedScreen));
  function setScreen() {
    root.dataset.monitor = screens[screenIndex];
    monitorButton.textContent = 'Screen: ' + screens[screenIndex];
  }
  function cycleScreen() {
    screenIndex = (screenIndex + 1) % screens.length;
    setScreen();
    writeSession('michal-workbench-screen', screens[screenIndex]);
    tone(420);
  }
  function setMotion() {
    root.classList.toggle('motion-paused', motionOff());
    motionButton.setAttribute('aria-pressed', String(motionOff()));
    motionButton.disabled = reduced.matches;
    motionButton.textContent = reduced.matches ? 'Motion: reduced' : manuallyPaused ? 'Resume motion' : 'Pause motion';
    if (motionOff() && autoTyping) {
      stopTyping();
      bootInput.value = COMMAND;
    }
    if (motionOff() && loading) closeBoot(true);
  }
  motionButton.addEventListener('click', () => { manuallyPaused = !manuallyPaused; setMotion(); });
  reduced.addEventListener('change', setMotion);
  soundButton.addEventListener('click', toggleSound);
  monitorButton.addEventListener('click', cycleScreen);
  [motionButton, soundButton, monitorButton].forEach(button => { button.hidden = false; });
  setScreen();
  setMotion();

  function stopTyping() {
    typingEpoch += 1;
    autoTyping = false;
    bootForm.classList.remove('is-typing');
  }
  async function typeCommand() {
    const ownEpoch = ++typingEpoch;
    autoTyping = true;
    bootForm.classList.add('is-typing');
    bootInput.value = '';
    bootForm.style.setProperty('--command-length', 0);
    await wait(400);
    for (const character of COMMAND) {
      if (ownEpoch !== typingEpoch || !dialog.open || loading) return;
      bootInput.value += character;
      bootForm.style.setProperty('--command-length', bootInput.value.length);
      await wait(65);
    }
    if (ownEpoch === typingEpoch) stopTyping();
  }
  function closeBoot(goHome = true) {
    stopTyping();
    bootEpoch += 1;
    loading = false;
    runButton.disabled = false;
    bootInput.readOnly = false;
    bootLog.setAttribute('aria-busy', 'false');
    dialog.classList.remove('loading');
    if (dialog.open) dialog.close();
    document.body.classList.remove('boot-open');
    writeSession(INTRO_KEY, 'seen');
    if (goHome) goToSection('top', false);
    else launchingControl?.focus({ preventScroll: true });
  }
  function openBoot() {
    if (typeof dialog.showModal !== 'function') return;
    stopTyping();
    bootEpoch += 1;
    loading = false;
    runButton.disabled = false;
    bootInput.readOnly = false;
    bootInput.value = '';
    bootLog.textContent = 'READY.';
    bootLog.setAttribute('aria-busy', 'false');
    dialog.classList.remove('loading');
    launchingControl = document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('boot-open');
    if (window.matchMedia('(pointer: coarse)').matches) runButton.focus({ preventScroll: true });
    else bootInput.focus({ preventScroll: true });
    if (motionOff()) bootInput.value = COMMAND;
    else typeCommand();
  }
  async function loadSite() {
    if (loading) return;
    stopTyping();
    const ownEpoch = ++bootEpoch;
    if (motionOff()) { closeBoot(true); return; }
    loading = true;
    runButton.disabled = true;
    bootInput.readOnly = true;
    bootInput.value = COMMAND;
    bootLog.setAttribute('aria-busy', 'true');
    bootLog.textContent = 'READY.\n\nSEARCHING FOR MICHAL';
    dialog.classList.add('loading');
    tone(220, .12);
    await wait(650);
    if (ownEpoch !== bootEpoch || !dialog.open) return;
    bootLog.textContent += '\nLOADING';
    tone(330, .1);
    await wait(850);
    if (ownEpoch !== bootEpoch || !dialog.open) return;
    bootLog.textContent += '\nREADY.\nRUN';
    bootLog.setAttribute('aria-busy', 'false');
    tone(523, .1); tone(784, .16, .12);
    await wait(450);
    if (ownEpoch === bootEpoch && dialog.open) closeBoot(true);
  }
  function submitBoot(event) {
    event?.preventDefault();
    if (loading) return;
    stopTyping();
    const action = window.MichalRetro.parseCommand(bootInput.value || 'RUN');
    if (action.type === 'boot') { loadSite(); return; }
    if (action.type === 'navigate') {
      closeBoot(false);
      goToSection(action.target);
      return;
    }
    if (action.type === 'clear') bootLog.textContent = 'READY.';
    else if (action.type === 'sound') { toggleSound(); bootLog.textContent = soundOn ? 'SOUND ON.\nREADY.' : 'SOUND OFF.\nREADY.'; }
    else if (action.type === 'monitor') { cycleScreen(); bootLog.textContent = 'READY.'; }
    else if (action.type === 'text') bootLog.textContent = action.lines.join('\n');
    else bootLog.textContent = '?SYNTAX ERROR\nREADY.';
    bootInput.value = '';
    bootInput.focus({ preventScroll: true });
  }
  bootForm.addEventListener('submit', submitBoot);
  bootInput.addEventListener('keydown', event => {
    if (loading) return;
    if (event.key === 'Enter' && autoTyping) {
      event.preventDefault();
      loadSite();
    } else if (event.key.length === 1 || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      stopTyping();
      tone(360, .025);
    }
  });
  bootInput.addEventListener('beforeinput', () => { if (autoTyping) stopTyping(); });
  runButton.addEventListener('click', loadSite);
  document.getElementById('skip-boot').addEventListener('click', () => closeBoot(true));
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeBoot(false); });
  replayButton.addEventListener('click', openBoot);
  if (typeof dialog.showModal === 'function') replayButton.hidden = false;

  function setWindowOpen(section, expanded) {
    const button = section?.querySelector('.shade-button');
    if (!button) return;
    const content = document.getElementById(button.getAttribute('aria-controls'));
    if (!content) return;
    content.hidden = !expanded;
    section.classList.toggle('is-shaded', !expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? '−' : '+';
    const name = section.querySelector('.titlebar h2')?.textContent || 'section';
    button.setAttribute('aria-label', (expanded ? 'Collapse ' : 'Expand ') + name);
  }
  document.querySelectorAll('.shade-button').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      setWindowOpen(button.closest('.window'), button.getAttribute('aria-expanded') !== 'true');
      tone(480, .04);
    });
  });
  function goToSection(id, updateHash = true) {
    const section = document.getElementById(id);
    if (!section) return;
    setWindowOpen(section, true);
    if (updateHash && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    section.scrollIntoView({ behavior: motionOff() ? 'instant' : 'smooth', block: 'start' });
    const heading = section.querySelector('h1,h2,h3');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.hash.slice(1));
      setWindowOpen(target, true);
    });
  });
  function restoreHash() {
    const target = document.getElementById(location.hash.slice(1));
    if (target) setWindowOpen(target, true);
  }
  window.addEventListener('hashchange', restoreHash);
  restoreHash();

  function shellLine(text, className = '') {
    const line = document.createElement('p');
    if (className) line.className = className;
    line.textContent = text;
    shellOutput.append(line);
    while (shellOutput.children.length > 80) shellOutput.firstElementChild.remove();
    shellOutput.scrollTop = shellOutput.scrollHeight;
  }
  if (window.MichalRetro) {
    shell.hidden = false;
    shellForm.addEventListener('submit', event => {
      event.preventDefault();
      const raw = shellInput.value.trim();
      if (!raw) return;
      commandHistory.push(raw);
      if (commandHistory.length > 50) commandHistory.shift();
      historyIndex = commandHistory.length;
      historyDraft = '';
      shellInput.value = '';
      shellLine('1.SYS:> ' + raw, 'command-echo');
      tone(460, .045);
      const action = window.MichalRetro.parseCommand(raw);
      if (action.type === 'navigate') { shellLine('OPENING ' + action.label); goToSection(action.target); }
      else if (action.type === 'clear') shellOutput.replaceChildren();
      else if (action.type === 'boot') openBoot();
      else if (action.type === 'sound') { toggleSound(); shellLine(soundOn ? 'SOUND ON.' : 'SOUND OFF.'); }
      else if (action.type === 'monitor') { cycleScreen(); shellLine('SCREEN: ' + screens[screenIndex].toUpperCase()); }
      else if (action.type === 'date') shellLine(new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', dateStyle: 'full', timeStyle: 'short' }).format(new Date()));
      else if (action.type === 'text') action.lines.forEach(line => shellLine(line));
    });
    shellInput.addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if (historyIndex === commandHistory.length) historyDraft = shellInput.value;
      historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      shellInput.value = historyIndex === commandHistory.length ? historyDraft : commandHistory[historyIndex];
      shellInput.setSelectionRange(shellInput.value.length, shellInput.value.length);
    });
  }
  const clock = document.getElementById('clock');
  const clockFormatter = new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  function refreshClock() { clock.textContent = clockFormatter.format(new Date()); }
  refreshClock();
  setInterval(refreshClock, 1000);
  document.getElementById('year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window) {
    const navLinks = [...document.querySelectorAll('.site-nav a')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    document.querySelectorAll('section.window[id]').forEach(section => observer.observe(section));
  }
  if (window.MichalRetro && !location.hash && readSession(INTRO_KEY) !== 'seen') openBoot();
})();
