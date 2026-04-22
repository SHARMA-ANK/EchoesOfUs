"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Chapter { id: string; title: string; }
interface Profile { id: string; name: string; age: number; relation: string | null; chapters: Chapter[]; }
interface Family { id: string; familyName: string; isPublishedToGlobal: boolean; profiles: Profile[]; }

export default function DashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [families, setFamilies] = useState<Family[]>([]);
    const [userEmail, setUserEmail] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();
                if (!session?.userId) { router.push("/auth/login"); return; }
                setUserEmail(session.email);

                const familiesRes = await fetch("/api/families");
                if (familiesRes.ok) setFamilies(await familiesRes.json());
                else if (familiesRes.status === 401) router.push("/auth/login");
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
    };

    const handleTogglePublish = async (family: Family) => {
        setTogglingId(family.id);
        try {
            const res = await fetch(`/api/families/${family.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublishedToGlobal: !family.isPublishedToGlobal }),
            });
            if (res.ok) {
                const updated = await res.json();
                setFamilies((prev) =>
                    prev.map((f) => f.id === family.id ? { ...f, isPublishedToGlobal: updated.isPublishedToGlobal } : f)
                );
            }
        } catch (e) {
            console.error(e);
        } finally {
            setTogglingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="film-grain vignette relative min-h-screen flex items-center justify-center bg-[#1A1612]">
                <div className="text-[#D4A853] text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="film-grain vignette relative min-h-screen bg-[#1A1612]">
            <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(circle, transparent 20%, #1A1612 100%)" }} />

            {/* Header */}
            <header className="relative z-10 w-full flex justify-between items-center px-6 py-6">
                <Link href="/" className="text-2xl italic text-[#D4A853]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                    Echoes of Us
                </Link>
                <div className="flex items-center gap-6">
                    <span className="text-[#F5ECD7]/60 text-sm" style={{ fontFamily: "var(--font-inter)" }}>{userEmail}</span>
                    <button onClick={handleLogout} className="text-[#F5ECD7]/60 hover:text-[#D4A853] transition-colors text-sm uppercase tracking-widest" style={{ fontFamily: "var(--font-inter)" }}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-5xl italic text-[#F5ECD7] mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>Family Dashboard</h1>
                    <p className="text-[#F5ECD7]/50 text-lg" style={{ fontFamily: "var(--font-inter)" }}>Manage your family archives and profiles</p>
                </div>

                {families.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[#F5ECD7]/50 mb-6" style={{ fontFamily: "var(--font-inter)" }}>No families yet. Create your first profile to get started.</p>
                        <Link href="/profiles/new" className="inline-block bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold px-8 py-4 rounded-xl transition-all duration-500" style={{ fontFamily: "var(--font-inter)" }}>
                            Create Profile
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {families.map((family) => (
                            <div key={family.id} className="p-8 rounded-2xl" style={{ background: "rgba(34, 30, 25, 0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(212, 168, 83, 0.1)" }}>

                                {/* Family Header */}
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                    <div>
                                        <h2 className="text-3xl italic text-[#F5ECD7] mb-1" style={{ fontFamily: "var(--font-eb-garamond)" }}>{family.familyName}</h2>
                                        <p className="text-[#F5ECD7]/40 text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-inter)" }}>
                                            {family.profiles.length} {family.profiles.length === 1 ? "profile" : "profiles"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Publish Toggle */}
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-inter)", color: family.isPublishedToGlobal ? "#D4A853" : "rgba(245,236,215,0.3)" }}>
                                                {family.isPublishedToGlobal ? "Published" : "Private"}
                                            </span>
                                            <button
                                                onClick={() => handleTogglePublish(family)}
                                                disabled={togglingId === family.id}
                                                aria-label={family.isPublishedToGlobal ? "Unpublish family" : "Publish to Human Archive"}
                                                className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/50 disabled:opacity-50"
                                                style={{
                                                    background: family.isPublishedToGlobal ? "linear-gradient(135deg, #C8922A, #D4A853)" : "rgba(245,236,215,0.1)",
                                                    border: "1px solid rgba(212,168,83,0.3)",
                                                }}
                                            >
                                                <span
                                                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
                                                    style={{ left: family.isPublishedToGlobal ? "calc(100% - 22px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                                                />
                                            </button>
                                        </div>

                                        <Link href="/profiles/new" className="bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold px-5 py-2.5 rounded-xl transition-all duration-500 text-xs uppercase tracking-wider" style={{ fontFamily: "var(--font-inter)" }}>
                                            Add Profile
                                        </Link>
                                    </div>
                                </div>

                                {/* Published banner */}
                                {family.isPublishedToGlobal && (
                                    <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(212, 168, 83, 0.08)", border: "1px solid rgba(212, 168, 83, 0.2)" }}>
                                        <span className="w-2 h-2 rounded-full bg-[#D4A853] animate-pulse flex-shrink-0" />
                                        <p className="text-[#D4A853]/80 text-xs" style={{ fontFamily: "var(--font-inter)" }}>
                                            Visible on{" "}
                                            <Link href="/" className="underline hover:text-[#D4A853] transition-colors">The Human Archive</Link>
                                        </p>
                                    </div>
                                )}

                                {/* Profiles Grid */}
                                {family.profiles.length === 0 ? (
                                    <p className="text-[#F5ECD7]/30 text-sm" style={{ fontFamily: "var(--font-inter)" }}>No profiles yet — add one above.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {family.profiles.map((profile) => (
                                            <Link key={profile.id} href={`/profiles/${profile.id}`} className="p-6 rounded-xl hover:bg-white/5 transition-all duration-300 group" style={{ background: "rgba(212, 168, 83, 0.05)", border: "1px solid rgba(212, 168, 83, 0.1)" }}>
                                                <h3 className="text-xl text-[#F5ECD7] mb-1 group-hover:text-[#D4A853] transition-colors" style={{ fontFamily: "var(--font-eb-garamond)" }}>{profile.name}</h3>
                                                <p className="text-[#F5ECD7]/50 text-sm mb-3" style={{ fontFamily: "var(--font-inter)" }}>
                                                    {profile.age} years old{profile.relation && ` • ${profile.relation}`}
                                                </p>
                                                <p className="text-[#D4A853] text-xs uppercase tracking-wider" style={{ fontFamily: "var(--font-inter)" }}>
                                                    {profile.chapters.length} {profile.chapters.length === 1 ? "Chapter" : "Chapters"}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
