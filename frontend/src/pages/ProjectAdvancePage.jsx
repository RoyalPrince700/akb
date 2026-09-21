import { useCallback, useEffect, useState } from "react";
import { MessageSquareText, Trophy, UserMinus, Users } from "lucide-react";

import {
  formatJoinedDate,
  formatProgressTime,
} from "../constants/projectAdvance";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import PanelLayout from "../layouts/PanelLayout";
import {
  awardPaGroupPoints,
  createPaProgress,
  getPaMonitor,
  getPaWorkspace,
  joinPaGroup,
  removePaGroupMember,
} from "../services/api";

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

const MembersList = ({ members, canRemove = false, removingUserId = "", onRemove }) => (
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
      {members.map((member) => (
        <div
          key={String(member.user)}
          className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">{member.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {[member.position, member.department].filter(Boolean).join(" · ") ||
                "Staff"}
              {member.joinedAt ? ` · joined ${formatJoinedDate(member.joinedAt)}` : ""}
            </p>
          </div>
          {canRemove ? (
            <button
              type="button"
              onClick={() => onRemove?.(member)}
              disabled={removingUserId === String(member.user)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
              aria-label={`Remove ${member.name} from group`}
            >
              <UserMinus className="h-3.5 w-3.5" />
              {removingUserId === String(member.user) ? "Removing..." : "Remove"}
            </button>
          ) : null}
        </div>
      ))}
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
      {updates.map((item) => (
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
        </article>
      ))}
      {!updates.length ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : null}
    </div>
  </div>
);

const StaffWorkspace = () => {
  const [workspace, setWorkspace] = useState({
    myGroup: null,
    groups: [],
  });
  const [selectedKey, setSelectedKey] = useState("");
  const [progressBody, setProgressBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  const handlePost = async (event) => {
    event.preventDefault();
    if (!progressBody.trim()) {
      return;
    }

    setPosting(true);
    setError("");
    setNotice("");

    try {
      await createPaProgress(progressBody.trim());
      setProgressBody("");
      setNotice("Progress update posted.");
      await loadWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Could not post that update.");
    } finally {
      setPosting(false);
    }
  };

  const myGroup = workspace.myGroup;

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
            Select which group you belong to. Once you join, you cannot switch to
            another group.
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
              description="You can only belong to this group"
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
                  Post an update your group members can all see.
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
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {progressBody.length}/2000
                  </p>
                  <button
                    type="submit"
                    disabled={posting || !progressBody.trim()}
                    className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                  >
                    {posting ? "Posting..." : "Post progress"}
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

const MonitorWorkspace = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [monitor, setMonitor] = useState({
    groups: [],
    selectedGroup: null,
  });
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [pointsValue, setPointsValue] = useState("");
  const [pointsNote, setPointsNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [awarding, setAwarding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState("");
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

  const handleAwardPoints = async (event) => {
    event.preventDefault();
    if (!selectedGroupId || !pointsValue) {
      return;
    }

    const points = Number(pointsValue);
    if (!isAdmin && points < 0) {
      setError("Only an administrator can reduce group points.");
      return;
    }

    setAwarding(true);
    setError("");
    setNotice("");

    try {
      const data = await awardPaGroupPoints({
        groupId: selectedGroupId,
        points,
        note: pointsNote.trim(),
      });
      setPointsValue("");
      setPointsNote("");
      setNotice(data.message);
      await loadMonitor();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update points.");
    } finally {
      setAwarding(false);
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

  const selected = monitor.selectedGroup;

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
            </p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <MembersList
              members={selected.members || []}
              canRemove={isAdmin}
              removingUserId={removingUserId}
              onRemove={handleRemoveMember}
            />
            <PointsHistory
              awards={selected.pointAwards || []}
              emptyLabel="No points awarded to this group yet."
            />
          </div>

          <div className="space-y-6">
            <form
              onSubmit={handleAwardPoints}
              className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    {isAdmin
                      ? `Update points for ${selected.name}`
                      : `Award points to ${selected.name}`}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Current total: {selected.totalPoints ?? 0} points
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="pointsValue"
                  >
                    Points
                  </label>
                  <input
                    id="pointsValue"
                    name="pointsValue"
                    type="number"
                    required
                    step="1"
                    min={isAdmin ? undefined : "1"}
                    value={pointsValue}
                    onChange={(event) => setPointsValue(event.target.value)}
                    placeholder={isAdmin ? "e.g. 50 or -10" : "e.g. 50"}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {isAdmin
                      ? "Admin can increase or reduce points to correct mistakes."
                      : "HR can award points only. Ask an admin to reduce points if needed."}
                  </p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="pointsNote"
                  >
                    Reason / note
                  </label>
                  <textarea
                    id="pointsNote"
                    name="pointsNote"
                    rows={3}
                    maxLength={500}
                    value={pointsNote}
                    onChange={(event) => setPointsNote(event.target.value)}
                    placeholder="Optional note for this change"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={awarding || !pointsValue}
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {awarding
                    ? "Saving..."
                    : isAdmin
                      ? "Update points"
                      : "Award points"}
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
          Select a group to review its members, updates, and award points.
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
