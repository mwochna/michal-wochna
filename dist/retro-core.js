(function (scope) {
  'use strict';
  const sections = {
    ABOUT: 'top', WORK: 'work', QUALIFICATIONS: 'qualifications', EDUCATION: 'qualifications', CV: 'qualifications',
    STORY: 'story', ORIGIN: 'story', HOBBIES: 'off-clock', PROJECTS: 'projects', CONTACT: 'contact'
  };
  const help = [
    'ABOUT / WORK / QUALIFICATIONS / STORY',
    'HOBBIES / PROJECTS / CONTACT',
    'WHOAMI    A short introduction',
    'LIST      List the pages on this disk',
    'CLEAR     Clear the screen',
    'SOUND     Turn sound on or off',
    'MONITOR   Colour, green or amber',
    'BOOT      Replay the Commodore loading screen',
    'PRINT "YOUR TEXT"    A little BASIC'
  ];
  function parseCommand(raw) {
    const value = String(raw).trim();
    const upper = value.toUpperCase();
    if (!value) return { type: 'empty' };
    if (sections[upper]) return { type: 'navigate', target: sections[upper], label: upper };
    if (['HELP', '?'].includes(upper)) return { type: 'text', lines: help };
    if (['LIST', 'DIR'].includes(upper)) return { type: 'text', lines: [
      '0 "MICHAL.WOCHNA" 64 2A',
      '  "ABOUT"          PRG',
      '  "WORK"           PRG',
      '  "QUALIFICATIONS" PRG',
      '  "STORY"          PRG',
      '  "HOBBIES"        PRG',
      '  "PROJECTS"       PRG',
      '  "CONTACT"        PRG',
      'READY.'
    ] };
    if (['WHOAMI', 'INFO'].includes(upper)) return { type: 'text', lines: [
      'MICHAL WOCHNA',
      'IT & Business Systems Manager at Advanced Safety.',
      'Castlebar, Ireland. Originally from Poland.',
      'MSc Computing (Cybersecurity), First Class Honours.',
      'Type WORK or QUALIFICATIONS to read more.'
    ] };
    if (['CLEAR', 'CLS'].includes(upper)) return { type: 'clear' };
    if (['BOOT', 'REBOOT', 'RUN'].includes(upper)) return { type: 'boot' };
    if (upper === 'SOUND') return { type: 'sound' };
    if (upper === 'MONITOR') return { type: 'monitor' };
    if (upper === 'DATE') return { type: 'date' };
    const print = value.match(/^PRINT\s+"([\s\S]*)"$/i);
    if (print) return { type: 'text', lines: [print[1]] };
    const load = upper.match(/^LOAD(?:\s*"([^"]*)")?(?:\s*,\s*8\s*,\s*1)?$/);
    if (load) {
      if (!load[1] || load[1] === 'MICHAL') return { type: 'boot' };
      if (load[1] === '$') return parseCommand('LIST');
      if (sections[load[1]]) return { type: 'navigate', target: sections[load[1]], label: load[1] };
      return { type: 'text', lines: ['?FILE NOT FOUND ERROR', 'Type LIST to see what is on the disk.'] };
    }
    return { type: 'text', lines: ['?SYNTAX ERROR', 'Type HELP for commands.'] };
  }
  const api = Object.freeze({ parseCommand });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else scope.MichalRetro = api;
})(typeof window !== 'undefined' ? window : this);
