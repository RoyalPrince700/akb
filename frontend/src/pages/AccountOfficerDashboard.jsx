import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Receipt, XCircle } from "lucide-react";

import { formatProgressTime } from "../constants/projectAdvance";
import PanelLayout from "../layouts/PanelLayout";
import { getPaReceiptDesk, reviewPaProgressReceipt } from "../services/api";

const statusLabel = (status) => {
  switch (status) {
    case "pending":
      return "Awaiting your confirmation";
    case "accountApproved":
      return "Confirmed · waiting for HR points";
    case "approved":
      return "HR awarded points";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
};

const AccountOfficerDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");
  const [noteById, setNoteById] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDesk = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPaReceiptDesk();
      const nextGroups = data.groups || [];
      setGroups(nextGroups);
      setSelectedGroupId((current) => {
        if (current && nextGroups.some((group) => group._id === current)) {
          return current;
        }
        const withPending = nextGroups.find((group) => group.pendingCount > 0);
        return withPending?._id || nextGroups[0]?._id || "";
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not load receipts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesk();
  }, [loadDesk]);

  const selected = groups.find((group) => group._id === selectedGroupId) || null;
  const pending = (selected?.receipts || []).filter(
    (item) => item.receiptStatus === "pending"
  );
  const decided = (selected?.receipts || []).filter(
    (item) => item.receiptStatus !== "pending"
  );

  const reviewReceipt = async (item, action) => {
    if (!item?._id) {
      return;
    }

    if (action === "reject") {
      const confirmed = window.confirm(
        `Reject the receipt from ${item.authorName}? HR will not be able to award points for it.`
      );
      if (!confirmed) {
        return;
      }
    }

    setReviewingId(String(item._id));
    setError("");
    setNotice("");

    try {
      const data = await reviewPaProgressReceipt(item._id, {
        action,
        note: String(noteById[item._id] || "").trim(),
      });
      setNotice(data.message);
      await loadDesk();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (action === "reject"
            ? "Could not reject that receipt."
            : "Could not confirm that receipt.")
      );
    } finally {
      setReviewingId("");
    }
  };

  return (
    <PanelLayout title="Account Officer">
      <p className="-mt-4 mb-8 max-w-3xl text-sm leading-6 text-slate-600 sm:-mt-6">
        Groups post progress with a receipt. Confirm the receipt here. After you
        approve it, HR can assign points. Points cannot be awarded before your
        confirmation.
      </p>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 text-center text-sm text-slate-500">
          Loading receipts...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {groups.map((group) => (
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
                <p className="mt-3 text-2xl font-bold">{group.pendingCount || 0}</p>
                <p
                  className={`mt-1 text-xs ${
                    selectedGroupId === group._id ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  receipt{group.pendingCount === 1 ? "" : "s"} waiting ·{" "}
                  {group.headcount} staff
                </p>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-800">
                    <Receipt className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-950">
                      {selected.name} receipts
                    </h2>
                    <p className="text-sm text-slate-500">
                      Confirm or reject each receipt. This does not award points.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {pending.length ? (
                    pending.map((item) => {
                      const busy = reviewingId === String(item._id);
                      const note = noteById[item._id] ?? "";

                      return (
                        <article
                          key={item._id}
                          className="rounded-2xl border border-slate-100 px-4 py-4"
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
                          <a
                            href={item.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 block overflow-hidden rounded-xl border border-slate-100"
                          >
                            <img
                              src={item.receiptUrl}
                              alt={`Payment receipt from ${item.authorName}`}
                              className="max-h-64 w-full object-contain bg-slate-50"
                            />
                          </a>
                          <label
                            className="mt-4 block text-xs font-medium text-slate-700"
                            htmlFor={`account-note-${item._id}`}
                          >
                            Note (optional)
                          </label>
                          <input
                            id={`account-note-${item._id}`}
                            type="text"
                            maxLength={500}
                            value={note}
                            onChange={(event) =>
                              setNoteById((current) => ({
                                ...current,
                                [item._id]: event.target.value,
                              }))
                            }
                            placeholder="Comment for HR or the group"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                          />
                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => reviewReceipt(item, "reject")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              {busy ? "Working..." : "Reject"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => reviewReceipt(item, "approve")}
                              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {busy ? "Working..." : "Confirm receipt"}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      No receipts are waiting in {selected.name}.
                    </p>
                  )}
                </div>
              </section>

              {decided.length ? (
                <section className="rounded-[28px] border border-slate-200/70 bg-white p-6">
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    Already reviewed
                  </h2>
                  <div className="mt-4 space-y-3">
                    {decided.map((item) => (
                      <article
                        key={item._id}
                        className="rounded-2xl border border-slate-100 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-950">
                            {item.authorName}
                          </p>
                          <p className="text-xs font-medium text-slate-500">
                            {statusLabel(item.receiptStatus)}
                            {item.pointsAwarded ? ` · ${item.pointsAwarded} pts` : ""}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{item.body}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 text-sm text-slate-600">
              No Project ADVANCE groups are available yet.
            </div>
          )}
        </div>
      )}
    </PanelLayout>
  );
};

export default AccountOfficerDashboard;
