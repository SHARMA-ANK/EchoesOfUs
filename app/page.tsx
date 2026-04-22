"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Chapter { id: string; title: string; audioUrl: string | null; }
interface Profile { id: string; name: string; age: number; relation: string | null; shareSlug: string; chapters: Chapter[]; }
interface Family { id: string; familyName: string; profiles: Profile[]; }

export default function HomePage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Check session (non-blocking — just for nav)
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        setIsLoggedIn(!!session?.userId);

        // Fetch only published families for the public archive
        const res = await fetch("/api/human-archive");
        if (res.ok) setFamilies(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const totalProfiles = families.reduce((sum, f) => sum + f.profiles.length, 0);

  return (
    <div className="film-grain vignette relative min-h-screen bg-[#1A1612] overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,168,83,0.07) 0%, transparent 70%)" }} />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D4A853]/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#D4A853]">
              <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
            </svg>
          </div>
          <span className="text-[#D4A853] text-xl italic tracking-tight" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            Echoes of Us
          </span>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-6 py-2 rounded-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold text-xs uppercase tracking-widest transition-all duration-300"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              My Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-5 py-2 rounded-full text-[#F5ECD7]/70 hover:text-[#D4A853] text-xs uppercase tracking-widest transition-all duration-300"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 rounded-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold text-xs uppercase tracking-widest transition-all duration-300"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Start Your Archive
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Hero */}
        <section className="text-center mb-16">
          <p className="text-[#D4A853]/70 text-xs uppercase tracking-[0.3em] mb-6" style={{ fontFamily: "var(--font-inter)" }}>
            The Human Archive
          </p>
          <h1 className="text-5xl md:text-7xl text-[#F5ECD7] leading-tight tracking-tight mb-6" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            Every voice deserves
            <br />
            <span className="italic">to be remembered.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#F5ECD7]/60 font-light max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
            A living collection of stories, memories, and legacies — preserved forever in the voices of those who lived them.
          </p>
          {!isLoggedIn && (
            <div className="mt-8">
              <Link
                href="/auth/register"
                className="inline-block px-10 py-4 rounded-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold text-sm uppercase tracking-widest transition-all duration-300"
                style={{ fontFamily: "var(--font-inter)", boxShadow: "0 0 30px rgba(212,168,83,0.25)" }}
              >
                Preserve Your Family's Story
              </Link>
            </div>
          )}
        </section>

        {/* Archive */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl text-[#F5ECD7] tracking-tight" style={{ fontFamily: "var(--font-eb-garamond)" }}>
              Published Stories
            </h2>
            {!isLoading && (
              <span className="text-[#F5ECD7]/40 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                {totalProfiles} {totalProfiles === 1 ? "storyteller" : "storytellers"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="text-[#D4A853] text-xl" style={{ fontFamily: "var(--font-eb-garamond)" }}>Loading...</div>
            </div>
          ) : families.length === 0 ? (
            <div className="rounded-3xl p-16 text-center" style={{ background: "rgba(34, 30, 25, 0.5)", backdropFilter: "blur(16px)" }}>
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#D4A853]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#D4A853]">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl text-[#F5ECD7] italic" style={{ fontFamily: "var(--font-eb-garamond)" }}>No stories published yet</h3>
                <p className="text-[#F5ECD7]/60 text-base leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
                  Be the first to share your family's legacy with the world.
                </p>
                <Link href="/auth/register" className="inline-block px-8 py-3 rounded-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold text-sm uppercase tracking-widest transition-all duration-300" style={{ fontFamily: "var(--font-inter)" }}>
                  Create Your Archive
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {families.map((family) => (
                <div key={family.id}>
                  <h3 className="text-xl text-[#F5ECD7]/50 italic mb-4 pl-1" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                    {family.familyName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {family.profiles.map((profile) => (
                      <Link
                        key={profile.id}
                        href={`/book/${profile.shareSlug}`}
                        className="group rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02]"
                        style={{ background: "rgba(34, 30, 25, 0.7)", backdropFilter: "blur(16px)", boxShadow: "0 0 20px rgba(212, 168, 83, 0.08)" }}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-[#D4A853]/20 flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-[#D4A853]">
                              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-2xl text-[#F5ECD7] mb-1 truncate group-hover:text-[#D4A853] transition-colors" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                              {profile.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-[#F5ECD7]/60" style={{ fontFamily: "var(--font-inter)" }}>
                              <span>Age {profile.age}</span>
                              {profile.relation && (
                                <>
                                  <span className="text-[#D4A853]/40">•</span>
                                  <span className="italic" style={{ fontFamily: "var(--font-eb-garamond)" }}>{profile.relation}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#D4A853]/80" style={{ fontFamily: "var(--font-inter)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
                          </svg>
                          <span>{profile.chapters.length} {profile.chapters.length === 1 ? "Chapter" : "Chapters"}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#F5ECD7]/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-center text-[#F5ECD7]/30 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
            Your voice. Your legacy. Forever.
          </p>
        </div>
      </footer>
    </div>
  );
}
