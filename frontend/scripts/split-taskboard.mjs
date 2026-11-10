import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");
const srcPath = path.join(root, "pages", "TaskboardPage.jsx");
const lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join("\n");

const tb = path.join(root, "taskboard");
const comp = path.join(tb, "components");
fs.mkdirSync(comp, { recursive: true });

const exportConstNames = [
  "TASK_COMPLETION_MAX_BYTES",
  "TASK_COMPLETION_MAX_FILES",
  "TASK_COMPLETION_ACCEPT",
  "formatFileSize",
  "isImageCompletionFile",
  "isPdfCompletionFile",
  "COLUMNS",
  "columnFor",
  "PRIORITIES",
  "PRIORITY_STYLES",
  "AVATAR_SIZES",
  "SIDEBAR_KEY",
  "LAYOUT_KEY",
  "THEME_KEY",
  "readStoredTheme",
  "fieldClass",
  "primaryButton",
];

let constantsSrc = slice(67, 186);
for (const name of exportConstNames) {
  constantsSrc = constantsSrc.replace(
    new RegExp(`^const ${name}\\b`, "m"),
    `export const ${name}`
  );
}
fs.writeFileSync(path.join(tb, "constants.js"), `${constantsSrc}\n`);

const utilNames = [
  "personId",
  "todayKey",
  "shiftDateKey",
  "boardDateOf",
  "formatDayLabel",
  "formatShortDate",
  "formatStamp",
  "formatDuration",
  "taskDurationMs",
  "firstName",
  "greetingFor",
  "errorMessage",
  "involves",
  "canManageTask",
  "taskRelation",
  "emptyDraft",
  "taskToDraft",
];

let utilsSrc = slice(188, 384);
for (const name of [...utilNames, "RELATION_STYLES"]) {
  utilsSrc = utilsSrc.replace(new RegExp(`^const ${name}\\b`, "m"), `export const ${name}`);
}
fs.writeFileSync(path.join(tb, "utils.js"), `${utilsSrc}\n`);

