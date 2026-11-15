// Custom vector icon set (24x24, stroke based, inherits currentColor).
const P = {
  mosque:
    '<path d="M4 20v-7a8 8 0 0 1 16 0v7"/><path d="M2 20h20"/><path d="M12 2.5v2.4"/><path d="M10 20v-3.2a2 2 0 0 1 4 0V20"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  wallet:
    '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18v5"/><path d="M4 6.5v11A2.5 2.5 0 0 0 6.5 20H20V9H6.5A2.5 2.5 0 0 1 4 6.5Z"/><path d="M16 14.5h.01"/>',
  shield:
    '<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.1-7.5 9.5-4.4-1.4-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  lock: '<rect x="5.5" y="11" width="13" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v6M13.5 11v6"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 20h14"/>',
  swap: '<path d="M7 8h11l-3-3M17 16H6l3 3"/>',
  backspace: '<path d="M20 6H9l-5 6 5 6h11z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.4 1 2 1.8 2.2C10.5 8 11 5.5 12 3z"/>',
  chev_l: '<path d="M14.5 6l-6 6 6 6"/>',
  chev_r: '<path d="M9.5 6l6 6-6 6"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
};

export const icon = (name, size = 22) =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
