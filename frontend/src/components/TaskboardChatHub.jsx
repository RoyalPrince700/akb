import { useEffect, useRef } from "react";
import { LoaderCircle, MessagesSquare, Search, Send } from "lucide-react";

import { avatarSrcFor } from "../utils/avatars";

const personId = (person) => String(person?._id || person?.id || "");

const CHAT_FILTERS = [
  { id: "all", label: "All" },
  { id: "direct", label: "Direct" },
  { id: "group", label: "Group" },
];

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

const ChatAvatar = ({ person, size = "sm" }) => {
  const sizes = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
  };
  return (
    <img
      src={avatarSrcFor(person)}
      alt={person?.name || "Staff"}
      className={`shrink-0 rounded-full bg-slate-100 object-cover ring-2 ring-white dark:bg-slate-700 dark:ring-slate-600 ${sizes[size] || sizes.sm}`}
    />
  );
};

const ConversationPanel = ({
  myId,
  activeChat,
  messages,
  draft,
  onDraftChange,
  onSend,
  sending,
  error,
  canSend,
  participants = [],
  onOpenTask,
}) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  if (!activeChat) {
    return (
      <section className="flex min-h-[28rem] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-600 dark:bg-slate-900">
        <MessagesSquare className="h-10 w-10 text-violet-400" />
        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Pick a conversation
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Search for a teammate or select a group chat from the list.
        </p>
      </section>
    );
  }

  const isGroup = activeChat.type === "group";
  const title = isGroup ? activeChat.title : activeChat.peer?.name || "Direct message";
  const subtitle = isGroup ? "Group chat · task team" : "Direct message";

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
            {subtitle}
          </p>
          <h2 className="truncate text-lg font-bold text-slate-950 dark:text-slate-100">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isGroup && activeChat.peer ? <ChatAvatar person={activeChat.peer} size="md" /> : null}
          {isGroup && onOpenTask ? (
            <button
              type="button"
              onClick={() => onOpenTask(activeChat.task)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Open task
            </button>
          ) : null}
        </div>
      </div>

      {isGroup && participants.length > 0 ? (
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
          {participants.map((person) => person.name).filter(Boolean).join(" · ")}
        </div>
      ) : null}

      {!canSend ? (
        <p className="flex flex-1 items-center justify-center bg-white px-5 py-10 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          {isGroup
            ? "Only people on this task can use this chat."
            : "This conversation could not be loaded."}
        </p>
      ) : (
      <>
      <ul className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-violet-50/20 px-4 py-4 dark:from-slate-900 dark:to-violet-950/20">
        {messages.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center dark:border-slate-600 dark:bg-slate-800/80">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Start the conversation
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Send the first message below.
            </p>
          </li>
        ) : (
          messages.map((entry) => {
            const mine = personId(entry.author) === myId;
            return (
              <li
                key={entry._id || `${entry.createdAt}-${entry.body}`}
                className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine && <ChatAvatar person={entry.author} />}
                <div
                  className={`max-w-[min(100%,20rem)] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    mine
                      ? "rounded-br-md bg-violet-600 text-white"
                      : "rounded-bl-md border border-slate-200/90 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                      {entry.author?.name || "Teammate"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-5">{entry.body}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? "text-violet-200" : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {formatChatWhen(entry.createdAt)}
                  </p>
                </div>
              </li>
            );
          })
        )}
        <li aria-hidden="true" ref={endRef} />
      </ul>

      {error ? (
        <p className="px-5 text-sm text-rose-600 dark:text-rose-300">{error}</p>
      ) : null}

      <form
        onSubmit={onSend}
        className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
      >
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="hub-chat-input">
              Write a message
            </label>
            <textarea
              id="hub-chat-input"
              rows={2}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend(event);
                }
              }}
              disabled={sending}
              placeholder={isGroup ? "Write to the team…" : "Write a message…"}
              className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-400 dark:focus:bg-slate-950 dark:focus:ring-violet-500/20"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition hover:bg-violet-700 disabled:opacity-50"
              aria-label="Send message"
            >
              {sending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </>
      )}
    </section>
  );
};

const TaskboardChatHub = ({
  myId,
  activeChat,
  messages,
  draft,
  onDraftChange,
  onSend,
  sending,
  error,
  canSend,
  participants = [],
  onOpenTask,
  chatFilter,
  onChatFilterChange,
  chatSearch,
  onChatSearchChange,
  chatThreads,
  staffMatches,
  activeChatKey,
  onSelectChatThread,
  onSelectStaff,
}) => (
  <div className="mt-5 grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
    <aside className="flex max-h-[calc(100vh-14rem)] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-700">
        <h2 className="text-sm font-bold text-slate-950 dark:text-slate-100">Messages</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Direct and task group chats
        </p>
        <label className="sr-only" htmlFor="taskboard-chat-search">
          Search staff or chats
        </label>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="taskboard-chat-search"
            type="search"
            value={chatSearch}
            onChange={(event) => onChatSearchChange(event.target.value)}
            placeholder="Search staff or chats…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-400 dark:focus:bg-slate-950 dark:focus:ring-violet-500/20"
          />
        </div>
        <div className="mt-2 flex gap-1">
          {CHAT_FILTERS.map((item) => {
            const active = chatFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChatFilterChange(item.id)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {staffMatches.length > 0 ? (
        <div className="max-h-36 shrink-0 overflow-y-auto border-b border-slate-100 px-3 py-2 dark:border-slate-700">
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Staff
          </p>
          <ul className="space-y-1">
            {staffMatches.map((person) => (
              <li key={personId(person)}>
                <button
                  type="button"
                  onClick={() => onSelectStaff(person)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-violet-50 dark:text-slate-200 dark:hover:bg-violet-500/15"
                >
                  <ChatAvatar person={person} size="xs" />
                  <span className="min-w-0 truncate">{person.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {chatThreads.length === 0 ? (
          <li className="rounded-xl px-2 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No conversations yet. Search for a teammate to start chatting.
          </li>
        ) : (
          chatThreads.map((thread) => {
            const active = activeChatKey === thread.key;
            return (
              <li key={thread.key}>
                <button
                  type="button"
                  onClick={() => onSelectChatThread(thread)}
                  className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2.5 text-left transition ${
                    active
                      ? "bg-violet-50 ring-1 ring-violet-100 dark:bg-violet-500/15 dark:ring-violet-500/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {thread.type === "direct" ? (
                    <ChatAvatar person={thread.peer} size="sm" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                      <MessagesSquare className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {thread.title}
                      </span>
                      {thread.messageCount > 0 ? (
                        <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                          {thread.messageCount > 99 ? "99+" : thread.messageCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {thread.type === "group" ? "Group · " : ""}
                      {thread.preview}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>

    <ConversationPanel
      myId={myId}
      activeChat={activeChat}
      messages={messages}
      draft={draft}
      onDraftChange={onDraftChange}
      onSend={onSend}
      sending={sending}
      error={error}
      canSend={canSend}
      participants={participants}
      onOpenTask={onOpenTask}
    />
  </div>
);

export default TaskboardChatHub;
