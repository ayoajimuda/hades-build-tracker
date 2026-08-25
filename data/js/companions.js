// Companions - generated from the wiki companion table.
// A companion occupies the KEEPSAKE slot: equipping one means no keepsake.

export const companions = [
  {
    id: 'COM01',
    title: "Companion Battie",
    kind: 'companion',
    slot: 'keepsake',
    source: "Megaera",
    text: "Your Summon deals 2500 damage in an area near your closest foe, then continually down the line.",
    damage: 2500,
    restriction: "Cannot be used against any Fury Sisters",
    iconsrc: "/img/Companions/Battie.webp",
  },
  {
    id: 'COM02',
    title: "Companion Mort",
    kind: 'companion',
    slot: 'keepsake',
    source: "Thanatos",
    text: "Your Summon deals 3500 damage in an area in front of you, after a brief delay.",
    damage: 3500,
    restriction: "Cannot be used in Thanatos's encounters",
    iconsrc: "/img/Companions/Mort.webp",
  },
  {
    id: 'COM03',
    title: "Companion Rib",
    kind: 'companion',
    slot: 'keepsake',
    source: "Skelly",
    text: "Your Summon creates a distraction with 250 Health, provoking your foes to attack it until it dies.",
    damage: null,
    restriction: "Cannot be used against Charon",
    iconsrc: "/img/Companions/Rib.webp",
  },
  {
    id: 'COM04',
    title: "Companion Shady",
    kind: 'companion',
    slot: 'keepsake',
    source: "Sisyphus",
    text: "Your Summon deals 1000 damage in an area and drops a smattering of Health, Darkness, and Obols.",
    damage: 1000,
    drops: [
      "1 Darkness pickup worth 10 Darkness",
      "1 Obols pickup, worth 30 Obols",
      "4 Health pickups, each healing 10 Health",
    ],
    iconsrc: "/img/Companions/Shady.webp",
  },
  {
    id: 'COM05',
    title: "Companion Fidi",
    kind: 'companion',
    slot: 'keepsake',
    source: "Dusa",
    text: "Your Summon joins you for 30 sec, repeatedly firing shots that petrify foes and deal 70 damage.",
    damage: 70,
    restriction: "Cannot be used during the point in the story when Dusa temporarily leaves the house",
    iconsrc: "/img/Companions/Fidi.webp",
  },
  {
    id: 'COM06',
    title: "Companion Antos",
    kind: 'companion',
    slot: 'keepsake',
    source: "Achilles",
    text: "Your Summon deals 1500 damage to 2 foes one after another.",
    damage: 1500,
    iconsrc: "/img/Companions/Antos.webp",
  },
];

export const companionsById = new Map(companions.map((c) => [c.id, c]));

/** Companions with an encounter restriction worth warning about. */
export const restrictedCompanions = companions.filter((c) => c.restriction);