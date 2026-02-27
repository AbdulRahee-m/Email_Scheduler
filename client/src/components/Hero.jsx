import { useInView } from "../hooks/useInView";

export default function Hero() {
  const { ref, isInView } = useInView();

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-[85vh] flex items-center justify-center pt-14"
    >
      {/* Subtle background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-slate-200/40 dark:bg-slate-800/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100/50 dark:bg-slate-800/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full
                      bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                      text-slate-600 dark:text-slate-400 text-xs font-medium tracking-wide uppercase
                      transition-all duration-600 ${
                        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Email Automation Platform
        </div>

        {/* Heading */}
        <h1
          className={`text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-5 text-slate-900 dark:text-white
                      transition-all duration-600 delay-100 ${
                        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
        >
          Schedule and send professional
          <br />
          emails with precision
        </h1>

        {/* Subtext */}
        <p
          className={`max-w-xl mx-auto text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed
                      transition-all duration-600 delay-200 ${
                        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
        >
          Compose emails instantly or schedule them for the right moment.
          AI-generated content, precise timing, no account required.
        </p>

        {/* CTA buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-3
                      transition-all duration-600 delay-300 ${
                        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
        >
          <a
            href="#scheduler"
            className="px-6 py-2.5 rounded-lg text-sm text-white font-medium
                       bg-slate-900 dark:bg-white dark:text-slate-900
                       hover:bg-slate-800 dark:hover:bg-slate-100
                       transition-colors duration-200"
          >
            Start scheduling
          </a>
          <a
            href="#dashboard"
            className="px-6 py-2.5 rounded-lg text-sm font-medium
                       text-slate-600 dark:text-slate-300
                       border border-slate-200 dark:border-slate-700
                       hover:bg-slate-50 dark:hover:bg-slate-800/60
                       transition-colors duration-200"
          >
            View dashboard
          </a>
        </div>

        {/* Feature list */}
        <div
          className={`flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10 text-xs text-slate-400 dark:text-slate-500
                      transition-all duration-600 delay-[400ms] ${
                        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
        >
          {["Instant delivery", "Precise scheduling", "AI-generated content", "Live analytics"].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
