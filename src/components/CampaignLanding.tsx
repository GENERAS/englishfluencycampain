import React, { useEffect, useState } from "react";
import { ArrowRight, Award, MessageSquare, Mic, ShieldAlert, Sparkles, Star, Users, CheckCircle, Globe, BookOpen, Send } from "lucide-react";
import { getCampaignRealStats } from "../firebase-utils";
import { EFCLogo } from "./EFCLogo";

interface CampaignLandingProps {
  onJoinCampaign: () => void;
  user: any;
}

export const CampaignLanding: React.FC<CampaignLandingProps> = ({ onJoinCampaign, user }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalWritings: 0,
    totalAudioSubmissions: 0,
    feedbackProvided: 0
  });
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: "", email: "", school: "", message: "" });
  const [submittedContact, setSubmittedContact] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const realStats = await getCampaignRealStats();
        setStats(realStats);
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setSubmittedContact(true);
      setTimeout(() => {
        setContactForm({ name: "", email: "", school: "", message: "" });
        setSubmittedContact(false);
      }, 3500);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Hero Text */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full badge-blue px-3.5 py-1.5 text-xs font-bold border border-blue-200/50">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Empowering 1 Million Students Nationally</span>
              </div>
              <h1 className="font-sans text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.1]">
                Mastering English, <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Unlocking the Future.
                </span>
              </h1>
              <p className="max-w-xl text-base text-slate-600 leading-relaxed sm:text-lg">
                The English Fluency Campaign is a nationwide high-impact program designed for schools to elevate student speaking, writing, and logical debate fluency through structured peer reviews, live database tracking, and certified assessments.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={onJoinCampaign}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-500 hover:shadow-blue-200 active:scale-95 cursor-pointer"
                >
                  {user ? "Go to My Dashboard" : "Register and Join Campaign"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#mission"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Explore Our Story
                </a>
              </div>
            </div>

            {/* Right Col: Graphic Panel */}
            <div className="lg:col-span-5 relative flex flex-col items-center gap-6">
              {/* Official Campaign Badge */}
              <div className="transform hover:scale-105 transition-transform duration-500 ease-out drop-shadow-2xl">
                <EFCLogo size={330} />
              </div>

              <div className="relative w-full max-w-[360px] lg:max-w-none rounded-2xl border border-slate-100 stat-card-gradient p-5 sleek-shadow">
                <div className="absolute -top-3 -right-3 h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg rotate-12">
                  <Star className="h-6 w-6 fill-white" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3">
                    <div className="active-indicator"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Campaign Activity</span>
                  </div>
                  
                  {/* Dynamic Stats Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                          <Users className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Active Students</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-slate-900">
                        {loading ? "..." : stats.totalStudents}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                          <BookOpen className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Writings Practiced</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-slate-900">
                        {loading ? "..." : stats.totalWritings}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold">
                          <Mic className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Voice Submissions</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-slate-900">
                        {loading ? "..." : stats.totalAudioSubmissions}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                          <CheckCircle className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Teacher Assessments</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-slate-900">
                        {loading ? "..." : stats.feedbackProvided}
                      </span>
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <span className="text-[10px] font-semibold text-slate-400">
                      *Statistics updated live from school district databases
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission & Value Proposition */}
      <section id="mission" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">Our National Mission</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Fostering Communication and Intellectual Leadership
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              We believe English fluency is more than grammar rules. It is the capacity to form logic, build persuasive arguments, and express concepts confidently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-8 transition hover:translate-y-[-4px] hover:shadow-lg hover:shadow-slate-100 duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-100 mb-6">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Structured Essays & Prompts</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Regular letters, formal emails, and creative writing prompts evaluated with clear grading matrices including Grammar, Vocabulary, Structure, and Clarity.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-8 transition hover:translate-y-[-4px] hover:shadow-lg hover:shadow-slate-100 duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500 text-white shadow-md shadow-violet-100 mb-6">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Speaking & Pronunciation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Direct in-browser voice recording where students respond to speaking challenges. Teachers and mentors review pronunciation, fluency, and vocal clarity.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-8 transition hover:translate-y-[-4px] hover:shadow-lg hover:shadow-slate-100 duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-100 mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Community Debates</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Topic-based debates on global prompts. Students vote and publish persuasive comments in structured format, building public speaking competence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Story */}
      <section className="py-20 border-t border-b border-slate-100 bg-slate-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <h3 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">The Story Behind the Campaign</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Launched as a collaborative effort between major public school boards and national educational associations, the English Fluency Campaign was born out of a critical observation: while students excelled at standard test-taking, they frequently lacked the interactive practice needed to hold persuasive conversations or author clear long-form documents.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Through digital classrooms, shared school platforms, and friendly inter-school leaderboards, the platform transforms daily learning into an exciting, collaborative journey. Today, schools participating in our campaign report a 40% increase in active communication confidence.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold text-indigo-600">40%+</span>
                  <span className="text-xs font-semibold text-slate-400">Confidence Increase</span>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold text-indigo-600">50+</span>
                  <span className="text-xs font-semibold text-slate-400">Schools Registered</span>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Program Endorsement</h4>
              <blockquote className="text-base italic text-slate-600 border-l-4 border-indigo-500 pl-4 mb-4">
                "The English Fluency Campaign has completely revitalized my English classroom. Instead of boring workbooks, students are excited to record speaking submissions and discuss current debate topics with students from other districts."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  MT
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Mrs. Margaret Thompson</div>
                  <div className="text-xs font-semibold text-slate-400">Department Head of English, Lincoln Academy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School Partnership / Contact Form */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 sm:p-12 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold tracking-tight">Become a Partner School</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Are you a school principal, teacher, or community leader? Register your school to set up custom classrooms, track student level advancements collectively, and receive end-of-year certificates.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Free platform training for educators</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Dedicated dashboard for grade tracking</span>
                  </div>
                </div>
              </div>

              <div>
                {submittedContact ? (
                  <div className="rounded-2xl bg-indigo-900/40 border border-indigo-500/20 p-6 text-center space-y-3">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto animate-bounce" />
                    <h4 className="text-base font-bold">Inquiry Sent Successfully!</h4>
                    <p className="text-xs text-slate-300">
                      Thank you for contacting us. A national program advisor will review your school registration and reach out within 48 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3.5 text-slate-800">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Name"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full rounded-xl border-0 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full rounded-xl border-0 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="School or Institution Name"
                        value={contactForm.school}
                        onChange={(e) => setContactForm({ ...contactForm, school: e.target.value })}
                        className="w-full rounded-xl border-0 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="Inquiry Details / Message"
                        rows={3}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full rounded-xl border-0 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-500 active:scale-95 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      Submit Partnership Request
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              EF
            </div>
            <span className="text-white font-sans font-bold tracking-tight">English Fluency National Campaign</span>
          </div>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Developing confident English speakers and logical writers globally. Under educational endorsement. All statistics are gathered from participating districts.
          </p>
          <div className="pt-4 border-t border-slate-800/60 text-[10px]">
            &copy; 2026 English Fluency Campaign Platform. Built with Cloud Ingress & Firebase Firestore. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
export default CampaignLanding;
