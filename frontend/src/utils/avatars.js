// Avatar images live in src/assets/avatar/avatar_N.jpg (N = 1..9).
// Every staff member automatically gets one (derived from their id) until they pick their own.

const modules = import.meta.glob("../assets/avatar/avatar_*.jpg", {
  eager: true,
  import: "default",
});

const avatarNumber = (path) => Number((path.match(/avatar_(\d+)\.jpg$/) || [])[1] || 0);

export const AVATARS = Object.keys(modules)
  .sort((left, right) => avatarNumber(left) - avatarNumber(right))
  .map((path) => ({ id: avatarNumber(path), src: modules[path] }));

export const AVATAR_COUNT = AVATARS.length;

const hashText = (text) => {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const isValidAvatarId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id >= 1 && id <= AVATAR_COUNT;
};

export const defaultAvatarId = (person) => {
  if (!AVATAR_COUNT) {
    return 0;
  }
  const seed = String(person?._id || person?.id || person?.name || "");
  return (hashText(seed) % AVATAR_COUNT) + 1;
};

export const avatarIdFor = (person) =>
  isValidAvatarId(person?.avatar) ? Number(person.avatar) : defaultAvatarId(person);

export const avatarSrcFor = (person) => {
  const id = avatarIdFor(person);
  return AVATARS.find((avatar) => avatar.id === id)?.src || AVATARS[0]?.src || "";
};
