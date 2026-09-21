export const MAX_MEMBERS_PER_GROUP = 6;

export const formatJoinedDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatProgressTime = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