const componentBlocks = [
  {
    file: "Avatar.jsx",
    start: 386,
    end: 426,
    header: `import { avatarSrcFor } from "../../utils/avatars.js";\nimport { AVATAR_SIZES } from "../constants.js";\nimport { personId } from "../utils.js";\n\n`,
  },
  {
    file: "TeamStrip.jsx",
    start: 428,
    end: 477,
    header: `import { Avatar } from "./Avatar.jsx";\nimport { personId } from "../utils.js";\n\nexport `,
  },
  {
    file: "Priority.jsx",
    start: 479,
    end: 579,
    header: `import { useEffect, useRef, useState } from "react";\nimport { Check, ChevronDown, Flag } from "lucide-react";\nimport { PRIORITIES, PRIORITY_STYLES, fieldClass } from "../constants.js";\n\nexport const PRIORITY_FILTER_OPTIONS = [\n  { id: "all", label: "All priorities" },\n  ...PRIORITIES,\n];\n\n`,
  },
  {
    file: "TaskMeta.jsx",
    start: 581,
    end: 721,
    header: `import { CalendarDays, Clock, Sparkles, Users } from "lucide-react";\nimport { columnFor } from "../constants.js";\nimport {\n  formatDuration,\n  formatShortDate,\n  formatStamp,\n  taskDurationMs,\n  taskRelation,\n  RELATION_STYLES,\n} from "../utils.js";\n\n`,
  },
  {
    file: "PersonPicker.jsx",
    start: 723,
    end: 870,
    header: `import { useRef, useState } from "react";\nimport { Search, X } from "lucide-react";\nimport { Avatar } from "./Avatar.jsx";\nimport { personId } from "../utils.js";\n\nexport `,
  },
  {
    file: "TaskFields.jsx",
    start: 872,
    end: 1044,
    header: `import { useRef } from "react";\nimport { COLUMNS, PRIORITIES, fieldClass } from "../constants.js";\nimport { personId } from "../utils.js";\nimport PersonPicker from "./PersonPicker.jsx";\n\nconst FieldLabel = ({ children }) => (\n  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">\n    {children}\n  </span>\n);\n\nexport `,
  },
  {
    file: "TaskboardSidebar.jsx",
    start: 1046,
    end: 1197,
    header: `import { Pencil, PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";\nimport { Avatar } from "./Avatar.jsx";\n\nexport `,
  },
  {
    file: "CompleteTaskModal.jsx",
    start: 1199,
    end: 1291,
    header: `import { useState } from "react";\nimport { X } from "lucide-react";\nimport {\n  TASK_COMPLETION_ACCEPT,\n  TASK_COMPLETION_MAX_BYTES,\n  formatFileSize,\n  primaryButton,\n} from "../constants.js";\n\nexport `,
  },
  {
    file: "TaskCompletionAttachments.jsx",
    start: 1293,
    end: 1419,
    header: `import { ExternalLink, FileText, LoaderCircle, Paperclip, Trash2 } from "lucide-react";\nimport {\n  TASK_COMPLETION_ACCEPT,\n  TASK_COMPLETION_MAX_FILES,\n  formatFileSize,\n  isImageCompletionFile,\n  isPdfCompletionFile,\n} from "../constants.js";\n\nexport `,
  },
  {
    file: "PreviousTaskList.jsx",
    start: 3899,
    end: 3958,
    header: `import { StatusPill, TaskTime, DueBadge, DurationNote } from "./TaskMeta.jsx";\n\nexport `,
  },
  {
    file: "TaskActions.jsx",
    start: 3960,
    end: 4060,
    header: `import { useRef } from "react";\nimport { LoaderCircle, MessagesSquare, Upload } from "lucide-react";\nimport {\n  TASK_COMPLETION_ACCEPT,\n  TASK_COMPLETION_MAX_FILES,\n} from "../constants.js";\nimport { involves } from "../utils.js";\n\nexport const taskChatCount = (task) => (task?.chat || []).length;\n\nexport const taskAttachmentCount = (task) => (task?.completionAttachments || []).length;\n\n`,
  },
  {
    file: "TaskTable.jsx",
    start: 4062,
    end: 4300,
    header: `import { Check, ChevronDown, ChevronRight, Plus } from "lucide-react";\nimport { COLUMNS, columnFor } from "../constants.js";\nimport { involves } from "../utils.js";\nimport { Avatar, AvatarStack } from "./Avatar.jsx";\nimport { PriorityPill } from "./Priority.jsx";\nimport { StatusPill, TaskRelationBadge, DurationNote, DueBadge } from "./TaskMeta.jsx";\nimport { TaskUploadButton, TaskChatButton } from "./TaskActions.jsx";\n\nconst TaskRow = `,
  },
  {
    file: "TaskCard.jsx",
    start: 4302,
    end: 4356,
    header: `import { involves } from "../utils.js";\nimport { AvatarStack } from "./Avatar.jsx";\nimport { PriorityPill } from "./Priority.jsx";\nimport { TaskRelationBadge, DurationNote, TaskTime, DueBadge } from "./TaskMeta.jsx";\nimport { TaskChatButton } from "./TaskActions.jsx";\n\nexport `,
  },
  {
    file: "TaskListCard.jsx",
    start: 4358,
    end: 4391,
    header: `import { AvatarStack } from "./Avatar.jsx";\nimport { TaskRelationBadge, StatusPill, TaskTime, DueBadge, DurationNote } from "./TaskMeta.jsx";\nimport { TaskChatButton } from "./TaskActions.jsx";\n\nexport `,
  },
];

