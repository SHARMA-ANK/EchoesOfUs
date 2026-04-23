"use client";

import Link from "next/link";

export default function InterviewSuccessPage() {
    return (
        <div className="film-grain vignette relative min-h-screen flex flex-col items-center justify-center bg-[#1A1612] px-6 text-center">
            <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,168,83,0.07) 0%, transparent 70%)" }} />

            <div className="relative z-10 max-w-md space-y-8">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto rounded-full bg-[#D4A853]/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#D4A853]">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl italic text-[#F5ECD7]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                        Your story is saved.
                    </h1>
                    <p className="text-[#F5ECD7]/60 text-lg leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
                        Thank you for sharing your memories. Your chapter has been recorded and will be preserved forever.
                    </p>
                </div>

                <div className="w-20 h-px bg-[#D4A853]/30 mx-auto" />

                <p className="text-[#F5ECD7]/40 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                    You can close this window, or use the same link to record another chapter.
                </p>

                <Link
                    href="/"
                    className="inline-block text-[#D4A853] hover:text-[#C8922A] text-sm uppercase tracking-widest transition-colors duration-300"
                    style={{ fontFamily: "var(--font-inter)" }}
                >
                    Visit The Human Archive →
                </Link>
            </div>
        </div>
    );
}
