import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  ChatAttachmentView,
  ChatComposer,
  ChatMessageMenu,
  ChatReplyQuote,
  chatCopyText,
  chatPreviewText,
  chatReplyTarget,
  deletedChatLabel,
  isDeletedChatMessage,
} from "./components/ChatAttachment.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  createDailyTodo,
  createTask,
  deleteDailyTodo,
  deleteTask,
  deleteStaffChatMessage,
  deleteTaskChatMessage,
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
  isImageCompletionFile,
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
import ConfirmModal from "./components/ConfirmModal.jsx";
import TaskCompletionAttachments from "./components/TaskCompletionAttachments.jsx";
import PreviousTaskList from "./components/PreviousTaskList.jsx";
import TaskTable from "./components/TaskTable.jsx";
import TaskCard from "./components/TaskCard.jsx";
import TaskListCard from "./components/TaskListCard.jsx";

export default function TaskboardPage() {
  const { token, user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const myId = personId(user);
  const today = useMemo(() => todayKey(), []);
  const yesterday = useMemo(() => shiftDateKey(today, -1), [today]);
  const skipClick = useRef(false);
  const draggingId = useRef("");

  const [view, setView] = useState("all");
  const [layout, setLayout] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "board" ? "board" : "list";
    } catch {
      return "list";
    }
  });
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingPriority, setPendingPriority] = useState(null);
  const [createDraft, setCreateDraft] = useState(() => emptyDraft("todo", ""));
  const [activeId, setActiveId] = useState(null);
  const [fromNotifications, setFromNotifications] = useState(false);
  const [draft, setDraft] = useState(null);
  const [todoText, setTodoText] = useState("");
  const [dropStatus, setDropStatus] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({});
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarChoice, setAvatarChoice] = useState(1);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [colorScheme, setColorScheme] = useState(readStoredTheme);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [taskDrawerTab, setTaskDrawerTab] = useState("details");
  const [activityOpen, setActivityOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatFile, setChatFile] = useState(null);
  const [chatFileError, setChatFileError] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatReply, setChatReply] = useState(null);
  const [chatDeletingId, setChatDeletingId] = useState("");
  const chatEndRef = useRef(null);
  const activeIdRef = useRef(null);
  const taskDrawerTabRef = useRef("details");
  const activeChatRef = useRef(null);
  const myIdRef = useRef(myId);
  myIdRef.current = myId;
  const [chatFilter, setChatFilter] = useState("all");
  const [chatSearch, setChatSearch] = useState("");
  const [dmConversations, setDmConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [hubMessages, setHubMessages] = useState([]);
  const [hubDraft, setHubDraft] = useState("");
  const [hubFile, setHubFile] = useState(null);
  const [hubFileError, setHubFileError] = useState("");
  const [hubSending, setHubSending] = useState(false);
  const [hubError, setHubError] = useState("");
  const [hubReply, setHubReply] = useState(null);
  const [hubDeletingId, setHubDeletingId] = useState("");
  const [previousOpen, setPreviousOpen] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState("");
  const [completeModalTask, setCompleteModalTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(false);
  const [uploadingAttachmentTaskId, setUploadingAttachmentTaskId] = useState("");
  const [deletingAttachmentId, setDeletingAttachmentId] = useState("");
  const [attachmentPendingDelete, setAttachmentPendingDelete] = useState(null);
  const [completionInputKey, setCompletionInputKey] = useState(0);

  const activeTask = tasks.find((task) => task._id === activeId) || null;
  activeIdRef.current = activeId;
  taskDrawerTabRef.current = taskDrawerTab;
  activeChatRef.current = activeChat;

  const me = useMemo(() => {
    const fromDirectory = people.find((person) => personId(person) === myId);
    return { ...(user || {}), ...(fromDirectory || {}), _id: myId };
  }, [people, myId, user]);

  const assignablePeople = useMemo(() => {
    if (!myId || !user?.name || people.some((person) => personId(person) === myId)) {
      return people;
    }
    return [
      {
        _id: myId,
        name: user.name,
        department: user.department,
        position: user.position,
        role: user.role,
        avatar: user.avatar,
      },
      ...people,
    ];
  }, [people, myId, user]);

  const directory = useMemo(() => {
    const map = new Map(assignablePeople.map((person) => [personId(person), person]));
    if (draft?.owner && !map.has(draft.owner) && activeTask?.owner?.name) {
      map.set(personId(activeTask.owner), activeTask.owner);
    }
    (activeTask?.assignees || []).forEach((person) => {
      if (person?.name && !map.has(personId(person))) {
        map.set(personId(person), person);
      }
    });
    return [...map.values()];
  }, [assignablePeople, draft?.owner, activeTask]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [taskData, peopleData, todoData, dmData] = await Promise.all([
          listTasks(),
          listTaskPeople(),
          listDailyTodos(today),
          listStaffConversations().catch(() => ({ conversations: [] })),
        ]);
        if (cancelled) {
          return;
        }
        setTasks(taskData.tasks || []);
        setPeople(peopleData.people || []);
        setTodos(todoData.todos || []);
        setDmConversations(dmData.conversations || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError, "The taskboard could not be loaded."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId || loading) {
      return;
    }
    const task = tasks.find((item) => item._id === taskId);
    if (task && involves(task, myId)) {
      const openChat = searchParams.get("chat") === "1";
      setFormError("");
      setChatError("");
      setChatDraft("");
      setChatFile(null);
      setChatFileError("");
      setChatReply(null);
      setActivityOpen(false);
      setTaskDrawerTab(openChat ? "chat" : "details");
      setActiveId(task._id);
      setDraft(taskToDraft(task));
      setChatMessages(task.chat || []);
      try {
        setFromNotifications(sessionStorage.getItem(NOTIFICATIONS_RETURN_KEY) === "1");
      } catch {
        setFromNotifications(false);
      }
    }
    const next = new URLSearchParams(searchParams);
    next.delete("task");
    next.delete("chat");
    setSearchParams(next, { replace: true });
  }, [loading, myId, searchParams, setSearchParams, tasks]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }
      setCreating(false);
      setPendingPriority(null);
      setActiveId(null);
      setDraft(null);
      setFormError("");
      setMobileSidebarOpen(false);
      setAvatarPickerOpen(false);
      setPreviousOpen(false);
      setCompleteModalTask(null);
      setAttachmentPendingDelete(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore storage failures */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
    } catch {
      /* ignore storage failures */
    }
  }, [layout]);

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!involves(task, myId) || boardDateOf(task) !== today) {
        return false;
      }
      const relation = taskRelation(task, myId);
      if (view === "mine" && relation !== "created") {
        return false;
      }
      if (view === "assigned" && relation !== "assigned") {
        return false;
      }
      if (priority !== "all" && task.priority !== priority) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const names = [task.owner, ...(task.assignees || [])]
        .map((person) => person?.name || "")
        .join(" ");
      return `${task.title} ${task.description || ""} ${names}`
        .toLowerCase()
        .includes(needle);
    });
  }, [tasks, view, myId, priority, query, today]);

  const memberTasks = tasks.filter((task) => involves(task, myId));
  const todayMemberTasks = memberTasks.filter((task) => boardDateOf(task) === today);
  const yesterdayTasks = memberTasks.filter((task) => boardDateOf(task) === yesterday);
  const earlierTasks = memberTasks.filter((task) => {
    const key = boardDateOf(task);
    return Boolean(key) && key < yesterday;
  });
  const openTasks = todayMemberTasks.filter((task) => task.status !== "done");
  const doneTasks = todayMemberTasks.filter((task) => task.status === "done");
  const myCreatedOpenTasks = todayMemberTasks.filter(
    (task) => task.status !== "done" && taskRelation(task, myId) === "created"
  );
  const assignedOpenTasks = todayMemberTasks.filter(
    (task) => task.status !== "done" && taskRelation(task, myId) === "assigned"
  );
  const myOpenTasks = openTasks;
  const dueTodayTasks = todayMemberTasks.filter(
    (task) => task.dueDate === today && task.status !== "done"
  );
  const myDueToday = dueTodayTasks.filter((task) => involves(task, myId));
  const completion = todayMemberTasks.length
    ? Math.round((doneTasks.length / todayMemberTasks.length) * 100)
    : 0;
  const earlierGroups = useMemo(() => {
    const groups = new Map();
    earlierTasks.forEach((task) => {
      const key = boardDateOf(task);
      const list = groups.get(key) || [];
      list.push(task);
      groups.set(key, list);
    });
    return [...groups.entries()]
      .sort((left, right) => (left[0] < right[0] ? 1 : -1))
      .map(([key, list]) => ({ key, label: formatDayLabel(key), tasks: list }));
  }, [earlierTasks]);
  const previousOpenCount = [...yesterdayTasks, ...earlierTasks].filter(
    (task) => task.status !== "done"
  ).length;

  const metrics = [
    {
      label: "Open",
      value: openTasks.length,
      icon: ListTodo,
      tone: "bg-violet-100 text-violet-700",
      card: "from-violet-50 to-white",
    },
    {
      label: "Yours",
      value: myOpenTasks.length,
      icon: Users,
      tone: "bg-sky-100 text-sky-700",
      card: "from-sky-50 to-white",
    },
    {
      label: "Due today",
      value: dueTodayTasks.length,
      icon: Sun,
      tone: "bg-amber-100 text-amber-700",
      card: "from-amber-50 to-white",
    },
    {
      label: "Done",
      value: doneTasks.length,
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-700",
      card: "from-emerald-50 to-white",
    },
  ];

  const refreshDmConversations = async () => {
    try {
      const data = await listStaffConversations();
      setDmConversations(data.conversations || []);
    } catch {
      /* keep cached list */
    }
  };

  const groupChatThreads = useMemo(
    () =>
      tasks
        .filter((task) => involves(task, myId))
        .map((task) => {
          const chat = task.chat || [];
          const last = chat[chat.length - 1];
          return {
            key: `task:${task._id}`,
            type: "group",
            taskId: task._id,
            title: task.title,
            preview: chatPreviewText(last) || "No messages yet",
            updatedAt: last?.createdAt || task.updatedAt,
            messageCount: chat.length,
            task,
          };
        })
        .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)),
    [tasks, myId]
  );

  const directChatThreads = useMemo(
    () =>
      dmConversations.map((entry) => ({
        key: `dm:${entry._id}`,
        type: "direct",
        conversationId: entry._id,
        title: entry.peer?.name || "Teammate",
        peer: entry.peer,
        preview: entry.lastMessage?.body || "Say hello",
        updatedAt: entry.lastMessage?.createdAt || entry.updatedAt,
        messageCount: 0,
      })),
    [dmConversations]
  );

  const mergedChatThreads = useMemo(() => {
    const merged = [...directChatThreads, ...groupChatThreads];
    merged.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
    return merged;
  }, [directChatThreads, groupChatThreads]);

  const staffMatches = useMemo(() => {
    const needle = chatSearch.trim().toLowerCase();
    if (needle.length < 2) {
      return [];
    }
    return assignablePeople
      .filter((person) => personId(person) !== myId)
      .filter((person) => {
        const haystack = `${person.name || ""} ${person.department || ""} ${person.position || ""}`
          .toLowerCase()
          .trim();
        return haystack.includes(needle);
      })
      .slice(0, 8);
  }, [assignablePeople, chatSearch, myId]);

  const chatThreads = useMemo(() => {
    const needle = chatSearch.trim().toLowerCase();
    let list = mergedChatThreads;
    if (chatFilter === "direct") {
      list = list.filter((item) => item.type === "direct");
    } else if (chatFilter === "group") {
      list = list.filter((item) => item.type === "group");
    }
    if (!needle) {
      return list;
    }
    return list.filter((item) => `${item.title} ${item.preview}`.toLowerCase().includes(needle));
  }, [mergedChatThreads, chatFilter, chatSearch]);

  const activeChatKey = useMemo(() => {
    if (!activeChat) {
      return "";
    }
    if (activeChat.type === "direct") {
      return `dm:${activeChat.conversationId}`;
    }
    if (activeChat.type === "group") {
      return `task:${activeChat.taskId}`;
    }
    return "";
  }, [activeChat]);

  const hubChatTask = useMemo(() => {
    if (activeChat?.type !== "group") {
      return null;
    }
    return tasks.find((task) => task._id === activeChat.taskId) || activeChat.task || null;
  }, [activeChat, tasks]);

  const hubParticipants = useMemo(() => {
    if (!hubChatTask) {
      return [];
    }
    const map = new Map();
    [hubChatTask.owner, hubChatTask.createdBy, ...(hubChatTask.assignees || [])].forEach(
      (person) => {
        const id = personId(person);
        if (id && person?.name) {
          map.set(id, person);
        }
      }
    );
    return [...map.values()];
  }, [hubChatTask]);

  const hubCanSend =
    activeChat?.type === "direct"
      ? Boolean(activeChat.conversationId)
      : Boolean(hubChatTask && involves(hubChatTask, myId));

  const selectChatThread = async (thread) => {
    setHubError("");
    setHubReply(null);
    setHubDraft("");
    setHubFile(null);
    setHubFileError("");
    if (thread.type === "direct") {
      setActiveChat({
        type: "direct",
        conversationId: thread.conversationId,
        peer: thread.peer,
      });
      try {
        const data = await listStaffChatMessages(thread.conversationId);
        setHubMessages(data.messages || []);
      } catch (loadError) {
        setHubMessages([]);
        setHubError(errorMessage(loadError, "Messages could not be loaded."));
      }
      return;
    }
    setActiveChat({
      type: "group",
      taskId: thread.taskId,
      title: thread.title,
      task: thread.task,
    });
    try {
      const data = await listTaskChat(thread.taskId);
      const messages = data.messages || [];
      setHubMessages(messages);
      setTasks((current) =>
        current.map((task) => (task._id === thread.taskId ? { ...task, chat: messages } : task))
      );
    } catch (loadError) {
      setHubMessages(thread.task?.chat || []);
      setHubError(errorMessage(loadError, "Messages could not be loaded."));
    }
  };

  const selectStaffForChat = async (person) => {
    const peerId = personId(person);
    if (!peerId || peerId === myId) {
      return;
    }
    setHubError("");
    setHubDraft("");
    setHubReply(null);
    setHubFile(null);
    setHubFileError("");
    setChatSearch("");
    try {
      const data = await openStaffConversation(peerId);
      const conversation = data.conversation;
      const messages = data.messages || [];
      if (conversation) {
        setDmConversations((current) => {
          const rest = current.filter((item) => String(item._id) !== String(conversation._id));
          return [conversation, ...rest];
        });
        setActiveChat({
          type: "direct",
          conversationId: conversation._id,
          peer: conversation.peer || person,
        });
      }
      setHubMessages(messages);
      setView("chat");
      setMobileSidebarOpen(false);
    } catch (openError) {
      setHubError(errorMessage(openError, "Conversation could not be opened."));
    }
  };

  const submitHubChat = async (event) => {
    event.preventDefault();
    const body = hubDraft.trim();
    const file = activeChat?.type === "group" ? hubFile : null;
    if ((!body && !file) || !activeChat) {
      return;
    }
    setHubSending(true);
    setHubError("");
    try {
      if (activeChat.type === "direct") {
        const data = await sendStaffChatMessage(activeChat.conversationId, body, hubReply);
        setHubDraft("");
        setHubReply(null);
        const message = data.chatMessage;
        if (message) {
          setHubMessages((current) => [...current, message]);
        }
        if (data.conversation) {
          setDmConversations((current) => {
            const rest = current.filter(
              (item) => String(item._id) !== String(data.conversation._id)
            );
            return [data.conversation, ...rest];
          });
        } else {
          refreshDmConversations();
        }
      } else if (hubChatTask && involves(hubChatTask, myId)) {
        const data = await sendTaskChatMessage(activeChat.taskId, body, file, hubReply);
        setHubDraft("");
        setHubReply(null);
        setHubFile(null);
        setHubFileError("");
        const nextTask = data.task;
        if (nextTask) {
          setHubMessages(nextTask.chat || []);
          setTasks((current) =>
            current.map((task) => (task._id === nextTask._id ? nextTask : task))
          );
        }
      }
    } catch (sendError) {
      setHubError(errorMessage(sendError, "Your message could not be sent."));
    } finally {
      setHubSending(false);
    }
  };

  const encouragement = (() => {
    if (view === "chat") {
      return "Message teammates directly or jump into a task group chat.";
    }
    if (!todayMemberTasks.length) {
      return previousOpenCount
        ? "Today is a clean slate. Open Yesterday to bring a task onto today's list."
        : "Today is a clean slate. Create the first task for today.";
    }
    if (!myOpenTasks.length) {
      return "Your plate is clear. Enjoy the calm, or pick up something new.";
    }
    if (myDueToday.length) {
      return `${myDueToday.length} of your tasks ${
        myDueToday.length === 1 ? "is" : "are"
      } due today. One step at a time, you've got this.`;
    }
    return `${myOpenTasks.length} open ${
      myOpenTasks.length === 1 ? "task" : "tasks"
    } with your name on ${myOpenTasks.length === 1 ? "it" : "them"}. Small steps, steady progress.`;
  })();

  const replaceTask = (nextTask) => {
    setTasks((current) =>
      current.map((task) => (task._id === nextTask._id ? nextTask : task))
    );
  };

  const applyChatTask = (nextTask) => {
    if (!nextTask?._id) {
      return;
    }
    replaceTask(nextTask);
    if (String(activeIdRef.current || "") === String(nextTask._id)) {
      setChatMessages(nextTask.chat || []);
    }
    const hub = activeChatRef.current;
    if (hub?.type === "group" && String(hub.taskId) === String(nextTask._id)) {
      setHubMessages(nextTask.chat || []);
    }
  };

  const removeDrawerMessage = async (entry) => {
    if (!activeTask || personId(entry.author) !== myId || !entry._id) {
      return;
    }
    setChatDeletingId(entry._id);
    setChatError("");
    try {
      const data = await deleteTaskChatMessage(activeTask._id, entry._id);
      applyChatTask(data.task);
      setChatReply((current) =>
        current?.messageId === String(entry._id) ? null : current
      );
    } catch (deleteError) {
      setChatError(errorMessage(deleteError, "The message could not be deleted."));
    } finally {
      setChatDeletingId("");
    }
  };

  const removeHubMessage = async (entry) => {
    if (!activeChat || personId(entry.author) !== myId || !entry._id) {
      return;
    }
    setHubDeletingId(entry._id);
    setHubError("");
    try {
      if (activeChat.type === "direct") {
        const data = await deleteStaffChatMessage(activeChat.conversationId, entry._id);
        if (data.chatMessage) {
          setHubMessages((current) =>
            current.map((item) =>
              String(item._id) === String(data.chatMessage._id) ? data.chatMessage : item
            )
          );
        }
        if (data.conversation) {
          setDmConversations((current) =>
            current.map((item) =>
              String(item._id) === String(data.conversation._id) ? data.conversation : item
            )
          );
        }
      } else {
        const data = await deleteTaskChatMessage(activeChat.taskId, entry._id);
        applyChatTask(data.task);
      }
      setHubReply((current) => (current?.messageId === String(entry._id) ? null : current));
    } catch (deleteError) {
      setHubError(errorMessage(deleteError, "The message could not be deleted."));
    } finally {
      setHubDeletingId("");
    }
  };

  const moveTaskToToday = async (task) => {
    if (!task || boardDateOf(task) === today || movingTaskId) {
      return;
    }
    setMovingTaskId(task._id);
    setError("");
    try {
      const data = await updateTask(task._id, { boardDate: today });
      if (data.task) {
        replaceTask(data.task);
      }
    } catch (moveError) {
      setError(errorMessage(moveError, "The task could not be moved to today."));
    } finally {
      setMovingTaskId("");
    }
  };

  const openCreate = (status = "todo") => {
    setFormError("");
    setPendingPriority(null);
    setCreateDraft(emptyDraft(status, myId));
    setCreating(true);
  };

  const closeCreate = () => {
    setCreating(false);
    setPendingPriority(null);
    setFormError("");
  };

  const openTask = (task) => {
    if (skipClick.current || !task || !involves(task, myId)) {
      return;
    }
    setFormError("");
    setChatError("");
    setChatDraft("");
    setChatFile(null);
    setChatFileError("");
    setTaskDrawerTab("details");
    setActivityOpen(false);
    setChatReply(null);
    setChatMessages(task.chat || []);
    setActiveId(task._id);
    setDraft(taskToDraft(task));
  };

  const openTaskChat = (task) => {
    if (skipClick.current || !task || !involves(task, myId)) {
      return;
    }
    setFormError("");
    setChatError("");
    setChatDraft("");
    setChatFile(null);
    setChatFileError("");
    setChatMessages(task.chat || []);
    setActivityOpen(false);
    setChatReply(null);
    setActiveId(task._id);
    setDraft(taskToDraft(task));
    setTaskDrawerTab("chat");
    refreshTaskChat(task._id);
  };

  const clearNotificationsReturn = () => {
    try {
      sessionStorage.removeItem(NOTIFICATIONS_RETURN_KEY);
    } catch {
      /* ignore storage failures */
    }
    setFromNotifications(false);
  };

  const closeTask = () => {
    setActiveId(null);
    setDraft(null);
    setTaskDrawerTab("details");
    setChatMessages([]);
    setChatReply(null);
    setChatDraft("");
    setChatFile(null);
    setChatFileError("");
    setChatError("");
    clearNotificationsReturn();
  };

  const returnToNotifications = () => {
    clearNotificationsReturn();
    setActiveId(null);
    setDraft(null);
    requestOpenNotifications();
  };

  const openAvatarPicker = () => {
    setAvatarError("");
    setAvatarChoice(avatarIdFor(me));
    setAvatarPickerOpen(true);
    setMobileSidebarOpen(false);
  };

  const applyAvatarLocally = (id, avatar) => {
    const patch = (person) =>
      person && personId(person) === id ? { ...person, avatar } : person;
    setPeople((current) => current.map(patch));
    setTasks((current) =>
      current.map((task) => ({
        ...task,
        owner: patch(task.owner),
        createdBy: patch(task.createdBy),
        assignees: (task.assignees || []).map(patch),
        activity: (task.activity || []).map((entry) => ({
          ...entry,
          actor: patch(entry.actor),
        })),
        chat: (task.chat || []).map((entry) => ({
          ...entry,
          author: patch(entry.author),
        })),
      }))
    );
  };

  const refreshTaskChat = async (taskId) => {
    if (!taskId) {
      return;
    }
    try {
      const data = await listTaskChat(taskId);
      const messages = data.messages || [];
      setChatMessages(messages);
      setTasks((current) =>
        current.map((task) => (task._id === taskId ? { ...task, chat: messages } : task))
      );
    } catch {
      /* keep the last loaded messages on poll failure */
    }
  };

  useEffect(() => {
    if (!activeId || taskDrawerTab !== "chat") {
      return undefined;
    }
    refreshTaskChat(activeId);
    return undefined;
  }, [activeId, taskDrawerTab]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = connectRealtime(token);
    if (!socket) {
      return undefined;
    }

    const onChat = (payload) => {
      const taskId = String(payload?.taskId || "");
      const message = payload?.message;
      if (!taskId || !message?._id) {
        return;
      }

      setTasks((current) =>
        current.map((task) => {
          if (task._id !== taskId) {
            return task;
          }
          const chat = task.chat || [];
          if (chat.some((item) => String(item._id) === String(message._id))) {
            return task;
          }
          return { ...task, chat: [...chat, message] };
        })
      );

      setChatMessages((current) => {
        if (activeIdRef.current !== taskId) {
          return current;
        }
        if (current.some((item) => String(item._id) === String(message._id))) {
          return current;
        }
        return [...current, message];
      });

      setHubMessages((current) => {
        const hub = activeChatRef.current;
        if (hub?.type !== "group" || hub.taskId !== taskId) {
          return current;
        }
        if (current.some((item) => String(item._id) === String(message._id))) {
          return current;
        }
        return [...current, message];
      });
    };

    const onStaffDm = (payload) => {
      const conversationId = String(payload?.conversationId || "");
      const message = payload?.message;
      if (!conversationId || !message?._id) {
        return;
      }

      setDmConversations((current) => {
        const exists = current.some((entry) => String(entry._id) === conversationId);
        if (!exists) {
          refreshDmConversations();
          return current;
        }
        return current.map((entry) => {
          if (String(entry._id) !== conversationId) {
            return entry;
          }
          return {
            ...entry,
            lastMessage: {
              body: message.body,
              createdAt: message.createdAt,
              author: message.author,
            },
            updatedAt: message.createdAt || entry.updatedAt,
          };
        });
      });

      setHubMessages((current) => {
        const hub = activeChatRef.current;
        if (
          hub?.type !== "direct" ||
          String(hub.conversationId) !== conversationId
        ) {
          return current;
        }
        if (current.some((item) => String(item._id) === String(message._id))) {
          return current;
        }
        return [...current, message];
      });
    };

    const onStaffRemoved = (payload) => {
      const conversationId = String(payload?.conversationId || "");
      const messageId = String(payload?.messageId || "");
      if (!conversationId || !messageId) {
        return;
      }
      setDmConversations((current) =>
        current.map((entry) => {
          if (String(entry._id) !== conversationId) {
            return entry;
          }
          return {
            ...entry,
            lastMessage: payload.lastMessage || null,
            updatedAt: payload.updatedAt || entry.updatedAt,
          };
        })
      );
      setHubMessages((current) => {
        const hub = activeChatRef.current;
        if (hub?.type !== "direct" || String(hub.conversationId) !== conversationId) {
          return current;
        }
        if (payload.message) {
          return current.map((item) =>
            String(item._id) === messageId ? payload.message : item
          );
        }
        return current.filter((item) => String(item._id) !== messageId);
      });
    };

    const closeOpenTask = (taskId) => {
      setActiveChat((current) =>
        current?.type === "group" && String(current.taskId) === taskId ? null : current
      );
      if (String(activeIdRef.current || "") !== taskId) {
        return;
      }
      setActiveId(null);
      setDraft(null);
      setTaskDrawerTab("details");
      setChatMessages([]);
      setChatReply(null);
      setChatDraft("");
      setChatFile(null);
      setChatFileError("");
      setChatError("");
    };

    const onTaskUpsert = (payload) => {
      const next = payload?.task;
      if (!next?._id) {
        return;
      }
      const taskId = String(next._id);
      if (!involves(next, myIdRef.current)) {
        setTasks((current) => current.filter((task) => String(task._id) !== taskId));
        closeOpenTask(taskId);
        return;
      }
      setTasks((current) => {
        const exists = current.some((task) => String(task._id) === taskId);
        if (!exists) {
          return [next, ...current];
        }
        return current.map((task) => (String(task._id) === taskId ? next : task));
      });
      if (String(activeIdRef.current || "") === taskId && taskDrawerTabRef.current === "chat") {
        setChatMessages(next.chat || []);
      }
      setHubMessages((current) => {
        const hub = activeChatRef.current;
        if (hub?.type !== "group" || String(hub.taskId) !== taskId) {
          return current;
        }
        return next.chat || current;
      });
    };

    const onTaskRemove = (payload) => {
      const taskId = String(payload?.taskId || "");
      if (!taskId) {
        return;
      }
      setTasks((current) => current.filter((task) => String(task._id) !== taskId));
      closeOpenTask(taskId);
    };

    const onConnect = () => {
      if (taskDrawerTabRef.current === "chat" && activeIdRef.current) {
        refreshTaskChat(activeIdRef.current);
      }
    };

    socket.on("task:chat", onChat);
    socket.on("staff:dm", onStaffDm);
    socket.on("staff:dm-removed", onStaffRemoved);
    socket.on("task:upsert", onTaskUpsert);
    socket.on("task:remove", onTaskRemove);
    socket.on("connect", onConnect);
    return () => {
      socket.off("task:chat", onChat);
      socket.off("staff:dm", onStaffDm);
      socket.off("staff:dm-removed", onStaffRemoved);
      socket.off("task:upsert", onTaskUpsert);
      socket.off("task:remove", onTaskRemove);
      socket.off("connect", onConnect);
    };
  }, [token]);

  useEffect(() => {
    if (taskDrawerTab !== "chat") {
      return;
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, taskDrawerTab]);

  const submitChat = async (event) => {
    event.preventDefault();
    if (!activeTask || !involves(activeTask, myId)) {
      return;
    }
    const body = chatDraft.trim();
    if (!body && !chatFile) {
      return;
    }
    setChatSending(true);
    setChatError("");
    try {
      const data = await sendTaskChatMessage(activeTask._id, body, chatFile, chatReply);
      const nextTask = data.task;
      setChatDraft("");
      setChatReply(null);
      setChatFile(null);
      setChatFileError("");
      if (nextTask) {
        setChatMessages(nextTask.chat || []);
        setTasks((current) =>
          current.map((task) => (task._id === nextTask._id ? nextTask : task))
        );
      }
    } catch (sendError) {
      setChatError(errorMessage(sendError, "Your message could not be sent."));
    } finally {
      setChatSending(false);
    }
  };

  const formatChatWhen = (value) => {
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

  const chatParticipants = useMemo(() => {
    if (!activeTask) {
      return [];
    }
    const map = new Map();
    [activeTask.owner, activeTask.createdBy, ...(activeTask.assignees || [])].forEach(
      (person) => {
        const id = personId(person);
        if (id && person?.name) {
          map.set(id, person);
        }
      }
    );
    return [...map.values()];
  }, [activeTask]);

  const saveAvatar = async () => {
    setAvatarSaving(true);
    setAvatarError("");
    try {
      const data = await updateProfile({ avatar: avatarChoice });
      const savedAvatar = data?.user?.avatar ?? avatarChoice;
      updateUser({ avatar: savedAvatar });
      applyAvatarLocally(myId, savedAvatar);
      setAvatarPickerOpen(false);
    } catch (saveError) {
      setAvatarError(errorMessage(saveError, "Your avatar could not be saved."));
    } finally {
      setAvatarSaving(false);
    }
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!createDraft.title.trim()) {
      setFormError("Add a title before creating the task.");
      return;
    }
    const owner = createDraft.owner || myId;
    if (!owner) {
      setFormError("Sign in again before creating a task.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const data = await createTask({
        title: createDraft.title.trim(),
        description: createDraft.description.trim(),
        status: createDraft.status || "todo",
        owner,
        assignees: createDraft.assignees,
      });
      setTasks((current) => [data.task, ...current]);
      setPendingPriority(data.task);
    } catch (saveError) {
      setFormError(errorMessage(saveError, "The task could not be created."));
    } finally {
      setSaving(false);
    }
  };

  const applyCreatedPriority = async (priorityId) => {
    if (!pendingPriority) {
      return;
    }
    if (priorityId === pendingPriority.priority) {
      closeCreate();
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const data = await updateTask(pendingPriority._id, { priority: priorityId });
      replaceTask(data.task);
      closeCreate();
    } catch (saveError) {
      setFormError(errorMessage(saveError, "The priority could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const submitUpdate = async (event) => {
    event.preventDefault();
    if (!activeTask || !draft) {
      return;
    }
    if (!canManageTask(activeTask, myId)) {
      return;
    }
    if (!draft.title.trim()) {
      setFormError("A task needs a title.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const data = await updateTask(activeTask._id, {
        title: draft.title.trim(),
        description: draft.description,
        status: draft.status,
        priority: draft.priority,
        dueDate: draft.dueDate,
        owner: draft.owner,
        assignees: draft.assignees,
      });
      replaceTask(data.task);
      closeTask();
    } catch (saveError) {
      setFormError(errorMessage(saveError, "The task could not be updated."));
    } finally {
      setSaving(false);
    }
  };

  const attachCompletionFile = async (taskId, file) => {
    if (!file) {
      return;
    }
    const data = await uploadTaskCompletionFile(taskId, file);
    if (data.task) {
      replaceTask(data.task);
    }
  };

  const moveTask = async (task, status, { completionFile } = {}) => {
    if (!task || task.status === status || !involves(task, myId)) {
      if (task && !involves(task, myId)) {
        setError("Only the owner, creator, and assigned staff can update this task.");
      }
      return;
    }
    const previous = task;
    setTasks((current) =>
      current.map((item) => (item._id === task._id ? { ...item, status } : item))
    );
    try {
      const data = await updateTask(task._id, { status });
      replaceTask(data.task);
      if (activeId === task._id) {
        setDraft((current) =>
          current ? { ...current, status: data.task.status } : taskToDraft(data.task)
        );
      }
      if (status === "done" && completionFile) {
        try {
          await attachCompletionFile(task._id, completionFile);
        } catch (uploadError) {
          setError(
            errorMessage(
              uploadError,
              "The task was marked done, but the file could not be uploaded."
            )
          );
        }
      }
    } catch (moveError) {
      replaceTask(previous);
      setError(errorMessage(moveError, "The status could not be updated."));
    }
  };

  const requestStatusChange = (task, status) => {
    if (!task || task.status === status) {
      return;
    }
    if (!involves(task, myId)) {
      setError("Only the owner, creator, and assigned staff can update this task.");
      return;
    }
    if (status === "done" && task.status !== "done") {
      setCompleteModalTask(task);
      return;
    }
    moveTask(task, status);
  };

  const closeCompleteModal = () => {
    if (!completingTask) {
      setCompleteModalTask(null);
    }
  };

  const confirmCompleteTask = async (file) => {
    if (!completeModalTask) {
      return;
    }
    setCompletingTask(true);
    try {
      await moveTask(completeModalTask, "done", { completionFile: file });
      setCompleteModalTask(null);
    } finally {
      setCompletingTask(false);
    }
  };

  const uploadAttachmentForTask = async (task, file, { useFormError = false } = {}) => {
    if (!task || !file) {
      return;
    }
    if (file.size > TASK_COMPLETION_MAX_BYTES) {
      const message = "Choose a file 2MB or smaller.";
      if (useFormError) {
        setFormError(message);
        setCompletionInputKey((current) => current + 1);
      } else {
        setError(message);
      }
      return;
    }
    const taskId = String(task._id);
    setUploadingAttachmentTaskId(taskId);
    if (useFormError) {
      setFormError("");
    }
    try {
      await attachCompletionFile(task._id, file);
      setCompletionInputKey((current) => current + 1);
    } catch (uploadError) {
      const message = errorMessage(uploadError, "The file could not be uploaded.");
      if (useFormError) {
        setFormError(message);
      } else {
        setError(message);
      }
    } finally {
      setUploadingAttachmentTaskId((current) => (current === taskId ? "" : current));
    }
  };

  const uploadCompletionFromDetail = (file) =>
    uploadAttachmentForTask(activeTask, file, { useFormError: true });

  const requestRemoveAttachment = (item) => {
    if (!activeTask?._id || !item?._id || deletingAttachmentId) {
      return;
    }
    setAttachmentPendingDelete(item);
  };

  const cancelRemoveAttachment = () => {
    if (!deletingAttachmentId) {
      setAttachmentPendingDelete(null);
    }
  };

  const confirmRemoveAttachment = async () => {
    const item = attachmentPendingDelete;
    if (!activeTask?._id || !item?._id) {
      setAttachmentPendingDelete(null);
      return;
    }
    const attachmentId = String(item._id);
    setDeletingAttachmentId(attachmentId);
    setFormError("");
    try {
      const data = await deleteTaskCompletionAttachment(activeTask._id, attachmentId);
      if (data.task) {
        replaceTask(data.task);
      }
      setAttachmentPendingDelete(null);
    } catch (deleteError) {
      setFormError(errorMessage(deleteError, "The file could not be removed."));
    } finally {
      setDeletingAttachmentId("");
    }
  };

  const removeTask = async () => {
    if (!activeTask || !canManageTask(activeTask, myId)) {
      return;
    }
    if (!window.confirm("Delete this task? Assigned staff will no longer see it.")) {
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await deleteTask(activeTask._id);
      setTasks((current) => current.filter((task) => task._id !== activeTask._id));
      closeTask();
    } catch (deleteError) {
      setFormError(errorMessage(deleteError, "The task could not be deleted."));
    } finally {
      setSaving(false);
    }
  };

  const addTodo = async (event) => {
    event.preventDefault();
    const text = todoText.trim();
    if (!text) {
      return;
    }
    setTodoText("");
    try {
      const data = await createDailyTodo({ text, date: today });
      setTodos((current) => [...current, data.todo]);
    } catch (todoError) {
      setTodoText(text);
      setError(errorMessage(todoError, "The to-do could not be added."));
    }
  };

  const toggleTodo = async (todo) => {
    const nextDone = !todo.done;
    setTodos((current) =>
      current.map((item) => (item._id === todo._id ? { ...item, done: nextDone } : item))
    );
    try {
      const data = await updateDailyTodo(todo._id, { done: nextDone });
      setTodos((current) =>
        current.map((item) => (item._id === todo._id ? data.todo : item))
      );
    } catch (todoError) {
      setTodos((current) =>
        current.map((item) => (item._id === todo._id ? todo : item))
      );
      setError(errorMessage(todoError, "The to-do could not be updated."));
    }
  };

  const removeTodo = async (todo) => {
    setTodos((current) => current.filter((item) => item._id !== todo._id));
    try {
      await deleteDailyTodo(todo._id);
    } catch (todoError) {
      setTodos((current) =>
        [...current, todo].sort(
          (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
        )
      );
      setError(errorMessage(todoError, "The to-do could not be removed."));
    }
  };

  const clearDoneTodos = async () => {
    const finished = todos.filter((todo) => todo.done);
    if (!finished.length) {
      return;
    }
    setTodos((current) => current.filter((todo) => !todo.done));
    try {
      await Promise.all(finished.map((todo) => deleteDailyTodo(todo._id)));
    } catch (todoError) {
      setTodos((current) =>
        [...current, ...finished].sort(
          (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
        )
      );
      setError(errorMessage(todoError, "Completed to-dos could not be cleared."));
    }
  };

  const views = [
    {
      id: "all",
      label: "All tasks",
      hint: "Today's board",
      icon: LayoutGrid,
      tone: "bg-violet-500",
    },
    {
      id: "mine",
      label: "My tasks",
      hint: "Tasks you created",
      icon: Sparkles,
      tone: "bg-violet-500",
    },
    {
      id: "assigned",
      label: "Assigned",
      hint: "Tasks assigned to you",
      icon: Users,
      tone: "bg-sky-500",
    },
    {
      id: "chat",
      label: "Chat",
      hint: "Direct and group messages",
      icon: MessageSquare,
      tone: "bg-indigo-500",
    },
    {
      id: "today",
      label: "Today",
      hint: "Your list for the day",
      icon: Sun,
      tone: "bg-amber-500",
    },
  ];
  const viewCounts = {
    all: todayMemberTasks.length,
    mine: myCreatedOpenTasks.length,
    assigned: assignedOpenTasks.length,
    chat: mergedChatThreads.length,
    today: todos.filter((todo) => !todo.done).length,
  };
  const selectView = (nextView) => {
    setView(nextView);
    setMobileSidebarOpen(false);
    if (nextView === "chat") {
      refreshDmConversations();
    }
  };
  const toggleColorScheme = () => {
    setColorScheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const sidebarProps = {
    view,
    views,
    counts: viewCounts,
    me,
    onChangeAvatar: openAvatarPicker,
    onSelectView: selectView,
  };

  const isDark = colorScheme === "dark";

  const todoDone = todos.filter((todo) => todo.done).length;
  const todoProgress = todos.length ? Math.round((todoDone / todos.length) * 100) : 0;

  const onDragState = (dragging, id) => {
    skipClick.current = dragging;
    if (dragging) {
      draggingId.current = id || "";
    } else {
      window.setTimeout(() => {
        skipClick.current = false;
      }, 80);
    }
  };

  const pageTitle =
    view === "today"
      ? "Today"
      : view === "mine"
        ? "My tasks"
        : view === "assigned"
          ? "Assigned"
          : view === "chat"
            ? "Chat"
            : formatDayLabel(today);

  return (
    <div
      className={`taskboard min-h-screen text-slate-950 [&_button:not(:disabled)]:cursor-pointer ${
        isDark ? "taskboard--dark" : "bg-[#f4f1fb]"
      }`}
    >
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1600px] items-start">
        <aside
          className={`sticky top-20 hidden h-[calc(100vh-5rem)] shrink-0 overflow-hidden border-r transition-[width] duration-200 lg:block ${
            isDark ? "border-slate-700/80" : "border-slate-200/80"
          } ${sidebarCollapsed ? "w-[4.5rem]" : "w-64"}`}
        >
          <TaskboardSidebar
            {...sidebarProps}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          />
        </aside>

        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-20 z-40 bg-slate-950/40 lg:hidden"
            aria-label="Close taskboard menu"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <aside
          className={`fixed bottom-0 left-0 top-20 z-50 w-72 max-w-[85vw] overflow-hidden border-r shadow-xl transition-transform duration-200 lg:hidden ${
            isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
          } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <TaskboardSidebar
            {...sidebarProps}
            collapsed={false}
            onClose={() => setMobileSidebarOpen(false)}
          />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <section
            className={`relative overflow-hidden rounded-2xl px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-5 ${
              isDark
                ? "border border-slate-700/70 bg-gradient-to-r from-[#1a1430] via-[#141c2e] to-[#102028]"
                : "border border-white/80 bg-gradient-to-r from-violet-100 via-sky-50 to-emerald-100"
            }`}
          >
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className={`rounded-xl border p-2 transition lg:hidden ${
                    isDark
                      ? "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      : "border-white/70 bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                  aria-label="Open taskboard menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={openAvatarPicker}
                  className="group relative shrink-0 rounded-full"
                  title="Change your avatar"
                >
                  <Avatar
                    person={me}
                    size="lg"
                    className={`ring-4 shadow-[0_8px_20px_rgba(15,23,42,0.1)] ${
                      isDark ? "ring-slate-700" : "ring-white"
                    }`}
                  />
                  <span
                    className={`absolute -right-0.5 -bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white ring-2 transition group-hover:bg-violet-600 ${
                      isDark ? "ring-slate-700" : "ring-white"
                    }`}
                  >
                    <Pencil className="h-3 w-3" />
                  </span>
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {pageTitle}
                  </p>
                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {greetingFor()}, {firstName(user?.name)}
                  </h1>
                  <p
                    className={`mt-0.5 max-w-xl truncate text-sm ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {encouragement}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <TeamStrip
                  people={assignablePeople}
                  meId={myId}
                  onChangeMine={openAvatarPicker}
                />
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isDark
                      ? "border border-slate-600/80 bg-slate-900/70 text-slate-300"
                      : "bg-white/80 text-slate-600"
                  }`}
                >
                  <span className={isDark ? "text-violet-300" : "text-violet-700"}>
                    {completion}%
                  </span>
                  <span className="text-slate-400">·</span>
                  <span>
                    {doneTasks.length}/{todayMemberTasks.length} done
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleColorScheme}
                  className={`taskboard-theme-toggle inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200/80 bg-white/80 text-slate-700 hover:bg-white"
                  }`}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  title={isDark ? "Light mode" : "Dark mode"}
                >
                  {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviousOpen(true)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? "border border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      : "bg-white/80 text-slate-700 hover:bg-white"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Yesterday
                  {previousOpenCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isDark
                          ? "bg-amber-400/20 text-amber-300"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {previousOpenCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openCreate("todo")}
                  className={`${primaryButton} hidden sm:inline-flex`}
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div
              className={`mt-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <p>{error}</p>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading taskboard...
            </div>
          ) : view === "chat" ? (
            <TaskboardChatHub
              myId={myId}
              activeChat={activeChat}
              messages={hubMessages}
              draft={hubDraft}
              onDraftChange={setHubDraft}
              onSend={submitHubChat}
              sending={hubSending}
              pendingFile={activeChat?.type === "group" ? hubFile : null}
              onPendingFile={(next, message) => {
                setHubFile(next);
                setHubFileError(message || "");
              }}
              fileError={hubFileError}
              allowFiles={activeChat?.type === "group"}
              error={hubError}
              reply={hubReply}
              onCancelReply={() => setHubReply(null)}
              onReply={(entry) => setHubReply(chatReplyTarget(entry))}
              onDeleteMessage={removeHubMessage}
              deletingId={hubDeletingId}
              canSend={hubCanSend}
              participants={hubParticipants}
              onOpenTask={(task) => openTask(task)}
              chatFilter={chatFilter}
              onChatFilterChange={setChatFilter}
              chatSearch={chatSearch}
              onChatSearchChange={setChatSearch}
              chatThreads={chatThreads}
              staffMatches={staffMatches}
              activeChatKey={activeChatKey}
              onSelectChatThread={selectChatThread}
              onSelectStaff={selectStaffForChat}
            />
          ) : view === "today" ? (
            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                      Personal list
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">
                      {formatDayLabel(today)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {todos.length
                        ? `${todoDone} of ${todos.length} done`
                        : "Add the things you want to finish today."}
                    </p>
                  </div>
                  {todoDone > 0 && (
                    <button
                      type="button"
                      onClick={clearDoneTodos}
                      className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                    >
                      Clear done
                    </button>
                  )}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                    style={{ width: `${todoProgress}%` }}
                  />
                </div>
                <form onSubmit={addTodo} className="mt-5 flex gap-2">
                  <input
                    value={todoText}
                    onChange={(event) => setTodoText(event.target.value)}
                    placeholder="Add a to-do for today"
                    className={fieldClass}
                  />
                  <button type="submit" className={`${primaryButton} shrink-0 rounded-2xl`}>
                    Add
                  </button>
                </form>
                <ul className="mt-4 space-y-2">
                  {todos.length === 0 && (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      Your list for today is empty.
                    </li>
                  )}
                  {todos.map((todo) => (
                    <li
                      key={todo._id}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                        todo.done
                          ? "border-emerald-100 bg-emerald-50/60"
                          : "border-slate-100 bg-slate-50/70"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                          todo.done
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-transparent hover:border-emerald-400"
                        }`}
                        aria-label={todo.done ? "Mark not done" : "Mark done"}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <span
                        className={`min-w-0 flex-1 text-sm ${
                          todo.done ? "text-slate-400 line-through" : "text-slate-800"
                        }`}
                      >
                        {todo.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTodo(todo)}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600"
                        aria-label="Remove to-do"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-5">
                <TaskListCard
                  title="Due today"
                  accent="text-amber-600"
                  empty="Nothing on the board is due today."
                  tasks={dueTodayTasks}
                  today={today}
                  myId={myId}
                  onOpen={openTask}
                  onOpenChat={openTaskChat}
                />
                <TaskListCard
                  title="Still with you"
                  accent="text-sky-600"
                  empty="You have no open tasks."
                  tasks={myOpenTasks.slice(0, 8)}
                  today={today}
                  myId={myId}
                  onOpen={openTask}
                  onOpenChat={openTaskChat}
                />
              </div>
            </section>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex flex-wrap gap-2">
                  {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={metric.label}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
                          isDark
                            ? "border-slate-700 bg-slate-900/80"
                            : "border-white bg-white/80"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${metric.tone}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-bold text-slate-900">{metric.value}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {metric.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <div
                  className={`inline-flex shrink-0 rounded-full border p-1 ${
                    isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  }`}
                >
                  {[
                    { id: "list", label: "List", icon: List },
                    { id: "board", label: "Board", icon: LayoutGrid },
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = layout === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setLayout(option.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? isDark
                              ? "bg-violet-600 text-white shadow-[0_6px_14px_rgba(124,58,237,0.35)]"
                              : "bg-slate-950 text-white shadow-[0_6px_14px_rgba(15,23,42,0.18)]"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search tasks or people"
                    className={`${fieldClass} pl-10`}
                  />
                </label>
                <PriorityFilter value={priority} onChange={setPriority} />
                <button
                  type="button"
                  onClick={() => openCreate("todo")}
                  className={`${primaryButton} sm:hidden`}
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              </div>

              {layout === "list" ? (
                <TaskTable
                  tasks={visibleTasks}
                  today={today}
                  myId={myId}
                  collapsed={collapsedSections}
                  onToggleSection={(id) =>
                    setCollapsedSections((current) => ({ ...current, [id]: !current[id] }))
                  }
                  onOpen={openTask}
                  onOpenChat={openTaskChat}
                  onUploadAttachment={uploadAttachmentForTask}
                  uploadingAttachmentTaskId={uploadingAttachmentTaskId}
                  onMove={requestStatusChange}
                  onCreate={openCreate}
                />
              ) : (
                <div className="mt-4 overflow-x-auto rounded-3xl bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-100 p-3 sm:p-4">
                  <div className="grid min-w-[980px] grid-cols-4 gap-3">
                    {COLUMNS.map((column) => {
                      const columnTasks = visibleTasks.filter((task) => task.status === column.id);
                      return (
                        <section
                          key={column.id}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDropStatus(column.id);
                          }}
                          onDragLeave={() =>
                            setDropStatus((current) => (current === column.id ? "" : current))
                          }
                          onDrop={(event) => {
                            event.preventDefault();
                            setDropStatus("");
                            const taskId =
                              event.dataTransfer.getData("text/plain") || draggingId.current;
                            const task = tasks.find((item) => item._id === taskId);
                            requestStatusChange(task, column.id);
                          }}
                          className={`flex min-h-[28rem] flex-col rounded-2xl p-2.5 shadow-sm backdrop-blur-sm transition ${
                            isDark
                              ? "bg-slate-900/80 ring-1 ring-slate-700/80"
                              : "bg-white/80 ring-1 ring-white/80"
                          } ${dropStatus === column.id ? `ring-2 ${column.ring}` : ""}`}
                        >
                          <div className={`mb-2 h-1 rounded-full ${column.bar}`} />
                          <div className="flex items-center justify-between px-1.5">
                            <div className="flex items-center gap-2">
                              <h2 className={`text-sm font-bold ${column.text}`}>{column.label}</h2>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                {columnTasks.length}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openCreate(column.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Add task to ${column.label}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 flex flex-1 flex-col gap-2">
                            {columnTasks.map((task) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                today={today}
                                myId={myId}
                                movable={involves(task, myId)}
                                onOpen={openTask}
                                onOpenChat={openTaskChat}
                                onDragState={onDragState}
                              />
                            ))}
                            {columnTasks.length === 0 && (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-3 py-8 text-center text-xs text-slate-400">
                                Drop a task here
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openCreate(column.id)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white hover:text-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                            Add a card
                          </button>
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl sm:p-6">
            {pendingPriority ? (
              <div>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                      Saved
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">Set a priority</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Optional. Medium is already set if you are not sure.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-violet-50 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      On this task
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                      {pendingPriority.title}
                    </p>
                  </div>
                  <AvatarStack people={pendingPriority.assignees} max={4} size="sm" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {PRIORITIES.map((item) => {
                    const style = PRIORITY_STYLES[item.id] || PRIORITY_STYLES.medium;
                    const current = pendingPriority.priority === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={saving}
                        onClick={() => applyCreatedPriority(item.id)}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold capitalize transition disabled:opacity-60 ${style.chip} ${
                          current ? "ring-2 ring-violet-400" : "hover:brightness-95"
                        }`}
                      >
                        <Flag className={`h-4 w-4 ${style.flag}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={closeCreate}
                    disabled={saving}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Not now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitCreate}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                      New task
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">What needs doing?</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <QuickTaskFields
                  draft={createDraft}
                  people={assignablePeople}
                  disabled={saving}
                  onChange={setCreateDraft}
                />
                {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className={primaryButton}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTask && draft && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <button
            type="button"
            className="hidden flex-1 sm:block"
            aria-label="Close task"
            onClick={closeTask}
          />
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              {fromNotifications ? (
                <button
                  type="button"
                  onClick={returnToNotifications}
                  className="inline-flex min-w-0 items-center gap-2 rounded-full py-1 pr-3 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                  aria-label="Back to all notifications"
                >
                  <span className="inline-flex rounded-full border border-slate-200 p-2 text-slate-500">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                  All notifications
                </button>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <StatusPill status={activeTask.status} />
                  <PriorityPill priority={activeTask.priority} />
                  <TaskRelationBadge task={activeTask} myId={myId} />
                  {involves(activeTask, myId) && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = taskDrawerTab === "chat" ? "details" : "chat";
                        setTaskDrawerTab(next);
                        if (next === "chat") {
                          refreshTaskChat(activeTask._id);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        taskDrawerTab === "chat"
                          ? "bg-violet-600 text-white"
                          : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                      }`}
                      aria-pressed={taskDrawerTab === "chat"}
                    >
                      <MessagesSquare className="h-3.5 w-3.5" />
                      Team chat
                      {chatMessages.length > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            taskDrawerTab === "chat"
                              ? "bg-white/20 text-white"
                              : "bg-violet-200 text-violet-800"
                          }`}
                        >
                          {chatMessages.length > 99 ? "99+" : chatMessages.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={closeTask}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {boardDateOf(activeTask) && boardDateOf(activeTask) !== today && (
              <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
                <p className="text-xs leading-5 text-amber-800">
                  This task is on {formatDayLabel(boardDateOf(activeTask))}. It stays off today's board until you move it.
                </p>
                <button
                  type="button"
                  disabled={movingTaskId === activeTask._id}
                  onClick={() => moveTaskToToday(activeTask)}
                  className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {movingTaskId === activeTask._id ? "Moving..." : "Move to today"}
                </button>
              </div>
            )}
            {fromNotifications && (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                <StatusPill status={activeTask.status} />
                <PriorityPill priority={activeTask.priority} />
                <TaskRelationBadge task={activeTask} myId={myId} />
                {involves(activeTask, myId) && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = taskDrawerTab === "chat" ? "details" : "chat";
                      setTaskDrawerTab(next);
                      if (next === "chat") {
                        refreshTaskChat(activeTask._id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      taskDrawerTab === "chat"
                        ? "bg-violet-600 text-white"
                        : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                    }`}
                    aria-pressed={taskDrawerTab === "chat"}
                  >
                    <MessagesSquare className="h-3.5 w-3.5" />
                    Team chat
                  </button>
                )}
              </div>
            )}
            {taskDrawerTab === "chat" ? (
              <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-violet-50/30">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 bg-white/90 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
                      Group chat
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900">{activeTask.title}</p>
                  </div>
                  <AvatarStack people={chatParticipants} max={4} size="sm" />
                </div>
                {involves(activeTask, myId) ? (
                <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {chatMessages.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center">
                      <MessagesSquare className="mx-auto h-8 w-8 text-violet-400" />
                      <p className="mt-3 text-sm font-semibold text-slate-800">Start the conversation</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Owner, creator, and assignees can chat here about this task.
                      </p>
                    </li>
                  ) : (
                    chatMessages.map((entry) => {
                      const mine = personId(entry.author) === myId;
                      const deleted = isDeletedChatMessage(entry);
                      const image = !deleted && isImageCompletionFile(entry.attachment);
                      return (
                        <li
                          key={entry._id || `${entry.createdAt}-${entry.body}`}
                          className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                        >
                          {!mine && (
                            <Avatar person={entry.author} size="sm" className="mb-1 shrink-0" />
                          )}
                          <div
                            className={`relative max-w-[min(100%,18rem)] rounded-2xl py-2.5 pl-3.5 shadow-sm ${
                              deleted || image ? "pr-3.5" : "pr-6"
                            } ${
                              mine
                                ? "rounded-br-md bg-violet-600 text-white"
                                : "rounded-bl-md border border-slate-200/90 bg-white text-slate-800"
                            }`}
                          >
                            {deleted ? (
                              <p className={`text-sm italic ${mine ? "text-violet-100" : "text-slate-400"}`}>
                                {deletedChatLabel(entry)}
                              </p>
                            ) : (
                              <>
                            <ChatMessageMenu
                              mine={mine}
                              image={image}
                              copyText={chatCopyText(entry)}
                              busy={chatDeletingId === entry._id}
                              onReply={() => setChatReply(chatReplyTarget(entry))}
                              onDelete={() => removeDrawerMessage(entry)}
                            />
                            {!mine && (
                              <p className="mb-0.5 text-xs font-semibold text-violet-700">
                                {entry.author?.name || "Teammate"}
                              </p>
                            )}
                            <ChatReplyQuote reply={entry.replyTo} mine={mine} />
                            <ChatAttachmentView attachment={entry.attachment} mine={mine} />
                            {entry.body ? (
                              <p className="whitespace-pre-wrap text-sm leading-5">{entry.body}</p>
                            ) : null}
                              </>
                            )}
                            <p
                              className={`mt-1 text-[10px] ${mine ? "text-violet-200" : "text-slate-400"}`}
                            >
                              {formatChatWhen(entry.createdAt)}
                            </p>
                          </div>
                        </li>
                      );
                    })
                  )}
                  <li aria-hidden="true" ref={chatEndRef} />
                </ul>
                {chatError && (
                  <p className="px-5 pb-1 text-sm text-rose-600">{chatError}</p>
                )}
                <ChatComposer
                  inputId="task-chat-input"
                  value={chatDraft}
                  onChange={setChatDraft}
                  onSubmit={submitChat}
                  sending={chatSending}
                  placeholder="Write to the team…"
                  file={chatFile}
                  onFile={(next, message) => {
                    setChatFile(next);
                    setChatFileError(message || "");
                  }}
                  allowFiles
                  fileError={chatFileError}
                  reply={chatReply}
                  onCancelReply={() => setChatReply(null)}
                />
                </>
                ) : (
                  <p className="flex flex-1 items-center justify-center px-5 py-10 text-center text-sm text-slate-500">
                    Only people on this task can use this chat.
                  </p>
                )}
              </div>
            ) : (
            <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">{activeTask.title}</h2>
              {involves(activeTask, myId) && (
                <label className="mt-3 flex w-fit items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </span>
                  <select
                    value={activeTask.status}
                    disabled={saving}
                    onChange={(event) => requestStatusChange(activeTask, event.target.value)}
                    className="rounded-full border border-slate-200 bg-white py-1 pr-7 pl-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-violet-300"
                  >
                    {COLUMNS.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className={`mt-4 mb-5 rounded-2xl p-4 ${columnFor(activeTask.status).wash}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Working on it
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <AvatarStack people={activeTask.assignees} max={5} size="md" />
                  <span className="text-xs font-medium text-slate-500">
                    {(activeTask.assignees || []).length}{" "}
                    {(activeTask.assignees || []).length === 1 ? "person" : "people"}
                  </span>
                </div>
                {activeTask.owner?.name && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <Flag className="h-3.5 w-3.5" />
                    Owner · <span className="font-semibold">{activeTask.owner.name}</span>
                  </p>
                )}
              </div>

              <TaskTiming task={activeTask} />

              {involves(activeTask, myId) ||
              (activeTask.completionAttachments || []).length > 0 ? (
                <TaskCompletionAttachments
                  task={activeTask}
                  canUpload={involves(activeTask, myId)}
                  uploading={uploadingAttachmentTaskId === activeTask._id}
                  inputKey={completionInputKey}
                  onPickFile={uploadCompletionFromDetail}
                  deletingAttachmentId={deletingAttachmentId}
                  onDeleteAttachment={requestRemoveAttachment}
                />
              ) : null}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setActivityOpen((open) => !open)}
                  className="flex w-full items-center gap-2 rounded-xl py-1 text-left transition hover:bg-slate-50"
                  aria-expanded={activityOpen}
                >
                  {activityOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Activity
                  </span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {(activeTask.activity || []).length > 99
                      ? "99+"
                      : (activeTask.activity || []).length}
                  </span>
                </button>
                {activityOpen && (
                  (activeTask.activity || []).length === 0 ? (
                    <p className="mt-3 text-sm text-slate-400">No activity yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {[...(activeTask.activity || [])].reverse().map((entry) => (
                        <li
                          key={entry._id || `${entry.message}-${entry.createdAt}`}
                          className="flex gap-3"
                        >
                          <Avatar person={entry.actor} size="sm" className="mt-0.5" />
                          <div>
                            <p className="text-sm text-slate-700">
                              <span className="font-semibold text-slate-900">
                                {entry.actor?.name || "Someone"}
                              </span>{" "}
                              {entry.message
                                ? `${entry.message.charAt(0).toLowerCase()}${entry.message.slice(1)}`
                                : ""}
                            </p>
                            <p className="text-xs text-slate-400">
                              {entry.createdAt
                                ? new Date(entry.createdAt).toLocaleString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
              {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
            </div>
            {canManageTask(activeTask, myId) && (
              <div className="border-t border-slate-100 px-5 py-4">
                <button
                  type="button"
                  onClick={removeTask}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
            </div>
            )}
          </div>
        </div>
      )}

      {previousOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close previous tasks"
            onClick={() => setPreviousOpen(false)}
          />
          <div className="relative flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                  Previous day
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  {formatDayLabel(yesterday)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These stay off today's board. Move a task to today when you want it on the list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviousOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                <PreviousTaskList
                tasks={yesterdayTasks}
                today={today}
                movingTaskId={movingTaskId}
                empty="Nothing was left on yesterday's board."
                onOpen={(task) => {
                  setPreviousOpen(false);
                  openTask(task);
                }}
                onMove={moveTaskToToday}
              />
              {earlierGroups.map((group) => (
                <section key={group.key}>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {group.label}
                  </h3>
                  <div className="mt-2">
                    <PreviousTaskList
                      tasks={group.tasks}
                      today={today}
                      movingTaskId={movingTaskId}
                      empty=""
                      onOpen={(task) => {
                        setPreviousOpen(false);
                        openTask(task);
                      }}
                      onMove={moveTaskToToday}
                    />
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {completeModalTask && (
        <CompleteTaskModal
          task={completeModalTask}
          busy={completingTask}
          onClose={closeCompleteModal}
          onConfirm={confirmCompleteTask}
        />
      )}

      <ConfirmModal
        open={Boolean(attachmentPendingDelete)}
        title="Remove attachment?"
        description={
          attachmentPendingDelete
            ? `“${attachmentPendingDelete.originalName || "This file"}” will be removed from this task. This cannot be undone.`
            : ""
        }
        confirmLabel="Remove file"
        cancelLabel="Keep file"
        busy={Boolean(deletingAttachmentId)}
        tone="danger"
        onClose={cancelRemoveAttachment}
        onConfirm={confirmRemoveAttachment}
      />

      {avatarPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  person={{ ...me, avatar: avatarChoice }}
                  size="lg"
                  className="ring-4 ring-violet-100"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                    Your avatar
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight">Pick one that feels like you</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAvatarPickerOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => {
                const selected = avatarChoice === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setAvatarChoice(avatar.id)}
                    className={`relative rounded-2xl p-1.5 transition ${
                      selected
                        ? "bg-violet-50 ring-2 ring-violet-500"
                        : "ring-1 ring-transparent hover:bg-slate-50 hover:ring-slate-200"
                    }`}
                    aria-pressed={selected}
                    aria-label={`Avatar ${avatar.id}`}
                  >
                    <img
                      src={avatar.src}
                      alt=""
                      draggable={false}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                    {selected && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white ring-2 ring-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Everyone starts with an avatar we picked for them. Choose a different one any time, it shows wherever you appear on the taskboard.
            </p>
            {avatarError && <p className="mt-3 text-sm text-rose-600">{avatarError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAvatarPickerOpen(false)}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAvatar}
                disabled={avatarSaving}
                className={primaryButton}
              >
                {avatarSaving ? "Saving..." : "Use this avatar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
