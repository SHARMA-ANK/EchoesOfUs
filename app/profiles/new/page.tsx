"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProfilePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [familyId, setFamilyId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        relation: "",
    });

    useEffect(() => {
        // Fetch or create a family for the user
        const initializeFamily = async () => {
            try {
                // Try to get existing families
                const familiesResponse = await fetch("/api/families");

                if (familiesResponse.ok) {
                    const families = await familiesResponse.json();

                    if (families.length > 0) {
                        // Use the first family
                        setFamilyId(families[0].id);
                    } else {
                        // Create a default family
                        const createResponse = await fetch("/api/families", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                familyName: "My Family Archive",
                            }),
                        });

                        if (createResponse.ok) {
                            const newFamily = await createResponse.json();
                            setFamilyId(newFamily.id);
                        } else {
                            throw new Error("Failed to create family");
                        }
                    }
                } else if (familiesResponse.status === 401) {
                    // Not authenticated, redirect to login
                    router.push("/auth/login");
                    return;
                } else {
                    throw new Error("Failed to fetch families");
                }
            } catch (error) {
                console.error("Error initializing family:", error);
                alert("Failed to initialize. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        initializeFamily();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!familyId) {
            alert("No family available. Please try again.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/profiles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    familyId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create profile");
            }

            const profile = await response.json();
            router.push(`/profiles/${profile.id}`);
        } catch (error) {
            console.error("Error creating profile:", error);
            alert(error instanceof Error ? error.message : "Failed to create profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="film-grain vignette relative min-h-screen flex flex-col items-center justify-center bg-[#1A1612]">
                <div className="text-[#D4A853] text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="film-grain vignette relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12 px-4 overflow-hidden bg-[#1A1612]">
            {/* Background Layering */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0" style={{ background: "radial-gradient(circle, transparent 20%, #1A1612 100%)" }}></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4A853]/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#C8922A]/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#1A1612]/70 backdrop-blur-lg">
                <Link href="/" className="text-2xl font-headline italic text-[#D4A853]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                    Echoes of Us
                </Link>
                <Link href="/" className="text-[#F5ECD7]/60 hover:text-[#D4A853] transition-colors duration-500 flex items-center gap-2 text-sm uppercase tracking-widest" style={{ fontFamily: "var(--font-inter)" }}>
                    Cancel
                </Link>
            </header>

            {/* Central Form Card */}
            <div className="relative z-10 w-full max-w-xl">
                <div className="p-10 md:p-14 rounded-3xl" style={{
                    background: "rgba(34, 30, 25, 0.7)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(212, 168, 83, 0.1)",
                    boxShadow: "0 0 24px rgba(212, 168, 83, 0.15)"
                }}>
                    {/* Card Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl italic text-[#F5ECD7] mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                            Create a New Profile
                        </h1>
                        <p className="text-[#F5ECD7]/50 text-sm tracking-wide max-w-xs mx-auto" style={{ fontFamily: "var(--font-inter)" }}>
                            Begin the journey of preserving a legacy. Every story starts with a name.
                        </p>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#D4A853]/70 mb-2 ml-1" htmlFor="name" style={{ fontFamily: "var(--font-inter)" }}>
                                    Name
                                </label>
                                <input
                                    className="w-full bg-white/5 border-none rounded-xl px-4 py-4 text-[#F5ECD7] placeholder:text-[#F5ECD7]/20 focus:ring-1 focus:ring-[#D4A853]/50 transition-all duration-300"
                                    id="name"
                                    name="name"
                                    placeholder="Full legal or chosen name"
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ fontFamily: "var(--font-inter)" }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#D4A853]/70 mb-2 ml-1" htmlFor="age" style={{ fontFamily: "var(--font-inter)" }}>
                                        Age
                                    </label>
                                    <input
                                        className="w-full bg-white/5 border-none rounded-xl px-4 py-4 text-[#F5ECD7] placeholder:text-[#F5ECD7]/20 focus:ring-1 focus:ring-[#D4A853]/50 transition-all duration-300"
                                        id="age"
                                        name="age"
                                        placeholder="e.g., 78"
                                        required
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        style={{ fontFamily: "var(--font-inter)" }}
                                    />
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#D4A853]/70 mb-2 ml-1" htmlFor="relation" style={{ fontFamily: "var(--font-inter)" }}>
                                        Relation
                                    </label>
                                    <input
                                        className="w-full bg-white/5 border-none rounded-xl px-4 py-4 text-[#F5ECD7] placeholder:text-[#F5ECD7]/20 focus:ring-1 focus:ring-[#D4A853]/50 transition-all duration-300"
                                        id="relation"
                                        name="relation"
                                        placeholder="e.g., Grandfather"
                                        type="text"
                                        value={formData.relation}
                                        onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                        style={{ fontFamily: "var(--font-inter)" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="pt-6">
                            <button
                                className="w-full bg-[#D4A853] hover:bg-[#C8922A] text-[#1A1612] font-bold py-5 rounded-xl transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    fontFamily: "var(--font-inter)",
                                    boxShadow: "0 0 20px rgba(212, 168, 83, 0.3)"
                                }}
                            >
                                <span className="text-sm uppercase tracking-[0.2em]">
                                    {isSubmitting ? "Creating..." : "Create Profile"}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* Footnote */}
                    <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-[#F5ECD7]/30" style={{ fontFamily: "var(--font-inter)" }}>
                        Sacred Space • Private Archive • Encrypted
                    </p>
                </div>
            </div>
        </div>
    );
}
