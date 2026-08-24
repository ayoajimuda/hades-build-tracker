export const SLOTS = [
  { id: 'attack',  label: 'Attack',  image: '/img/Slots/attack.webp'  },
  { id: 'special', label: 'Special', image: '/img/Slots/special.webp' },
  { id: 'dash',    label: 'Dash',    image: '/img/Slots/dash.webp'    },
  { id: 'cast',    label: 'Cast',    image: '/img/Slots/cast.webp'    },
  { id: 'call',    label: 'Call',    image: '/img/Slots/call.webp'    },
];

export const EMPTY_SLOTS = Object.fromEntries(SLOTS.map((s) => [s.id, null]));