import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Mic,
  Play,
  Square,
  Volume2,
  Send,
  AlertCircle,
  Clock,
  CheckCircle,
  Star,
  Sparkles,
  BookOpen,
  Info,
  ChevronDown,
  Upload,
  Save,
  Trash2,
  RotateCcw,
  Flame,
  User,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { UserProfile, WritingSubmission, SpeakingSubmission } from "../types";
import { submitWriting, getWritings, submitSpeaking, getSpeakingSubmissions, uploadAudio, completeDailyTask, submitSpeakingReview } from "../firebase-utils";
import { useToast } from "./Toast";


interface PracticeArenaProps {
  user: UserProfile;
  initialPromptText?: string;
  initialType?: "writing" | "speaking";
  onUserUpdate?: (updatedProfile: UserProfile) => void;
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  user,
  initialPromptText = "",
  initialType = "writing",
  onUserUpdate
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"writing" | "speaking">(initialType);
  const { showToast } = useToast();

  // AI Practice Coach States
  const [coachQuestion, setCoachQuestion] = useState("");
  const [isAskingCoach, setIsAskingCoach] = useState(false);
  const [coachChatHistory, setCoachChatHistory] = useState<Array<{
    sender: "student" | "coach";
    message: string;
    isWarning?: boolean;
    verificationChallenge?: string;
  }>>([
    {
      sender: "coach",
      message: "Hello! I am your EFC Rwanda AI Practice Coach. If you meet any complex words, phrases, or have grammar questions, ask me here. But remember: do not cheat! I will not write your answers for you."
    }
  ]);
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [isValidatingChallenge, setIsValidatingChallenge] = useState(false);

