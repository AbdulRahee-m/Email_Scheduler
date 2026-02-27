import { useState } from "react";
import { useInView } from "../hooks/useInView";

const API_URL = import.meta.env.VITE_API_URL || "";

const emptyForm = {
  senderName: "",
  senderEmail: "",
  recipientName: "",
  recipientEmail: "",
  topic: "",
  scheduledAt: "",
};

/* ── little helpers ──────────────────────────────────────── */
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function minDateTimeLocal() {
  const d = new Date(Date.now() + 5 * 60_000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

const statusColor = {
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  scheduled: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  sent:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  failed:    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

/* ════════════════════════════════════════════════════════════ */
export default function Scheduler() {
  const { ref, isInView } = useInView();

  const [form, setForm] = useState(emptyForm);
  const [emailList, setEmailList] = useState([]);
  const [toast, setToast] = useState({ type: "", msg: "" });
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  /* ── handlers ─────────────────────────────────────────── */
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  function showToast(type, msg) {
    setToast({ type, msg });
    if (type !== "info") setTimeout(() => setToast({ type: "", msg: "" }), 6000);
  }

  function validate(needTime) {
    const { senderName, senderEmail, recipientName, recipientEmail, topic, scheduledAt } = form;

    if (!senderName.trim() || !senderEmail.trim() || !recipientName.trim() ||
        !recipientEmail.trim() || !topic.trim()) {
      showToast("error", "All fields are required.");
      return false;
    }
    if (!emailRx.test(senderEmail)) {
      showToast("error", "Sender email is invalid.");
      return false;
    }
    if (!emailRx.test(recipientEmail)) {
      showToast("error", "Recipient email is invalid.");
      return false;
    }
    if (needTime) {
      if (!scheduledAt) {
        showToast("error", "Please pick a scheduled date & time.");
        return false;
      }
      if (new Date(scheduledAt) <= new Date()) {
        showToast("error", "Scheduled time must be in the future.");
        return false;
      }
    }
    return true;
  }

  /* ── Send Now ─────────────────────────────────────────── */
  async function handleSendNow() {
    if (!validate(false)) return;
    setSending(true);
    showToast("info", "AI is generating the email body & sending…");

    try {
      const res = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `Email sent successfully. ID: ${data.messageId}`);
        setForm(emptyForm);
      } else {
        showToast("error", data.errors?.join(", ") || data.error || "Send failed.");
      }
    } catch (err) {
      showToast("error", "Network error: " + err.message);
    }
    setSending(false);
  }

  /* ── Add to List ──────────────────────────────────────── */
  function handleAddToList() {
    if (!validate(true)) return;
    setEmailList((prev) => [
      ...prev,
      { ...form, localId: Date.now() + Math.random(), status: "pending" },
    ]);
    showToast("success", "Added to schedule list.");
    // keep sender info, clear rest
    setForm((p) => ({
      ...p,
      recipientName: "",
      recipientEmail: "",
      topic: "",
      scheduledAt: "",
    }));
  }

  /* ── Remove from List ─────────────────────────────────── */
  function handleRemove(localId) {
    setEmailList((prev) => prev.filter((e) => e.localId !== localId));
  }

  /* ── Confirm & Schedule All ───────────────────────────── */
  async function handleConfirmSchedule() {
    const pending = emailList.filter((e) => e.status === "pending");
    if (!pending.length) return;

    setScheduling(true);
    showToast("info", "Scheduling emails…");

    try {
      const res = await fetch(`${API_URL}/api/schedule-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: pending }),
      });
      const data = await res.json();

      if (data.scheduled?.length) {
        const ok = new Set(data.scheduled.map((s) => s.recipientEmail));
        setEmailList((prev) =>
          prev.map((e) =>
            ok.has(e.recipientEmail) && e.status === "pending"
              ? { ...e, status: "scheduled" }
              : e
          )
        );
      }

      if (data.errors?.length) {
        const failedSet = new Set(data.errors.map((e) => e.recipientEmail));
        setEmailList((prev) =>
          prev.map((e) =>
            failedSet.has(e.recipientEmail) && e.status === "pending"
              ? { ...e, status: "failed" }
              : e
          )
        );
        showToast(
          data.scheduled?.length ? "success" : "error",
          data.scheduled?.length
            ? `Scheduled ${data.scheduled.length}, ${data.errors.length} failed.`
            : data.errors.map((e) => e.errors.join(", ")).join("; ")
        );
      } else {
        showToast("success", `${data.scheduled.length} email(s) scheduled successfully.`);
      }
    } catch (err) {
      showToast("error", "Network error: " + err.message);
    }
    setScheduling(false);
  }

  const pendingCount = emailList.filter((e) => e.status === "pending").length;

  /* ── field config (keeps template DRY) ─────────────────── */
  const fields = [
    { name: "senderName",     label: "Sender Name",     type: "text",  half: true },
    { name: "senderEmail",    label: "Sender Email",    type: "email", half: true },
    { name: "recipientName",  label: "Recipient Name",  type: "text",  half: true },
    { name: "recipientEmail", label: "Recipient Email", type: "email", half: true },
    { name: "topic",          label: "Topic",           type: "text" },
    { name: "scheduledAt",    label: "Scheduled Date & Time", type: "datetime-local" },
  ];

  /* ── render ────────────────────────────────────────────── */
  return (
    <section id="scheduler" className="relative py-16 px-4 sm:px-6">
      <div ref={ref} className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-10 transition-all duration-600 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-xs font-medium tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2">
            Core Feature
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Email Scheduler
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Compose, queue and schedule your emails with precision.
          </p>
        </div>

        {/* Explanation card */}
        <div
          className={`mb-6 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 p-4 text-sm text-slate-600 dark:text-slate-400 transition-all duration-600 delay-150 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">How it works</p>
          <ul className="space-y-1 list-disc list-inside marker:text-slate-300 dark:marker:text-slate-600">
            <li><strong>Sender Name</strong> appears as the display name on the email.</li>
            <li><strong>Sender Email</strong> is set as the Reply-To address so recipients can respond directly.</li>
            <li><strong>Topic</strong> is used by the AI model to generate the full email subject and body automatically.</li>
          </ul>
        </div>

        {/* Card */}
        <div
          className={`glass-strong rounded-lg p-5 sm:p-6 transition-all duration-600 delay-200 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* ── Form ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 mb-4">
            {fields.map((f) => (
              <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={set}
                  min={f.type === "datetime-local" ? minDateTimeLocal() : undefined}
                  className="w-full px-3 py-2 rounded-md text-sm
                             bg-white dark:bg-slate-800/60
                             border border-slate-200 dark:border-slate-700
                             focus:border-slate-400 dark:focus:border-slate-500
                             focus:ring-2 focus:ring-slate-400/20
                             outline-none transition-all duration-200
                             text-slate-900 dark:text-white"
                />
              </div>
            ))}

            {/* AI body notice */}
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                The email body is generated automatically by AI based on the topic and recipient details.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <button
              onClick={handleSendNow}
              disabled={sending}
              className="flex-1 py-2.5 rounded-md font-medium text-sm
                         bg-slate-900 dark:bg-white text-white dark:text-slate-900
                         hover:bg-slate-800 dark:hover:bg-slate-100
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200"
            >
              {sending ? "Sending…" : "Send Now"}
            </button>
            <button
              onClick={handleAddToList}
              className="flex-1 py-2.5 rounded-md font-medium text-sm
                         text-slate-700 dark:text-slate-300
                         border border-slate-200 dark:border-slate-700
                         hover:bg-slate-50 dark:hover:bg-slate-800/60
                         transition-colors duration-200"
            >
              Add to List
            </button>
          </div>

          {/* Toast */}
          {toast.msg && (
            <div
              className={`mt-4 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                toast.type === "success"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : toast.type === "error"
                  ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              }`}
            >
              {toast.msg}
            </div>
          )}
        </div>

        {/* ── Schedule List Table ─────────────────────────── */}
        {emailList.length > 0 && (
          <div className="mt-6 glass-strong rounded-lg p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Schedule Queue
                <span className="ml-2 text-sm font-medium text-slate-400">
                  ({pendingCount} pending)
                </span>
              </h3>
            </div>

            {/* Responsive table wrapper */}
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700/50">
                    <th className="pb-3 px-2">Sender</th>
                    <th className="pb-3 px-2">Recipient</th>
                    <th className="pb-3 px-2">Topic</th>
                    <th className="pb-3 px-2">Scheduled</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {emailList.map((e) => (
                    <tr
                      key={e.localId}
                      className="hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-colors"
                    >
                      <td className="py-3 px-2 whitespace-nowrap">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{e.senderName}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{e.recipientName}</p>
                        <p className="text-xs text-slate-400">{e.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-2 max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                        {e.topic}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(e.scheduledAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            statusColor[e.status] || ""
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {e.status === "pending" && (
                          <button
                            onClick={() => handleRemove(e.localId)}
                            className="text-red-400 hover:text-red-500 text-xs font-semibold transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Confirm button */}
            {pendingCount > 0 && (
              <button
                onClick={handleConfirmSchedule}
                disabled={scheduling}
                className="mt-5 w-full py-2.5 rounded-md font-medium text-sm
                           bg-emerald-600 text-white hover:bg-emerald-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors duration-200"
              >
                {scheduling
                  ? "Scheduling…"
                  : `Confirm & Schedule All (${pendingCount})`}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
