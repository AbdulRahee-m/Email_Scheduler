import { useInView } from "../hooks/useInView";

export default function Contact() {
  const { ref, isInView } = useInView();

  return (
    <section id="contact" className="relative py-16 px-4 sm:px-6">
      <div ref={ref} className="max-w-3xl mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-8 transition-all duration-500 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-xs font-medium tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2">
            Get In Touch
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Contact Us
          </h2>
        </div>

        {/* Card */}
        <div
          className={`glass-strong rounded-xl p-6 sm:p-8 transition-all duration-500 delay-200 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Contact items */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-center">
            {/* WhatsApp */}
            <a
              href="https://wa.me/0769634145"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              <span className="text-sm font-medium">0769634145</span>
            </a>

            <span className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700" />

            {/* Email */}
            <a
              href="mailto:abdulrahimpsn@gmail.com"
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <span className="text-sm font-medium">abdulrahimpsn@gmail.com</span>
            </a>
          </div>

          {/* Support note */}
          <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
            24/7 support available for all users.
          </p>
        </div>
      </div>
    </section>
  );
}