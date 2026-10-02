import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Crown,
  MessageSquareText,
  Receipt,
  Trophy,
  LogOut,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { formatRoleLabel } from "../constants/crm";
import {
  formatJoinedDate,
  formatProgressTime,
} from "../constants/projectAdvance";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import PanelLayout from "../layouts/PanelLayout";
import {
  assignPaGroupMember,
  awardPaReceiptPoints,
  createPaProgress,
  getPaMonitor,
  getPaWorkspace,
  joinPaGroup,
  leavePaGroup,
  removePaGroupMember,
  switchPaGroup,
  setPaGroupTeamLead,
} from "../services/api";

const receiptStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "Awaiting account officer";
    case "accountApproved":
      return "Confirmed · awaiting HR points";
    case "approved":
      return "Points awarded";
    case "rejected":
      return "Rejected by account officer";
    default:
      return null;
  }
};

const receiptStatusClass = (status) => {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "accountApproved":
      return "bg-sky-50 text-sky-800";
    case "approved":
      return "bg-emerald-50 text-emerald-800";
    case "rejected":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-slate-50 text-slate-600";
  }
};

const SummaryCard = ({ label, value, description }) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</h2>
    {description ? (
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    ) : null}
  </div>
);

const formatPointsDelta = (points) => {
  const value = Number(points) || 0;
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
};