for (const block of componentBlocks) {
  let body = slice(block.start, block.end);
  if (block.file === "Avatar.jsx") {
    body = body
      .replace(/^const Avatar/, "export const Avatar")
      .replace(/^const AvatarStack/, "export const AvatarStack");
    body = `import { avatarSrcFor } from "../../utils/avatars.js";\nimport { AVATAR_SIZES } from "../constants.js";\nimport { personId } from "../utils.js";\n\n${body}\n`;
    body = body.replace(
      /^import[\s\S]*?\n\n/,
      `import { avatarSrcFor } from "../../utils/avatars.js";\nimport { AVATAR_SIZES } from "../constants.js";\nimport { personId } from "../utils.js";\n\n`
    );
    fs.writeFileSync(path.join(comp, block.file), body);
    continue;
  }
  if (block.file === "TeamStrip.jsx") {
    body = body.replace(/^const TeamStrip/, "export default function TeamStrip");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(body.indexOf("TeamStrip")));
    continue;
  }
  if (block.file === "Priority.jsx") {
    body = body
      .replace(/^const PriorityPill/, "export const PriorityPill")
      .replace(/^const PRIORITY_FILTER_OPTIONS[\s\S]*?^];\n\n/m, "")
      .replace(/^const PriorityFilter/, "export const PriorityFilter");
    fs.writeFileSync(path.join(comp, block.file), block.header + body);
    continue;
  }
  if (block.file === "TaskMeta.jsx") {
    body = body
      .replace(/^const TaskRelationBadge/, "export const TaskRelationBadge")
      .replace(/^const TaskTiming/, "export const TaskTiming")
      .replace(/^const DurationNote/, "export const DurationNote")
      .replace(/^const StatusPill/, "export const StatusPill")
      .replace(/^const TaskTime/, "export const TaskTime")
      .replace(/^const DueBadge/, "export const DueBadge");
    const header = `import { CalendarDays, Clock, Sparkles, Users } from "lucide-react";\nimport { columnFor } from "../constants.js";\nimport {\n  formatDuration,\n  formatShortDate,\n  formatStamp,\n  taskDurationMs,\n  taskRelation,\n  RELATION_STYLES,\n} from "../utils.js";\n\n`;
    fs.writeFileSync(path.join(comp, block.file), header + body);
    continue;
  }
  if (block.file === "PersonPicker.jsx") {
    body = body.replace(/^const PersonPicker/, "export default function PersonPicker");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(11));
    continue;
  }
  if (block.file === "TaskFields.jsx") {
    body = body
      .replace(/^const FieldLabel[\s\S]*?^};\n\n/m, "")
      .replace(/^const TaskFields/, "export const TaskFields")
      .replace(/^const QuickTaskFields/, "export const QuickTaskFields");
    fs.writeFileSync(path.join(comp, block.file), block.header + body);
    continue;
  }
  if (block.file === "TaskboardSidebar.jsx") {
    body = body.replace(/^const TaskboardSidebar/, "export default function TaskboardSidebar");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(23));
    continue;
  }
  if (block.file === "CompleteTaskModal.jsx") {
    body = body.replace(/^const CompleteTaskModal/, "export default function CompleteTaskModal");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(24));
    continue;
  }
  if (block.file === "TaskCompletionAttachments.jsx") {
    body = body.replace(
      /^const TaskCompletionAttachments/,
      "export default function TaskCompletionAttachments"
    );
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(33));
    continue;
  }
  if (block.file === "PreviousTaskList.jsx") {
    body = body.replace(/^const PreviousTaskList/, "export default function PreviousTaskList");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(21));
    continue;
  }
  if (block.file === "TaskActions.jsx") {
    body = body
      .replace(/^const taskChatCount[\s\S]*?^};\n\n/m, "")
      .replace(/^const taskAttachmentCount[\s\S]*?^};\n\n/m, "")
      .replace(/^const TaskUploadButton/, "export const TaskUploadButton")
      .replace(/^const TaskChatButton/, "export const TaskChatButton");
    fs.writeFileSync(path.join(comp, block.file), block.header + body);
    continue;
  }
  if (block.file === "TaskTable.jsx") {
    body = body
      .replace(/^const TaskTable/, "export default function TaskTable")
      .replace(/^const TaskRow/, "function TaskRow");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(16));
    continue;
  }
  if (block.file === "TaskCard.jsx") {
    body = body.replace(/^const TaskCard/, "export default function TaskCard");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(15));
    continue;
  }
  if (block.file === "TaskListCard.jsx") {
    body = body.replace(/^const TaskListCard/, "export default function TaskListCard");
    fs.writeFileSync(path.join(comp, block.file), block.header + body.slice(19));
    continue;
  }
}

