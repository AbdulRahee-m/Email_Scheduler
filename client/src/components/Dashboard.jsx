import { useState, useEffect } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { useInView } from "../hooks/useInView";

const API_URL = import.meta.env.VITE_API_URL || "";

function StatCard({ icon, label, value, description }) {
  const { count, ref } = useCountUp(value, 1800);

  return (
    <div
      ref={ref}
      className="glass rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {icon}
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        {count.toLocaleString()}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { ref, isInView } = useInView();
  const [stats, setStats] = useState({
    totalSent: 0,
    totalScheduled: 0,
    sentToday: 0,
    totalUsers: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("[Dashboard] Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 15_000);
    return () => clearInterval(timer);
  }, []);

  const cards = [
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
      label: "Emails Sent",
      value: stats.totalSent,
      description: "Total emails successfully delivered through the platform",
    },
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      label: "Scheduled",
      value: stats.totalScheduled,
      description: "Emails currently queued and awaiting delivery",
    },
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
      label: "Users",
      value: stats.totalUsers,
      description: "Unique senders who have used the platform",
    },
    {
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
      label: "Sent Today",
      value: stats.sentToday,
      description: "Emails delivered in the current 24-hour period",
    },
  ];

  return (
    <section id="dashboard" className="relative py-16 px-4 sm:px-6">
      <div ref={ref} className="max-w-5xl mx-auto">
        {/* Section header */}
        <div
          className={`text-center mb-10 transition-all duration-600 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-xs font-medium tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2">
            Analytics
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Live Dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Real-time statistics about your email operations.
          </p>
        </div>

        {/* Cards grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                      transition-all duration-600 delay-200 ${
                        isInView
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
        >
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