const PointsHistory = ({ awards, emptyLabel }) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-700">
        <Trophy className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">
          Points awarded
        </h2>
        <p className="text-sm text-slate-500">HR point allocations for this group</p>
      </div>
    </div>

    <div className="mt-5 space-y-3">
      {awards.map((item) => (
        <article
          key={item._id}
          className="rounded-2xl border border-slate-100 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p
              className={`text-sm font-bold ${
                item.points >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {formatPointsDelta(item.points)} pts
            </p>
            <p className="text-xs text-slate-500">
              {formatProgressTime(item.createdAt)}
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-500">by {item.awardedByName}</p>
          {item.note ? (
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.note}</p>
          ) : null}
        </article>
      ))}
      {!awards.length ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : null}
    </div>
  </div>
);

const MembersList = ({
  members,
  canRemove = false,
  canManageLead = false,
  removingUserId = "",
  leadingUserId = "",
  onRemove,
  onSetTeamLead,
}) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-50 text-orange-700">
        <Users className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">
          Group members
        </h2>
        <p className="text-sm text-slate-500">
          {members.length
            ? `${members.length} member${members.length === 1 ? "" : "s"}`
            : "No members yet"}
          {canRemove ? " · admin can remove mistaken joins" : ""}
        </p>
      </div>
    </div>

    <div className="mt-5 space-y-3">
      {members.map((member) => {
        const userKey = String(member.user);
        const isLead = Boolean(member.isTeamLead);

        return (
          <div
            key={userKey}
            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{member.name}</p>
                {isLead ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <Crown className="h-3 w-3" />
                    Team lead
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {[member.position, member.department].filter(Boolean).join(" · ") ||
                  "Staff"}
                {member.joinedAt ? ` · joined ${formatJoinedDate(member.joinedAt)}` : ""}
              </p>
            </div>
            {canRemove || canManageLead ? (
              <div className="flex shrink-0 flex-col items-end gap-1">
                {canManageLead ? (
                  <button
                    type="button"
                    onClick={() => onSetTeamLead?.(member, !isLead)}
                    disabled={leadingUserId === userKey}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-60"
                    aria-label={
                      isLead
                        ? `Remove ${member.name} as team lead`
                        : `Make ${member.name} team lead`
                    }
                  >
                    <Crown className="h-3.5 w-3.5" />
                    {leadingUserId === userKey
                      ? "Saving..."
                      : isLead
                        ? "Remove lead"
                        : "Make lead"}
                  </button>
                ) : null}
                {canRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove?.(member)}
                    disabled={removingUserId === userKey}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    aria-label={`Remove ${member.name} from group`}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    {removingUserId === userKey ? "Removing..." : "Remove"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {!members.length ? (
        <p className="text-sm text-slate-500">No members have joined yet.</p>
      ) : null}
    </div>
  </div>
);

const UpdatesFeed = ({ updates, emptyLabel }) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">
        <MessageSquareText className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">
          Progress updates
        </h2>
        <p className="text-sm text-slate-500">
          What group members have posted so far
        </p>
      </div>
    </div>

    <div className="mt-5 space-y-3">
      {updates.map((item) => {
        const statusText = receiptStatusLabel(item.receiptStatus);

        return (
          <article
            key={item._id}
            className="rounded-2xl border border-slate-100 px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-950">{item.authorName}</p>
              <p className="text-xs text-slate-500">
                {formatProgressTime(item.createdAt)}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {item.body}
            </p>
            {item.receiptUrl ? (
              <div className="mt-3 space-y-2">
                {statusText ? (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${receiptStatusClass(
                      item.receiptStatus
                    )}`}
                  >
                    {statusText}
                    {item.pointsAwarded ? ` · ${item.pointsAwarded} pts` : ""}
                  </span>
                ) : null}
                <a
                  href={item.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-xl border border-slate-100"
                >
                  <img
                    src={item.receiptUrl}
                    alt={`Payment receipt from ${item.authorName}`}
                    className="max-h-48 w-full object-contain bg-slate-50"
                  />
                </a>
                {item.accountReviewNote ? (
                  <p className="text-xs text-slate-500">
                    Account officer: {item.accountReviewNote}
                  </p>
                ) : null}
                {item.reviewNote ? (
                  <p className="text-xs text-slate-500">
                    HR note: {item.reviewNote}
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
      {!updates.length ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : null}
    </div>
  </div>
);

const AwaitingAccountOfficerPanel = ({ updates }) => {
  const pending = (updates || []).filter(
    (item) => item.receiptStatus === "pending" && item.receiptUrl
  );

  if (!pending.length) {
    return null;
  }

  return (
    <div className="rounded-[28px] border border-amber-200/80 bg-amber-50/40 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-800">
          <Receipt className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Waiting for account officer
          </h2>
          <p className="text-sm text-slate-600">
            These receipts are with the account officer. Points stay locked until they confirm.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {pending.map((item) => (
          <article
            key={item._id}
            className="rounded-2xl border border-amber-100 bg-white px-4 py-4"
          >
            <p className="text-sm font-semibold text-slate-950">{item.authorName}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

const AwardReceiptPointsPanel = ({ updates, reviewingId, onAward }) => {
  const ready = (updates || []).filter(
    (item) => item.receiptStatus === "accountApproved" && item.receiptUrl
  );
  const [pointsById, setPointsById] = useState({});
  const [noteById, setNoteById] = useState({});

  return (
    <div className="rounded-[28px] border border-emerald-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Award points on confirmed receipts
          </h2>
          <p className="text-sm text-slate-600">
            Points can be assigned only after an account officer confirms the receipt.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {ready.length ? (
          ready.map((item) => {
            const busy = reviewingId === String(item._id);
            const points = pointsById[item._id] ?? "";
            const note = noteById[item._id] ?? "";

            return (
              <article
                key={item._id}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {item.authorName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatProgressTime(item.createdAt)}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.body}
                </p>
                {item.accountReviewedByName ? (
                  <p className="mt-2 text-xs text-sky-800">
                    Confirmed by {item.accountReviewedByName}
                    {item.accountReviewNote ? ` · ${item.accountReviewNote}` : ""}
                  </p>
                ) : null}
                <a
                  href={item.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block overflow-hidden rounded-xl border border-slate-100 bg-white"
                >
                  <img
                    src={item.receiptUrl}
                    alt={`Payment receipt from ${item.authorName}`}
                    className="max-h-56 w-full object-contain bg-slate-50"
                  />
                </a>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.2fr]">
                  <div>
                    <label
                      className="text-xs font-medium text-slate-700"
                      htmlFor={`award-points-${item._id}`}
                    >
                      Points to award
                    </label>
                    <input
                      id={`award-points-${item._id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={points}
                      onChange={(event) =>
                        setPointsById((current) => ({
                          ...current,
                          [item._id]: event.target.value,
                        }))
                      }
                      placeholder="e.g. 50"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-medium text-slate-700"
                      htmlFor={`award-note-${item._id}`}
                    >
                      Note (optional)
                    </label>
                    <input
                      id={`award-note-${item._id}`}
                      type="text"
                      maxLength={500}
                      value={note}
                      onChange={(event) =>
                        setNoteById((current) => ({
                          ...current,
                          [item._id]: event.target.value,
                        }))
                      }
                      placeholder="Reason or comment"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={busy || !points}
                    onClick={() => onAward?.(item, points, note)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {busy ? "Saving..." : "Award points"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">
            No confirmed receipts are waiting for points in this group.
          </p>
        )}
      </div>
    </div>
  );
};

const StaffWorkspace = () => {
  const [workspace, setWorkspace] = useState({
    myGroup: null,
    groups: [],
  });
  const [selectedKey, setSelectedKey] = useState("");
  const [switchKey, setSwitchKey] = useState("");
  const [progressBody, setProgressBody] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptInputKey, setReceiptInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const myGroup = workspace.myGroup;

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPaWorkspace();
      setWorkspace(data);
      setSelectedKey((current) => {
        if (current || data.myGroup) {
          return current;
        }

        const openGroup = data.groups?.find((group) => !group.isFull);
        return openGroup?.key || data.groups?.[0]?.key || "";
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load Project ADVANCE data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!selectedKey) {
      return;
    }

    setJoining(true);
    setError("");
    setNotice("");

    try {
      const data = await joinPaGroup(selectedKey);
      setNotice(data.message);
      await loadWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Could not join that group.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!myGroup) {
      return;
    }

    const confirmed = window.confirm(
      `Leave ${myGroup.name}? You can join a different group afterward. Updates already posted stay with ${myGroup.name}.`
    );
    if (!confirmed) {
      return;
    }

    setLeaving(true);
    setError("");
    setNotice("");

    try {
      const data = await leavePaGroup();
      setSwitchKey("");
      setSelectedKey("");
      setNotice(data.message);
      await loadWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Could not leave that group.");
    } finally {
      setLeaving(false);
    }
  };

  const handleSwitch = async (event) => {
    event.preventDefault();
    if (!myGroup || !switchKey || switchKey === myGroup.key) {
      return;
    }

    const nextGroup = (workspace.groups || []).find(
      (group) => group.key === switchKey
    );
    const nextName = nextGroup?.name || `Group ${switchKey}`;
    const confirmed = window.confirm(
      `Leave ${myGroup.name} and join ${nextName}? Updates already posted stay with ${myGroup.name}.`
    );
    if (!confirmed) {
      return;
    }

    setSwitching(true);
    setError("");
    setNotice("");

    try {
      const data = await switchPaGroup(switchKey);
      setSwitchKey("");
      setNotice(data.message);
      await loadWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Could not move to that group.");
    } finally {
      setSwitching(false);
    }
  };

  const handlePost = async (event) => {
    event.preventDefault();
    if (!progressBody.trim()) {
      return;
    }

    setPosting(true);
    setError("");
    setNotice("");

    try {
      const data = await createPaProgress({
        body: progressBody.trim(),
        receiptFile,
      });
      setProgressBody("");
      setReceiptFile(null);
      setReceiptInputKey((value) => value + 1);
      setNotice(data.message || "Progress update posted.");
      await loadWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Could not post that update.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 text-center text-sm text-slate-500">
        Loading Project ADVANCE...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {!myGroup ? (
        <form
          onSubmit={handleJoin}
          className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] sm:p-8"
        >
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Choose your group
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Select which group you belong to. If you join the wrong group, you can
            leave it and join another.
          </p>

          <div className="mt-6 max-w-md">
            <label className="text-sm font-medium text-slate-700" htmlFor="groupKey">
              Group
            </label>
            <select
              id="groupKey"
              name="groupKey"
              required
              value={selectedKey}
              onChange={(event) => setSelectedKey(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select a group</option>
              {(workspace.groups || []).map((group) => (
                <option
                  key={group.key}
                  value={group.key}
                  disabled={group.isFull}
                >
                  {group.name}
                  {group.isFull ? " (full)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={joining || !selectedKey}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join group"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryCard
              label="Your group"
              value={myGroup.name}
              description="Leave this group if you joined by mistake"
            />
            <SummaryCard
              label="Group points"
              value={myGroup.totalPoints ?? 0}
              description="Awarded by HR"
            />
            <SummaryCard
              label="Updates posted"
              value={myGroup.updates?.length ?? 0}
              description="Shared with everyone in your group"
            />
          </div>

          <form
            onSubmit={handleSwitch}
            className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                <LogOut className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Joined the wrong group?
                </h2>
                <p className="text-sm text-slate-500">
                  Leave {myGroup.name} and join a different one. Updates already
                  posted stay with {myGroup.name}.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="switchGroupKey"
                >
                  Move to
                </label>
                <select
                  id="switchGroupKey"
                  name="switchGroupKey"
                  value={switchKey}
                  onChange={(event) => setSwitchKey(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select another group</option>
                  {(workspace.groups || [])
                    .filter((group) => group.key !== myGroup.key)
                    .map((group) => (
                      <option
                        key={group.key}
                        value={group.key}
                        disabled={group.isFull}
                      >
                        {group.name}
                        {group.isFull ? " (full)" : ""}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={
                  switching || leaving || !switchKey || switchKey === myGroup.key
                }
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {switching ? "Moving..." : "Leave and join"}
              </button>
              <button
                type="button"
                disabled={leaving || switching}
                onClick={handleLeave}
                className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
              >
                {leaving ? "Leaving..." : "Leave group"}
              </button>
            </div>
          </form>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <MembersList members={myGroup.members || []} />
              <PointsHistory
                awards={myGroup.pointAwards || []}
                emptyLabel="No points have been awarded to your group yet."
              />
            </div>

            <div className="space-y-6">
              <form
                onSubmit={handlePost}
                className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]"
              >
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Record your progress
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Post an update your group members can all see. Attach a payment
                  receipt when you have proof — HR will review it before awarding
                  points.
                </p>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={progressBody}
                  onChange={(event) => setProgressBody(event.target.value)}
                  placeholder="What have you made progress on so far?"
                  className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />

                <div className="mt-4">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="receiptFile"
                  >
                    Payment receipt (optional)
                  </label>
                  <input
                    key={receiptInputKey}
                    id="receiptFile"
                    name="receiptFile"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setReceiptFile(event.target.files?.[0] || null)
                    }
                    className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Upload a clear image of the receipt (max 5MB). With a receipt,
                    HR must approve before points are allocated.
                  </p>
                  {receiptFile ? (
                    <p className="mt-2 text-xs font-medium text-slate-700">
                      Selected: {receiptFile.name}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {progressBody.length}/2000
                  </p>
                  <button
                    type="submit"
                    disabled={posting || !progressBody.trim()}
                    className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                  >
                    {posting
                      ? "Posting..."
                      : receiptFile
                        ? "Post with receipt"
                        : "Post progress"}
                  </button>
                </div>
              </form>

              <UpdatesFeed
                updates={myGroup.updates || []}
                emptyLabel="No progress updates yet. Be the first to post."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const staffOptionLabel = (staff) =>
  [
    staff?.name,
    staff?.role ? formatRoleLabel(staff.role) : "",
    staff?.department,
  ]
    .filter(Boolean)
    .join(" · ");

const staffMatchesQuery = (staff, query) => {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  const haystack = [
    staff?.name,
    staff?.department,
    staff?.position,
    staff?.staffId,
    staff?.role ? formatRoleLabel(staff.role) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
};

const StaffSearchSelect = ({ id, staff, value, onChange, disabled }) => {
  const containerRef = useRef(null);
  const listboxId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = staff.find((item) => String(item._id) === String(value)) || null;

  useEffect(() => {
    if (open) {
      return;
    }

    setQuery(selected ? staffOptionLabel(selected) : "");
  }, [open, selected]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filteredStaff = useMemo(
    () => staff.filter((item) => staffMatchesQuery(item, query)),
    [staff, query]
  );

  const chooseStaff = (item) => {
    onChange(String(item._id));
    setQuery(staffOptionLabel(item));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative mt-1">
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={
            staff.length ? "Search or select a user" : "No unassigned users available"
          }
          value={query}
          onFocus={() => {
            if (disabled) {
              return;
            }
            setQuery("");
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) {
              onChange("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
            if (event.key === "Enter" && open && filteredStaff.length === 1) {
              event.preventDefault();
              chooseStaff(filteredStaff[0]);
            }
          }}
          className="w-full rounded-xl border border-slate-300 py-2.5 pr-10 pl-4 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
        />
        <button
          type="button"
          aria-label="Show staff list"
          disabled={disabled}
          onClick={() => {
            if (disabled) {
              return;
            }
            setOpen((current) => !current);
            if (!open) {
              setQuery("");
            }
          }}
          className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filteredStaff.length ? (
            filteredStaff.map((item) => (
              <li key={item._id} role="option" aria-selected={String(item._id) === String(value)}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseStaff(item)}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-950 hover:bg-violet-50"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-slate-500">
                    {item.role ? ` · ${formatRoleLabel(item.role)}` : ""}
                    {item.department ? ` · ${item.department}` : ""}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-2.5 text-sm text-slate-500">No matching users</li>
          )}
        </ul>
      ) : null}
    </div>
  );
};

const MonitorWorkspace = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [monitor, setMonitor] = useState({
    groups: [],
    selectedGroup: null,
    assignableStaff: [],
  });
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignAsLead, setAssignAsLead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removingUserId, setRemovingUserId] = useState("");
  const [leadingUserId, setLeadingUserId] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMonitor = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (selectedGroupId) {
        params.groupId = selectedGroupId;
      }

      const data = await getPaMonitor(params);
      setMonitor(data);

      if (!selectedGroupId && data.selectedGroup?._id) {
        setSelectedGroupId(data.selectedGroup._id);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load Project ADVANCE monitor."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    loadMonitor();
  }, [loadMonitor]);

  useEffect(() => {
    if (!assignGroupId && selectedGroupId) {
      setAssignGroupId(selectedGroupId);
    }
  }, [assignGroupId, selectedGroupId]);

  const handleAssignMember = async (event) => {
    event.preventDefault();
    if (!assignGroupId || !assignUserId) {
      return;
    }

    setAssigning(true);
    setError("");
    setNotice("");

    try {
      const data = await assignPaGroupMember(assignGroupId, {
        userId: assignUserId,
        isTeamLead: assignAsLead,
      });
      setAssignUserId("");
      setAssignAsLead(false);
      setNotice(data.message);
      if (assignGroupId !== selectedGroupId) {
        setSelectedGroupId(assignGroupId);
      } else {
        await loadMonitor();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not assign that staff member.");
    } finally {
      setAssigning(false);
    }
  };

  const handleSetTeamLead = async (member, makeLead) => {
    if (!selectedGroupId || !member?.user) {
      return;
    }

    setLeadingUserId(String(member.user));
    setError("");
    setNotice("");

    try {
      const data = await setPaGroupTeamLead(selectedGroupId, member.user, {
        isTeamLead: makeLead,
      });
      setNotice(data.message);
      await loadMonitor();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update team lead.");
    } finally {
      setLeadingUserId("");
    }
  };

  const handleRemoveMember = async (member) => {
    if (!selectedGroupId || !member?.user) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.name} from this group? They will be able to join another group.`
    );
    if (!confirmed) {
      return;
    }

    setRemovingUserId(String(member.user));
    setError("");
    setNotice("");

    try {
      const data = await removePaGroupMember(selectedGroupId, member.user);
      setNotice(data.message);
      await loadMonitor();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove that staff member.");
    } finally {
      setRemovingUserId("");
    }
  };

  const handleAwardReceiptPoints = async (item, pointsValue, note) => {
    const points = Number(pointsValue);
    if (!item?._id || !Number.isFinite(points) || points <= 0) {
      setError("Enter points greater than zero for this confirmed receipt.");
      return;
    }

    setReviewingId(String(item._id));
    setError("");
    setNotice("");

    try {
      const data = await awardPaReceiptPoints(item._id, {
        points,
        note: String(note || "").trim(),
      });
      setNotice(data.message);
      await loadMonitor();
    } catch (err) {
      setError(err.response?.data?.message || "Could not award points for that receipt.");
    } finally {
      setReviewingId("");
    }
  };

  const selected = monitor.selectedGroup;
  const assignableStaff = monitor.assignableStaff || [];
  const groups = monitor.groups || [];
  const maxMembers = monitor.maxMembers || 6;
  const assignGroup =
    groups.find((group) => group._id === assignGroupId) || null;
  const assignGroupIsFull =
    Boolean(assignGroup) && (assignGroup.headcount || 0) >= maxMembers;

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 text-center text-sm text-slate-500">
        Loading group monitor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(monitor.groups || []).map((group) => (
          <button
            key={group._id}
            type="button"
            onClick={() => setSelectedGroupId(group._id)}
            className={`rounded-[24px] border p-4 text-left transition ${
              selectedGroupId === group._id
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-950 hover:border-slate-300"
            }`}
          >
            <p className="text-sm font-bold">{group.name}</p>
            <p
              className={`mt-3 text-2xl font-bold ${
                selectedGroupId === group._id ? "text-white" : "text-slate-950"
              }`}
            >
              {group.totalPoints ?? 0}
            </p>
            <p
              className={`mt-1 text-xs ${
                selectedGroupId === group._id ? "text-slate-300" : "text-slate-500"
              }`}
            >
              pts · {group.headcount} staff · {group.updateCount} update
              {group.updateCount === 1 ? "" : "s"}
              {group.pendingReceiptCount
                ? ` · ${group.pendingReceiptCount} with account officer`
                : ""}
              {group.awaitingPointsCount
                ? ` · ${group.awaitingPointsCount} ready for points`
                : ""}
            </p>
            {group.teamLeadName ? (
              <p
                className={`mt-2 text-xs ${
                  selectedGroupId === group._id ? "text-amber-200" : "text-amber-700"
                }`}
              >
                Lead: {group.teamLeadName}
              </p>
            ) : null}
          </button>
        ))}
      </div>

      {selected ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <MembersList
              members={selected.members || []}
              canRemove={isAdmin}
              canManageLead
              removingUserId={removingUserId}
              leadingUserId={leadingUserId}
              onRemove={handleRemoveMember}
              onSetTeamLead={handleSetTeamLead}
            />
            <PointsHistory
              awards={selected.pointAwards || []}
              emptyLabel="No points awarded to this group yet."
            />
          </div>

          <div className="space-y-6">
            <AwaitingAccountOfficerPanel updates={selected.updates || []} />
            <AwardReceiptPointsPanel
              updates={selected.updates || []}
              reviewingId={reviewingId}
              onAward={handleAwardReceiptPoints}
            />

            <form
              onSubmit={handleAssignMember}
              className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                  <UserPlus className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    Assign staff to a group
                  </h2>
                  <p className="text-sm text-slate-500">
                    Choose a person, then choose their group. Any registered user who is not already in a group can be assigned, including admin and HR.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="assignUserId"
                  >
                    Staff member
                  </label>
                  <StaffSearchSelect
                    id="assignUserId"
                    staff={assignableStaff}
                    value={assignUserId}
                    onChange={setAssignUserId}
                    disabled={!assignableStaff.length}
                  />
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="assignGroupId"
                  >
                    Group
                  </label>
                  <select
                    id="assignGroupId"
                    name="assignGroupId"
                    required
                    value={assignGroupId}
                    onChange={(event) => setAssignGroupId(event.target.value)}
                    disabled={!groups.length}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  >
                    <option value="">Select a group</option>
                    {groups.map((group) => {
                      const isFull = (group.headcount || 0) >= maxMembers;
                      return (
                        <option key={group._id} value={group._id} disabled={isFull}>
                          {group.name}
                          {isFull
                            ? " (full)"
                            : ` (${group.headcount || 0}/${maxMembers})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={assignAsLead}
                    onChange={(event) => setAssignAsLead(event.target.checked)}
                    disabled={!assignGroup || assignGroupIsFull}
                    className="h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-200"
                  />
                  Make this person the team lead
                  {assignGroup ? ` for ${assignGroup.name}` : ""}
                </label>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    assigning ||
                    !assignUserId ||
                    !assignGroupId ||
                    assignGroupIsFull ||
                    !assignableStaff.length
                  }
                  className="rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60"
                >
                  {assigning ? "Assigning..." : "Assign to group"}
                </button>
              </div>
            </form>

            <UpdatesFeed
              updates={selected.updates || []}
              emptyLabel="No progress updates posted in this group yet."
            />
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 text-sm text-slate-600">
          Select a group to review its members, assign staff, and award points on confirmed receipts.
        </div>
      )}
    </div>
  );
};

const ProjectAdvancePage = () => {
  const { user } = useAuth();
  const isMonitor = user?.role === "hr" || user?.role === "admin";
  const [view, setView] = useState(isMonitor ? "monitor" : "my");

  useEffect(() => {
    setView(isMonitor ? "monitor" : "my");
  }, [isMonitor]);

  const content = (
    <>
      <p className="-mt-4 mb-8 max-w-3xl text-sm leading-6 text-slate-600 sm:-mt-6">
        Everyone Sells. Everyone Grows. Join one Project ADVANCE group, see your
        teammates, and share progress updates together.
        {isMonitor
          ? " HR and admin assign staff and award points only after an account officer confirms the receipt."
          : " Attach a payment receipt with your progress. An account officer confirms it before HR can award points."}
      </p>

      {isMonitor ? (
        <div className="mb-6 flex gap-2">
          {[
            { id: "monitor", label: "Monitor groups" },
            { id: "my", label: "My group" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                view === item.id
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {view === "monitor" && isMonitor ? <MonitorWorkspace /> : <StaffWorkspace />}
    </>
  );

  if (isMonitor) {
    return <PanelLayout title="Project ADVANCE">{content}</PanelLayout>;
  }

  return <DashboardLayout title="Project ADVANCE">{content}</DashboardLayout>;
};

export default ProjectAdvancePage;