// Main page: lines 1-65 imports + 1421-3897 + export, minus extracted parts
const pageImports = `import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Flag,
  LayoutGrid,
  List,
  ListTodo,
  LoaderCircle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  MessageSquare,
  MessagesSquare,
  Search,
  Send,
  Sparkles,
  Sun,
  Moon,
  Paperclip,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar.jsx";
import TaskboardChatHub from "../components/TaskboardChatHub.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  createDailyTodo,
  createTask,
  deleteDailyTodo,
  deleteTask,
  deleteTaskCompletionAttachment,
  listDailyTodos,
  listStaffChatMessages,
  listStaffConversations,
  listTaskChat,
  listTaskPeople,
  listTasks,
  openStaffConversation,
  sendStaffChatMessage,
  sendTaskChatMessage,
  updateDailyTodo,
  updateProfile,
  updateTask,
  uploadTaskCompletionFile,
} from "../services/api.js";
import { connectRealtime } from "../services/realtime.js";
import { AVATARS, avatarIdFor } from "../utils/avatars.js";
import {
  NOTIFICATIONS_RETURN_KEY,
  requestOpenNotifications,
} from "../utils/notifications.js";

import {
  COLUMNS,
  LAYOUT_KEY,
  PRIORITIES,
  PRIORITY_STYLES,
  SIDEBAR_KEY,
  TASK_COMPLETION_MAX_BYTES,
  THEME_KEY,
  columnFor,
  fieldClass,
  primaryButton,
  readStoredTheme,
} from "./constants.js";
import {
  boardDateOf,
  canManageTask,
  emptyDraft,
  errorMessage,
  firstName,
  formatDayLabel,
  greetingFor,
  involves,
  personId,
  shiftDateKey,
  taskRelation,
  taskToDraft,
  todayKey,
} from "./utils.js";
import { Avatar, AvatarStack } from "./components/Avatar.jsx";
import TeamStrip from "./components/TeamStrip.jsx";
import { PriorityFilter, PriorityPill } from "./components/Priority.jsx";
import {
  DueBadge,
  DurationNote,
  StatusPill,
  TaskRelationBadge,
  TaskTiming,
  TaskTime,
} from "./components/TaskMeta.jsx";
import { QuickTaskFields } from "./components/TaskFields.jsx";
import TaskboardSidebar from "./components/TaskboardSidebar.jsx";
import CompleteTaskModal from "./components/CompleteTaskModal.jsx";
import TaskCompletionAttachments from "./components/TaskCompletionAttachments.jsx";
import PreviousTaskList from "./components/PreviousTaskList.jsx";
import TaskTable from "./components/TaskTable.jsx";
import TaskCard from "./components/TaskCard.jsx";
import TaskListCard from "./components/TaskListCard.jsx";

`;

let pageBody = slice(1421, 3897);
pageBody = pageBody.replace(/^const TaskboardPage/, "export default function TaskboardPage");

fs.writeFileSync(
  path.join(tb, "TaskboardPage.jsx"),
  `${pageImports}${pageBody};\n`
);

fs.writeFileSync(
  path.join(root, "pages", "TaskboardPage.jsx"),
  `export { default } from "../taskboard/TaskboardPage.jsx";\n`
);

console.log("Split complete.");