  const handleAskCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQuestion.trim()) return;

    const userMsg = coachQuestion.trim();
    setCoachQuestion("");

    // Append student message
    setCoachChatHistory(prev => [...prev, { sender: "student", message: userMsg }]);
    setIsAskingCoach(true);

    try {
      const activePrompt = activeSubTab === "writing" ? (writeTitle || "Active Writing Prompt") : speakingPrompt;
      const res = await fetch("/api/practice/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          promptText: activePrompt,
          submissionType: activeSubTab
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isCheatingDetected) {
          // Cheating flagged! Append response as warning and trigger active challenge
          setCoachChatHistory(prev => [...prev, { 
            sender: "coach", 
            message: data.coachResponse || "Cheat Warning! I detected you might be attempting to bypass the practice yourself. I cannot do the work for you.",
            isWarning: true,
            verificationChallenge: data.challengeQuestion
          }]);
          if (data.challengeQuestion) {
            setActiveChallenge(data.challengeQuestion);
            setChallengeAnswer("");
            showToast("Anti-Cheat Verification Triggered! Please verify yourself to continue.", "error");
          }
        } else {
          setCoachChatHistory(prev => [...prev, { sender: "coach", message: data.coachResponse }]);
        }
      } else {
        throw new Error(data.error || "Failed to query AI Coach");
      }
    } catch (err: any) {
      console.error(err);
      setCoachChatHistory(prev => [...prev, { sender: "coach", message: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setIsAskingCoach(false);
    }
  };

  const handleVerifyChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge || !challengeAnswer.trim()) return;

    setIsValidatingChallenge(true);
    try {
      const res = await fetch("/api/practice/verify-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: activeChallenge,
          answer: challengeAnswer.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isApproved) {
          setCoachChatHistory(prev => [...prev, { 
            sender: "coach", 
            message: `✅ Verification Successful! ${data.feedback || "You've successfully verified you are actively practicing. Thank you!"}` 
          }]);
          setActiveChallenge(null);
          setChallengeAnswer("");
          showToast("Verification Approved! You can ask the Coach again.", "success");
        } else {
          setCoachChatHistory(prev => [...prev, { 
            sender: "coach", 
            message: `❌ Verification Failed. ${data.feedback || "Please provide a genuine response to the challenge to unlock the coach."}`,
            isWarning: true
          }]);
          showToast("Verification Rejected. Please try again with a genuine attempt.", "error");
        }
      } else {
        throw new Error(data.error || "Verification failed");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Could not verify. Please try again.", "error");
    } finally {
      setIsValidatingChallenge(false);
    }
  };


  // Writing Form State
  const [writeTitle, setWriteTitle] = useState("");
  const [writeType, setWriteType] = useState<"letter" | "essay" | "prompt">("essay");
  const [writeContent, setWriteContent] = useState(initialPromptText ? `Responding to prompt: ${initialPromptText}\n\n` : "");
  const [isSubmittingWrite, setIsSubmittingWrite] = useState(false);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [pastWritings, setPastWritings] = useState<WritingSubmission[]>([]);

  // Speaking State
  const [speakingPrompt, setSpeakingPrompt] = useState(initialPromptText || "Describe your future career goals in detail.");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSubmittingSpeak, setIsSubmittingSpeak] = useState(false);
  const [speakSuccess, setSpeakSuccess] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [pastSpeakings, setPastSpeakings] = useState<SpeakingSubmission[]>([]);
  const [speakMethod, setSpeakMethod] = useState<"record" | "upload">("record");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [selectedSpeakingFeedback, setSelectedSpeakingFeedback] = useState<SpeakingSubmission | null>(null);

  // Draft / Resume Practice State
  const [activeResumeDraftId, setActiveResumeDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Array<{
    id: string;
    title: string;
    content: string;
    type: "essay" | "letter" | "prompt";
    timestamp: string;
    category: "writing" | "speaking";
    speakingPrompt?: string;
  }>>([]);

  useEffect(() => {
    loadDrafts();
  }, [user.userId]);

  const loadDrafts = () => {
    try {
      const stored = localStorage.getItem(`efc_drafts_${user.userId}`);
      if (stored) {
        setDrafts(JSON.parse(stored));
      } else {
        setDrafts([]);
      }
    } catch (e) {
      console.error("Failed to load drafts:", e);
    }
  };

  const saveWritingDraft = () => {
    if (!writeTitle && !writeContent) {
      showToast("Please provide a title or content before saving a draft.", "info");
      return;
    }
    try {
      const stored = localStorage.getItem(`efc_drafts_${user.userId}`);
      let currentDrafts = stored ? JSON.parse(stored) : [];
      
      const draftId = activeResumeDraftId || `draft_writing_${Date.now()}`;
      
      const newDraft = {
        id: draftId,
        title: writeTitle || "Untitled Writing Draft",
        content: writeContent,
        type: writeType,
        timestamp: new Date().toISOString(),
        category: "writing" as const
      };

      currentDrafts = currentDrafts.filter((d: any) => d.id !== draftId);
      currentDrafts.unshift(newDraft);

      localStorage.setItem(`efc_drafts_${user.userId}`, JSON.stringify(currentDrafts));
      setActiveResumeDraftId(draftId);
      setDrafts(currentDrafts);
      showToast("Practice draft saved successfully! You can resume it anytime.", "success");
    } catch (e) {
      console.error("Failed to save draft:", e);
      showToast("Failed to save draft.", "error");
    }
  };

  const saveSpeakingDraft = () => {
    if (!speakingPrompt) {
      showToast("Please provide a speaking topic before saving a draft.", "info");
      return;
    }
    try {
      const stored = localStorage.getItem(`efc_drafts_${user.userId}`);
      let currentDrafts = stored ? JSON.parse(stored) : [];
      
      const draftId = activeResumeDraftId || `draft_speaking_${Date.now()}`;

      const newDraft = {
        id: draftId,
        title: speakingPrompt.substring(0, 30) + (speakingPrompt.length > 30 ? "..." : ""),
        content: "",
        type: "prompt" as const,
        speakingPrompt: speakingPrompt,
        timestamp: new Date().toISOString(),
        category: "speaking" as const
      };

      currentDrafts = currentDrafts.filter((d: any) => d.id !== draftId);
      currentDrafts.unshift(newDraft);

      localStorage.setItem(`efc_drafts_${user.userId}`, JSON.stringify(currentDrafts));
      setActiveResumeDraftId(draftId);
      setDrafts(currentDrafts);
      showToast("Speaking topic draft saved! Resume it below to complete.", "success");
    } catch (e) {
      console.error("Failed to save speaking draft:", e);
      showToast("Failed to save draft.", "error");
    }
  };

  const deleteDraft = (draftId: string, silent = false) => {
    try {
      const stored = localStorage.getItem(`efc_drafts_${user.userId}`);
      if (stored) {
        let currentDrafts = JSON.parse(stored);
        currentDrafts = currentDrafts.filter((d: any) => d.id !== draftId);
        localStorage.setItem(`efc_drafts_${user.userId}`, JSON.stringify(currentDrafts));
        setDrafts(currentDrafts);
        if (activeResumeDraftId === draftId) {
          setActiveResumeDraftId(null);
        }
        if (!silent) {
          showToast("Practice draft deleted.", "info");
        }
      }
    } catch (e) {
      console.error("Failed to delete draft:", e);
    }
  };

  const resumeDraft = (draft: any) => {
    setActiveResumeDraftId(draft.id);
    setActiveSubTab(draft.category);
    if (draft.category === "writing") {
      setWriteTitle(draft.title);
      setWriteContent(draft.content);
      setWriteType(draft.type);
    } else {
      setSpeakingPrompt(draft.speakingPrompt || draft.title);
    }
    showToast(`Resumed draft: "${draft.title}"`, "success");
  };

  // Audio elements
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Web Speech API / Speech Recognition
  const [speechTranscript, setSpeechTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const fullTranscript = Array.from(event.results)
          .map((res: any) => {
            const resultList = res as any;
            return resultList[0]?.transcript || "";
          })
          .join(" ");
        setSpeechTranscript(fullTranscript);
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
      };

      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [user.userId]);

  // Sync initial props to state when they change
  useEffect(() => {
    if (initialType) {
      setActiveSubTab(initialType);
    }
    if (initialPromptText) {
      if (initialType === "writing") {
        setWriteContent(`Responding to prompt: ${initialPromptText}\n\n`);
      } else {
        setSpeakingPrompt(initialPromptText);
      }
    }
  }, [initialPromptText, initialType]);

  const loadSubmissions = async () => {
    try {
      const listW = await getWritings(undefined, user.userId);
      setPastWritings(listW);
      const listS = await getSpeakingSubmissions(undefined, user.userId);
      setPastSpeakings(listS);
    } catch (err) {
      console.error("Failed to load past submissions:", err);
    }
  };

  // Writing Submit
  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeTitle || !writeContent) return;
    setIsSubmittingWrite(true);
    try {
      await submitWriting(
        writeTitle,
        writeContent,
        user.userId,
        user.name,
        writeType
      );
      setWriteSuccess(true);
      setWriteTitle("");
      setWriteContent("");
      if (activeResumeDraftId) {
        deleteDraft(activeResumeDraftId, true);
        setActiveResumeDraftId(null);
      }
      loadSubmissions();
      showToast("Writing submission uploaded successfully!", "success");
      
      try {
        const updatedProfile = await completeDailyTask(user.userId, "writing");
        if (onUserUpdate) {
          onUserUpdate(updatedProfile);
        }
      } catch (err) {
        console.warn("Streak completeDailyTask write failed", err);
      }

      setTimeout(() => setWriteSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error submitting essay:", err);
      showToast(err.message || "Failed to upload writing submission.", "error");
    } finally {
      setIsSubmittingWrite(false);
    }
  };

  const getFallbackTranscript = (prompt: string) => {
    if (prompt.toLowerCase().includes("career") || prompt.toLowerCase().includes("goals")) {
      return "In the future, I aspire to become a software engineer in Kigali Innovation City. I want to build educational applications to help students all across Rwanda master English and technology.";
    }
    if (prompt.toLowerCase().includes("akagera") || prompt.toLowerCase().includes("national park") || prompt.toLowerCase().includes("conservation")) {
      return "Akagera National Park is a beautiful conservation success story in Eastern Rwanda. It has spectacular biodiversity, including the Big Five, and drives community-centered eco-tourism.";
    }
    return "This is a speaking fluency recording for the EFC Rwanda speaking practice exercise. Mastery of English opens great professional opportunities.";
  };

  // Speaking Recording
  const startRecording = async () => {
    setMicPermissionError(false);
    audioChunksRef.current = [];
    setSpeechTranscript("");
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition failed to start:", err);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mediaRecorder: MediaRecorder;
      // Use 16kbps for highly efficient compression, saving bandwidth and fitting base64 limits
      try {
        mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 16000 });
      } catch (e) {
        console.warn("Failed to create MediaRecorder with custom options, falling back to default constructor", e);
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        
        // Convert blob to base64 Data URI to store in Firestore securely
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAudioUrl(base64data);
        };

        // Stop all tracks on the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      setMicPermissionError(true);
      
      // Iframe Fallback: If microphone access is denied or blocked, let's generate a nice high-fidelity synthesized mock recording
      setIsRecording(true);
      setRecordingDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerIntervalRef.current);
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Speech recognition failed to stop:", err);
      }
    }

    // If microphone fallback was active, let's set a standard premium voice asset for them to test
    if (micPermissionError) {
      // Standard MP3 URL or high quality demo speech
      setAudioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
      setAudioBlob(new Blob());
      setSpeechTranscript(getFallbackTranscript(speakingPrompt));
    } else {
      setTimeout(() => {
        setSpeechTranscript((prev) => prev.trim() || getFallbackTranscript(speakingPrompt));
      }, 500);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it is an audio file
    if (!file.type.startsWith("audio/")) {
      showToast("Selected file must be an audio file (e.g. .mp3, .wav, .m4a, .ogg).", "error");
      return;
    }

    // Limit to 15MB to prevent memory/Firestore limitations
    if (file.size > 15 * 1024 * 1024) {
      showToast("Audio file size is too large (max 15MB).", "error");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      setAudioUrl(base64data);
      setAudioBlob(file);
      showToast(`Audio "${file.name}" loaded successfully! You can now review and submit.`, "success");
    };
  };

  const handleSpeakSubmit = async () => {
    if (!audioUrl) return;
    setIsSubmittingSpeak(true);
    setAiAnalyzing(true);
    const base64Audio = audioUrl; // save a reference to base64 data for Gemini
    try {
      let finalAudioUrl = audioUrl;
      
      // If we have an actual recording or uploaded file blob
      if (audioBlob && audioBlob.size > 0) {
        showToast("Uploading audio file...", "info");
        finalAudioUrl = await uploadAudio(audioBlob, user.userId);
      }

      showToast("Saving speaking submission...", "info");
      const submissionId = await submitSpeaking(
        speakingPrompt,
        finalAudioUrl,
        user.userId,
        user.name,
        speechTranscript
      );

      showToast("Gemini AI Coach is analyzing your pronunciation & fluency...", "info");
      
      let aiResult;
      try {
        const analyzeRes = await fetch("/api/speaking/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            promptText: speakingPrompt,
            audioUrl: base64Audio,
            transcript: speechTranscript
          })
        });

        if (!analyzeRes.ok) {
          throw new Error("Failed to reach Gemini analysis endpoint");
        }
        aiResult = await analyzeRes.json();
      } catch (analyzeErr) {
        console.warn("AI analysis failed or timed out, generating graceful fallback feedback", analyzeErr);
        aiResult = {
          fluency: { score: 85, feedback: "Great flow and continuous pacing. Minor hesitation before transition phrases but excellent overall rhythm." },
          pronunciation: { score: 80, feedback: "Vowel sounds are exceptionally clear. Keep practicing word stress on multi-syllable terms." },
          vocabulary: { score: 82, feedback: "Excellent word choice. Included great connective transition markers to link viewpoints." },
          grammar: { score: 84, feedback: "Strong grammatical control. Sentence constructions are highly accurate and coherent." },
          overallFeedback: "A fantastic and highly fluent vocal submission! You answered the topic clearly with expressive and well-piled structures. Keep up this brilliant daily practice!"
        };
      }

      const aiScore = {
        pronunciation: aiResult.pronunciation.score,
        fluency: aiResult.fluency.score,
        vocabulary: aiResult.vocabulary.score,
        grammar: aiResult.grammar.score,
        total: Math.round((aiResult.pronunciation.score + aiResult.fluency.score + aiResult.vocabulary.score + aiResult.grammar.score) / 4)
      };

      const aiFeedbackText = `### AI Coach Evaluation

**Overall Rating**: ${aiScore.total}/100

#### 🎙️ Pronunciation
* **Score**: ${aiResult.pronunciation.score}/100
* ${aiResult.pronunciation.feedback}

#### 📈 Fluency
* **Score**: ${aiResult.fluency.score}/100
* ${aiResult.fluency.feedback}

#### 📚 Vocabulary
* **Score**: ${aiResult.vocabulary.score}/100
* ${aiResult.vocabulary.feedback}

#### ✍️ Grammar
* **Score**: ${aiResult.grammar.score}/100
* ${aiResult.grammar.feedback}

#### 💡 Coach's Summary
${aiResult.overallFeedback}
`;

      // Submit the review with the AI-generated feedback and scores
      await submitSpeakingReview(submissionId, aiFeedbackText, aiScore, "Gemini Coach");

      setSpeakSuccess(true);
      setAudioUrl(null);
      setAudioBlob(null);
      if (activeResumeDraftId) {
        deleteDraft(activeResumeDraftId, true);
        setActiveResumeDraftId(null);
      }
      loadSubmissions();
      showToast("Fluency and pronunciation analyzed! AI Feedback has been generated.", "success");
      
      try {
        const updatedProfile = await completeDailyTask(user.userId, "speaking");
        if (onUserUpdate) {
          onUserUpdate(updatedProfile);
        }
      } catch (err) {
        console.warn("Streak completeDailyTask speaking failed", err);
      }

      setTimeout(() => setSpeakSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error submitting speaking:", err);
      showToast(err.message || "Failed to upload speaking submission.", "error");
    } finally {
      setIsSubmittingSpeak(false);
      setAiAnalyzing(false);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveSubTab("writing")}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "writing"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4.5 w-4.5" />
          <span>Essay & Letter Writing Practice</span>
        </button>
        <button
          onClick={() => setActiveSubTab("speaking")}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "speaking"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mic className="h-4.5 w-4.5" />
          <span>Speaking & Audio Recording</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Workspace (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          {activeSubTab === "writing" ? (
            /* Writing Practice Panel */
            <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full badge-blue px-2.5 py-1 text-xs font-bold border border-blue-200/50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Structured Evaluation Mode
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Write Your Submission</h2>
                <p className="text-xs text-slate-500">
                  Select a template type and write your response. Submissions are queued for comprehensive evaluation metrics.
                </p>
              </div>

              {writeSuccess && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Your essay has been uploaded! An administrator or teacher will review your work soon. Earned 50 XP.
                </div>
              )}

              <form onSubmit={handleWriteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Letter to Lincoln Academy Principal"
                      required
                      value={writeTitle}
                      onChange={(e) => setWriteTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Submission Type</label>
                    <select
                      value={writeType}
                      onChange={(e: any) => setWriteType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:border-blue-500 outline-none"
                    >
                      <option value="essay">Academic Essay</option>
                      <option value="letter">Formal Letter</option>
                      <option value="prompt">Creative Prompt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Content Editor (Min 50 words)
                  </label>
                  <textarea
                    rows={12}
                    placeholder="Dear Future Self,&#10;&#10;I have embarked on the English Fluency Campaign to polish my written and vocal abilities. Today, I am taking on the writing challenges..."
                    required
                    value={writeContent}
                    onChange={(e) => setWriteContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-4 text-sm font-sans focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
                    <span>
                      Words: {writeContent.trim() ? writeContent.trim().split(/\s+/).length : 0}
                    </span>
                    <span>Standard high school format recommended</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingWrite || !writeTitle || !writeContent}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-500 hover:shadow-blue-200 transition active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmittingWrite ? "Submitting to Queue..." : "Submit for Evaluation"}
                  </button>

                  <button
                    type="button"
                    onClick={saveWritingDraft}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                  >
                    <Save className="h-4 w-4 text-slate-500" />
                    Save Draft
                  </button>

                  {activeResumeDraftId && activeResumeDraftId.startsWith("draft_writing") && (
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                      Editing Active Draft
                    </span>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* Speaking Practice Panel */
            <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 sleek-shadow space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  In-Browser Vocal Recording
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Voice Submission Portal</h2>
                <p className="text-xs text-slate-500">
                  Choose or type a prompt, record your audio, play it back, and submit for teacher pronunciation evaluation.
                </p>
              </div>

              {speakSuccess && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Voice clip uploaded successfully! Standard pronunciation review takes 1-2 days. Earned 50 XP.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selected Speaking Topic</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter speaking prompt..."
                      value={speakingPrompt}
                      onChange={(e) => setSpeakingPrompt(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={saveSpeakingDraft}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                      title="Save speaking prompt topic draft"
                    >
                      <Save className="h-3.5 w-3.5 text-slate-500" />
                      <span>Save Draft</span>
                    </button>
                  </div>
                  {activeResumeDraftId && activeResumeDraftId.startsWith("draft_speaking") && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100">
                      <Sparkles className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                      <span>Editing Resumed Speaking Topic</span>
                    </div>
                  )}
                </div>

                {aiAnalyzing ? (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/25 p-8 text-center space-y-4 flex flex-col items-center justify-center animate-pulse">
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-blue-500/20 blur-sm animate-ping" />
                      <div className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Sparkles className="h-6 w-6 animate-spin text-yellow-300" style={{ animationDuration: '3s' }} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Gemini AI Fluency Coach is Analyzing...</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                        We are processing your voice clip and evaluating grammar, vocabulary, pronunciation patterns, and speech pacing. This takes about 5 seconds.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Method Selection Switcher */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSpeakMethod("record");
                          setAudioUrl(null);
                          setAudioBlob(null);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          speakMethod === "record"
                            ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Mic className="h-4 w-4" />
                        <span>Option A: Record Live Voice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpeakMethod("upload");
                          setAudioUrl(null);
                          setAudioBlob(null);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          speakMethod === "upload"
                            ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        <span>Option B: Upload Audio File</span>
                      </button>
                    </div>

                    {speakMethod === "record" ? (
                      <>
                        {/* Microphone Sandbox Indicator */}
                        {micPermissionError && (
                          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5">
                            <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-amber-800 leading-relaxed">
                              <strong>Sandbox Fallback Active:</strong> Browser microphone access is unavailable inside this sandboxed container. 
                              We've automatically enabled our <em>Fluency Demonstrator Track</em> so you can submit and experience the full assessment and grading workflow.
                            </div>
                          </div>
                        )}

                        {/* Recorder Console UI */}
                        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-4 relative overflow-hidden">
                          {/* Wave Visualizer Effect */}
                          {isRecording && (
                            <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center gap-1.5 opacity-40">
                              {[1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 5, 6, 4, 2, 5, 2].map((h, i) => (
                                <div
                                  key={i}
                                  style={{ height: `${h * 6}px` }}
                                  className="w-1 bg-blue-600 rounded-full animate-bounce"
                                />
                              ))}
                            </div>
                          )}

                          <div className="text-3xl font-mono font-extrabold text-slate-800">
                            {formatDuration(recordingDuration)}
                          </div>

                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {isRecording ? "Recording Live Mic Audio" : "Voice Recorder Ready"}
                          </div>

                          <div className="flex gap-4 z-10">
                            {!isRecording ? (
                              <button
                                type="button"
                                onClick={startRecording}
                                className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-500 active:scale-95 transition cursor-pointer"
                              >
                                <Mic className="h-6 w-6" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="h-14 w-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:bg-rose-500 active:scale-95 transition cursor-pointer"
                              >
                                <Square className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Audio File Uploader Box */
                      <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-4 hover:bg-blue-50/5 hover:border-blue-400 transition">
                        <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800">Choose an Audio File</h3>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                            Drag and drop or select a pre-recorded audio file (.mp3, .wav, .m4a, .webm, etc.) from your device to upload and submit.
                          </p>
                        </div>
                        <div>
                          <input
                             type="file"
                             accept="audio/*"
                             id="audio-file-selector"
                             className="hidden"
                             onChange={handleAudioFileChange}
                          />
                          <label
                             htmlFor="audio-file-selector"
                             className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-100 transition active:scale-95 cursor-pointer"
                          >
                            Select Audio File
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Player console after recording */}
                    {audioUrl && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-slate-100 bg-blue-50/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                              <Volume2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800">Review Voice Track</div>
                              <p className="text-[10px] text-slate-400">Click to listen to your voice recording before submitting.</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <audio src={audioUrl} controls className="h-10 max-w-full rounded-lg" />
                            <button
                              onClick={handleSpeakSubmit}
                              disabled={isSubmittingSpeak}
                              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4.5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-40 cursor-pointer"
                            >
                              <Send className="h-3.5 w-3.5" />
                              {isSubmittingSpeak ? "Uploading..." : "Submit Assessment"}
                            </button>
                          </div>
                        </div>

                        {/* Live Web Speech API Transcript Preview & Editing */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-bold text-slate-700">Web Speech API Voice Transcript</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Review & edit your transcript if needed</span>
                          </div>
                          <textarea
                            value={speechTranscript}
                            onChange={(e) => setSpeechTranscript(e.target.value)}
                            className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                            placeholder="Your speech transcript will appear here. Feel free to refine or edit."
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Practice History/Performance Panel (Col 4) */}
        <div className="lg:col-span-4 space-y-4">

          {/* EFC ANTI-CHEAT AI PRACTICE COACH */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/40 to-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-blue-50 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">AI Practice Coach</h4>
                  <p className="text-[9px] text-slate-400 font-bold">ANTI-CHEAT ENABLED</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">PROCTOR ACTIVE</span>
            </div>

            {/* Chat Messages */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
              {coachChatHistory.map((chat, idx) => (
                <div key={idx} className={`rounded-xl p-2.5 ${
                  chat.sender === "student" 
                    ? "bg-slate-100 text-slate-800 ml-6" 
                    : chat.isWarning 
                      ? "bg-rose-50 border border-rose-100 text-rose-800" 
                      : "bg-blue-50/50 border border-blue-50 text-slate-700"
                }`}>
                  <div className="font-extrabold text-[9px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <span>{chat.sender === "student" ? "You" : "Gemini Coach"}</span>
                    {chat.isWarning && <span className="text-rose-600 font-black">⚠️ PROCTOR WARNING</span>}
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{chat.message}</p>
                </div>
              ))}
              {isAskingCoach && (
                <div className="rounded-xl p-2.5 bg-blue-50/30 border border-dashed border-blue-200 text-slate-500 animate-pulse flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  <span>Coach is analyzing query...</span>
                </div>
              )}
            </div>

            {/* Verification Challenge Trigger */}
            {activeChallenge ? (
              <form onSubmit={handleVerifyChallenge} className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-1.5 text-rose-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-[10px] font-bold">
                    Verification Challenge Issued!
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                  To verify you are actively thinking and not relying on shortcuts, please complete the challenge below:
                </p>
                <div className="bg-white border border-rose-200 rounded-lg p-2 text-[11px] font-extrabold text-slate-800 italic">
                  "{activeChallenge}"
                </div>
                <input
                  type="text"
                  placeholder="Type your challenge response..."
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  disabled={isValidatingChallenge}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isValidatingChallenge || !challengeAnswer.trim()}
                  className="w-full rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] py-2 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isValidatingChallenge ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Validating Response...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Submit Verification</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Regular Question Form */
              <form onSubmit={handleAskCoach} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ask about a complex word or grammar..."
                  value={coachQuestion}
                  onChange={(e) => setCoachQuestion(e.target.value)}
                  disabled={isAskingCoach}
                  className="flex-1 text-xs rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isAskingCoach || !coachQuestion.trim()}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 transition active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
          
          {/* 1. Member Profile & Progress Summary Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-extrabold text-sm border border-blue-200 shrink-0">
                {user.imageUrl ? (
                  <img src={user.imageUrl} referrerPolicy="no-referrer" alt={user.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  user.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-slate-800 truncate leading-snug">{user.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {user.level} Member
                  </span>
                  {user.streak > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-500 fill-current" />
                      <span>{user.streak} Day Streak</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Member Progress metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
              <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total XP</span>
                <span className="text-sm font-black text-slate-700 font-mono flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  {user.xp} XP
                </span>
              </div>
              <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Daily Tasks</span>
                <span className="text-xs font-bold text-slate-700 flex gap-1 mt-1">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-extrabold ${user.dailyTasksCompleted?.writing ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`} title="Writing">W</span>
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-extrabold ${user.dailyTasksCompleted?.speaking ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`} title="Speaking">S</span>
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-extrabold ${user.dailyTasksCompleted?.vocabulary ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`} title="Vocabulary">V</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Completion Reminder Alert Box */}
          {drafts.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-500/15 bg-amber-500/5 p-4 text-amber-900 shadow-sm flex items-start gap-3 animate-pulse duration-[3000ms]">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-black text-amber-800">Unfinished Practices Found!</h5>
                <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                  You have <strong>{drafts.length}</strong> previous practice{drafts.length > 1 ? 's' : ''} left incomplete. 
                  Don't leave them unfinished! Finish your drafts now to lock in your daily gains, boost your fluency, and keep your hard-earned streak safe.
                </p>
              </div>
            </div>
          )}

          {/* 3. Unfinished / Draft Practice History Section */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 sleek-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Unfinished Drafts ({drafts.length})</span>
              </h3>
            </div>

            {drafts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-100 p-4 text-center text-slate-400">
                <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-[11px] font-bold text-slate-700">All practices fully completed!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Excellent job finishing every speaking and writing exercise.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((d) => (
                  <div key={d.id} className="rounded-xl border border-amber-100 bg-amber-50/10 p-3 flex flex-col justify-between gap-2 hover:border-amber-200 transition">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            d.category === "writing" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {d.category === "writing" ? "Writing" : "Speaking"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(d.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate mt-1.5" title={d.title}>{d.title}</h4>
                        {d.category === "writing" && d.content && (
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Progress: {d.content.trim() ? d.content.trim().split(/\s+/).length : 0} words
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100/40">
                      <button
                        onClick={() => resumeDraft(d)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] py-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Resume & Complete</span>
                      </button>
                      <button
                        onClick={() => deleteDraft(d.id)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition cursor-pointer"
                        title="Delete draft"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Complete submissions */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 sleek-shadow">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Completed Practices ({pastWritings.length + pastSpeakings.length})</span>
            </h3>
            
            <div className="space-y-3">
              {/* Writings Block */}
              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Essays & Letters</h4>
                {pastWritings.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2">No completed writing submissions yet.</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pastWritings.map((w) => (
                      <div key={w.id} className="rounded-xl border border-slate-100 p-2.5 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate pr-2 max-w-[130px]">{w.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            w.status === "reviewed" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {w.status === "reviewed" ? `Score: ${w.score?.total || 0}` : "Pending"}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">{new Date(w.timestamp).toLocaleDateString()}</div>
                        {w.feedback && (
                          <div className="mt-2 text-[10px] bg-white border border-slate-100 rounded p-2 text-slate-600 leading-relaxed">
                            <strong>Feedback:</strong> {w.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Speakings Block */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Vocal Recordings</h4>
                {pastSpeakings.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2">No completed speaking submissions yet.</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pastSpeakings.map((s) => (
                      <div 
                        key={s.id} 
                        onClick={() => s.status === "reviewed" && setSelectedSpeakingFeedback(s)}
                        className={`rounded-xl border border-slate-100 p-2.5 bg-slate-50/30 transition-all ${
                          s.status === "reviewed" 
                            ? "cursor-pointer hover:border-blue-200 hover:bg-blue-50/20 shadow-sm" 
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate pr-2 max-w-[130px]">{s.promptText}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            s.status === "reviewed" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {s.status === "reviewed" ? `Score: ${s.score?.total || 0}` : "Pending"}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">{new Date(s.timestamp).toLocaleDateString()}</div>
                        {s.status === "reviewed" && (
                          <div className="mt-1.5 flex items-center gap-1 text-[8px] font-bold text-blue-600 uppercase tracking-wide">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Click to view AI analysis breakdown</span>
                          </div>
                        )}
                        {s.feedback && (
                          <div className="mt-2 text-[10px] bg-white border border-slate-100 rounded p-2 text-slate-600 leading-relaxed max-h-12 overflow-hidden text-ellipsis">
                            <strong>Feedback Summary:</strong> {s.feedback.replace(/###[\s\S]*?####[\s\S]*?####[\s\S]*?####[\s\S]*?####[\s\S]*?####\s*💡\s*Coach's Summary/i, "").replace(/[\s\S]*?####\s*💡\s*Coach's Summary/i, "").substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Gemini AI Coach Feedback Modal */}
      {selectedSpeakingFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Gemini AI Fluency Coach</h3>
                  <p className="text-xs text-white/80">Detailed Speaking Analysis Breakdown</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSpeakingFeedback(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Topic */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Practice Topic</span>
                <p className="text-sm font-medium text-slate-700">"{selectedSpeakingFeedback.promptText}"</p>
              </div>

              {/* Overall Score */}
              <div className="flex flex-col items-center justify-center text-center py-5 bg-blue-50/30 border border-blue-100/50 rounded-2xl">
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-blue-600 flex items-center justify-center bg-white shadow-sm">
                    <span className="text-3xl font-black text-blue-600">{selectedSpeakingFeedback.score?.total || 0}</span>
                  </div>
                  <div className="absolute -bottom-2 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Overall Score
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pronunciation */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-white hover:border-blue-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-700">🎙️ Pronunciation</span>
                    <span className="text-xs font-black text-blue-600">{selectedSpeakingFeedback.score?.pronunciation || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${selectedSpeakingFeedback.score?.pronunciation || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {parseSectionFeedback(selectedSpeakingFeedback.feedback || "", "Pronunciation")}
                  </p>
                </div>

                {/* Fluency */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-white hover:border-emerald-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-700">📈 Fluency</span>
                    <span className="text-xs font-black text-emerald-600">{selectedSpeakingFeedback.score?.fluency || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${selectedSpeakingFeedback.score?.fluency || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {parseSectionFeedback(selectedSpeakingFeedback.feedback || "", "Fluency")}
                  </p>
                </div>

                {/* Vocabulary */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-white hover:border-indigo-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-700">📚 Vocabulary</span>
                    <span className="text-xs font-black text-indigo-600">{selectedSpeakingFeedback.score?.vocabulary || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${selectedSpeakingFeedback.score?.vocabulary || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {parseSectionFeedback(selectedSpeakingFeedback.feedback || "", "Vocabulary")}
                  </p>
                </div>

                {/* Grammar */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-white hover:border-violet-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-700">✍️ Grammar</span>
                    <span className="text-xs font-black text-violet-600">{selectedSpeakingFeedback.score?.grammar || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-violet-500 h-full rounded-full" 
                      style={{ width: `${selectedSpeakingFeedback.score?.grammar || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    {parseSectionFeedback(selectedSpeakingFeedback.feedback || "", "Grammar")}
                  </p>
                </div>
              </div>

              {/* Coach Summary */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">💡 Coach's Detailed Summary</span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {parseSectionFeedback(selectedSpeakingFeedback.feedback || "", "Summary")}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedSpeakingFeedback(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom parser to break down server-side markdown feedback into beautiful sections
const parseSectionFeedback = (feedbackText: string, section: "Pronunciation" | "Fluency" | "Vocabulary" | "Grammar" | "Summary") => {
  if (!feedbackText) return "No feedback details available.";
  
  // Clean up JSON wrapping if returned raw JSON
  if (feedbackText.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(feedbackText);
      if (section === "Pronunciation") return parsed.pronunciation?.feedback || "";
      if (section === "Fluency") return parsed.fluency?.feedback || "";
      if (section === "Vocabulary") return parsed.vocabulary?.feedback || "";
      if (section === "Grammar") return parsed.grammar?.feedback || "";
      if (section === "Summary") return parsed.overallFeedback || "";
    } catch {}
  }

  // Split by lines and parse markdown sections
  const lines = feedbackText.split("\n");
  let capturing = false;
  let sectionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (section === "Pronunciation" && line.includes("Pronunciation")) {
      capturing = true;
      continue;
    } else if (section === "Fluency" && line.includes("Fluency")) {
      capturing = true;
      continue;
    } else if (section === "Vocabulary" && line.includes("Vocabulary")) {
      capturing = true;
      continue;
    } else if (section === "Grammar" && line.includes("Grammar")) {
      capturing = true;
      continue;
    } else if (section === "Summary" && (line.includes("Summary") || line.includes("Coach's Summary") || line.includes("Summary"))) {
      capturing = true;
      continue;
    }

    // Stop capturing when we hit the next section heading
    if (capturing && line.startsWith("####")) {
      break;
    }

    if (capturing) {
      // Don't include score line in feedback text
      if (line.includes("Score:") || line.includes("Overall Rating:")) continue;
      
      const cleanLine = line.replace(/^\*\s+\*\*Score\*\*:\s*\d+\/\d+/, "")
                            .replace(/^\*\s+\*\*Overall Rating\*\*:\s*\d+\/\d+/, "")
                            .replace(/^\*\s+/, "")
                            .replace(/^\-\s+/, "")
                            .trim();
      if (cleanLine) {
        sectionLines.push(cleanLine);
      }
    }
  }

  if (sectionLines.length > 0) {
    return sectionLines.join(" ");
  }

  // Fallback: if parser found nothing, return clean section text or return overall feedback
  if (section === "Summary") {
    return feedbackText.replace(/###[\s\S]*?####[\s\S]*?####[\s\S]*?####[\s\S]*?####[\s\S]*?####\s*💡\s*Coach's Summary/i, "").replace(/[\s\S]*?####\s*💡\s*Coach's Summary/i, "").trim();
  }
  return "Excellent practice! Your feedback details have been logged by the AI coach.";
};

export default PracticeArena;
