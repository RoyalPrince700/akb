export const personId = (person) => {
  if (person == null || person === "") {
    return "";
  }
  if (typeof person === "string" || typeof person === "number") {
    return String(person);
  }
  return personId(person._id || person.id || "");
};

export const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const shiftDateKey = (key, days) => {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const monthText = String(date.getMonth() + 1).padStart(2, "0");
  const dayText = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${monthText}-${dayText}`;
};

export const boardDateOf = (task) => {
  const explicit = String(task?.boardDate || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit)) {
    return explicit;
  }
  if (!task?.createdAt) {
    return "";
  }
  const created = new Date(task.createdAt);
  if (Number.isNaN(created.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(created);
};

export const formatDayLabel = (key) => {
  const [year, month, day] = String(key).split("-").map(Number);
  if (!year || !month || !day) {
    return key;
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export const formatShortDate = (key) => {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

export const formatStamp = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatDuration = (ms) => {
  const minutes = Math.round(Number(ms) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "";
  }
  if (minutes < 1) {
    return "Less than a minute";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 48) {
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const hourRest = hours % 24;
  return hourRest ? `${days}d ${hourRest}h` : `${days}d`;
};

export const taskDurationMs = (task) => {
  if (task?.status !== "done") {
    return null;
  }
  if (typeof task.durationMs === "number") {
    return task.durationMs;
  }
  if (!task?.createdAt || !task?.completedAt) {
    return null;
  }
  const start = new Date(task.createdAt).getTime();
  const end = new Date(task.completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, end - start);
};

export const firstName = (name) => String(name || "").trim().split(/\s+/)[0] || "there";

export const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
};

export const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

export const involves = (task, id) => {
  if (!id) {
    return false;
  }
  if (personId(task.owner) === id || personId(task.createdBy) === id) {
    return true;
  }
  return (task.assignees || []).some((person) => personId(person) === id);
};

export const canManageTask = (task, id) =>
  personId(task?.owner) === id || personId(task?.createdBy) === id;

export const taskRelation = (task, id) => {
  if (!id || !task) {
    return null;
  }
  if (personId(task.createdBy) === id) {
    return "created";
  }
  if (personId(task.owner) === id) {
    return "assigned";
  }
  if ((task.assignees || []).some((person) => personId(person) === id)) {
    return "assigned";
  }
  return null;
};

export const RELATION_STYLES = {
  created: { chip: "bg-violet-100 text-violet-700", label: "Created by you" },
  assigned: { chip: "bg-sky-100 text-sky-700", label: "Assigned to you" },
};

export const emptyDraft = (status, ownerId) => ({
  title: "",
  description: "",
  status: status || "todo",
  priority: "medium",
  dueDate: "",
  owner: ownerId || "",
  assignees: [],
});

export const taskToDraft = (task) => ({
  title: task.title || "",
  description: task.description || "",
  status: task.status || "todo",
  priority: task.priority || "medium",
  dueDate: task.dueDate || "",
  owner: personId(task.owner),
  assignees: (task.assignees || []).map(personId).filter(Boolean),
});
