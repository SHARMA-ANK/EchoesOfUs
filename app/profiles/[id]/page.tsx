"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayerProvider } from "@/app/components/AudioPlayerProvider";
import AudioPlayer from "@/app/components/AudioPlayer";

interface Profile {
    id: string;
    name: string;
    age: number;
    relation: string | null;
    shareSlug: string;
    chapters: Chapter[];
}

interface Chapter {
    id: string;
    chapterNumber: number;
    title: string;
    audioUrl: string | null;
}

export default function ProfileDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`/api/profiles/${params.id}`);
                if (!response.ok) {
                    throw new Error("Profile not found");
                }
                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                router.push("/");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [params.id, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1A1612]">
                <div className="text-[#D4A853] text-xl" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <AudioPlayerProvider>
            <div className="film-grain vignette relative min-h-screen bg-[#1A1612] overflow-x-hidden">
                {/* Background */}
                <div className="pointer-events-none fixed inset-0 z-0" style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(212,168,83,0.05) 0%, transparent 70%)"
                }} />

                {/* Header */}
                <header className="relative z-10 flex justify-between items-center px-8 py-6">
                    <Link href="/" className="italic text-[#D4A853] text-xl tracking-tight" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                        Echoes of Us
                    </Link>
                    <Link href="/" className="text-xs uppercase tracking-widest text-[#D4A853] hover:text-[#F5ECD7] transition-colors" style={{ fontFamily: "var(--font-inter)" }}>
                        ← All Profiles
                    </Link>
                </header>

                {/* Main Content */}
                <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-8 pb-20">
                    {/* Profile Header */}
                    <section className="mb-16">
                        <div className="text-center space-y-4">
                            <h1 className="text-6xl md:text-7xl text-[#F5ECD7] tracking-tight" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                                {profile.name}
                            </h1>
                            <div className="flex items-center justify-center gap-4 text-[#F5ECD7]/60" style={{ fontFamily: "var(--font-inter)" }}>
                                <span className="text-lg">Age {profile.age}</span>
                                {profile.relation && (
                                    <>
                                        <span className="text-[#D4A853]/40">·</span>
                                        <span className="text-lg italic" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                                            {profile.relation}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Amber rule */}
                        <div className="w-20 h-px bg-[#D4A853]/30 mx-auto mt-8" />

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                            <Link
                                href={`/interview?profileId=${profile.id}`}
                                className="px-10 py-4 rounded-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:scale-105 active:scale-95"
                                style={{
                                    fontFamily: "var(--font-inter)",
                                    boxShadow: "0 0 32px rgba(212, 168, 83, 0.4)"
                                }}
                            >
                                Start New Chapter
                            </Link>

                            <Link
                                href={`/book/${profile.shareSlug}`}
                                target="_blank"
                                className="px-10 py-4 rounded-full bg-transparent border-2 border-[#D4A853] hover:bg-[#D4A853]/10 text-[#D4A853] font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:scale-105 active:scale-95"
                                style={{
                                    fontFamily: "var(--font-inter)"
                                }}
                            >
                                View Public Audiobook
                            </Link>
                        </div>
                    </section>

                    {/* Chapters Section */}
                    <section className="space-y-8">
                        <h2 className="text-4xl text-[#F5ECD7] tracking-tight" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                            Chapters
                        </h2>

                        {profile.chapters.length === 0 ? (
                            /* Empty State */
                            <div className="rounded-3xl p-16 text-center" style={{
                                background: "rgba(34, 30, 25, 0.5)",
                                backdropFilter: "blur(16px)"
                            }}>
                                <div className="max-w-md mx-auto space-y-6">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-[#D4A853]/10 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10 text-[#D4A853]" strokeWidth="1.5">
                                            <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                        </svg>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl text-[#F5ECD7] italic" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                                            No chapters yet
                                        </h3>
                                        <p className="text-[#F5ECD7]/60 text-base leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
                                            Start recording to create your first chapter and begin preserving this precious legacy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Chapters List */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {profile.chapters.map((chapter) => (
                                    <div
                                        key={chapter.id}
                                        className="rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:scale-[1.02]"
                                        style={{
                                            background: "rgba(34, 30, 25, 0.7)",
                                            backdropFilter: "blur(16px)",
                                            boxShadow: "0 0 20px rgba(212, 168, 83, 0.08)"
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <span className="text-xs uppercase tracking-widest text-[#D4A853]/80" style={{ fontFamily: "var(--font-inter)" }}>
                                                Chapter {chapter.chapterNumber}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl text-[#F5ECD7] mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                                            {chapter.title}
                                        </h3>

                                        {/* Audio Player or Unavailable Message */}
                                        {chapter.audioUrl ? (
                                            <AudioPlayer
                                                chapterId={chapter.id}
                                                audioUrl={chapter.audioUrl}
                                                chapterTitle={chapter.title}
                                            />
                                        ) : (
                                            <div className="mt-4 p-3 rounded-lg bg-[#F5ECD7]/5 border border-[#F5ECD7]/10">
                                                <p className="text-sm text-[#F5ECD7]/40" style={{ fontFamily: "var(--font-inter)" }}>
                                                    Audio unavailable
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </AudioPlayerProvider>
    );
}
