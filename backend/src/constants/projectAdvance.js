const GROUP_KEYS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
];

const MAX_MEMBERS_PER_GROUP = 6;

const groupNameForKey = (key) => `Group ${String(key || "").toUpperCase()}`;

module.exports = {
  GROUP_KEYS,
  MAX_MEMBERS_PER_GROUP,
  groupNameForKey,
};
