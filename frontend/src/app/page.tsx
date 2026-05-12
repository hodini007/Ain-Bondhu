"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isLetter?: boolean;
};

type RunpodSettings = {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  backendUrl: string;
};

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

const SETTINGS_KEY = "ainbondhu_runpod_settings";
const DEFAULT_SETTINGS: RunpodSettings = {
  baseUrl: "https://w7b1n4oihy7pv7-8000.proxy.runpod.net/v1",
  apiKey: "anda",
  modelName: "google/gemma-4-E4B-it",
  backendUrl: "http://localhost:5000",
};

function loadSettings(): RunpodSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: RunpodSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

function formatBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderContent(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "---") {
      if (inList) { result.push("</div>"); inList = false; }
      result.push('<div class="my-4 border-t border-[var(--border-light)]"></div>');
      continue;
    }

    if (/^[*-]\s/.test(trimmed)) {
      if (!inList) { result.push('<div class="flex flex-col gap-1.5 my-2">'); inList = true; }
      result.push(`<div class="flex gap-2"><span class="text-[var(--accent)] shrink-0">•</span><span>${formatBold(trimmed.replace(/^[*-]\s/, ""))}</span></div>`);
      continue;
    }

    if (/^\d+[\.\u0964]\s/.test(trimmed) || /^[০-৯]+[\.\u0964]\s/.test(trimmed)) {
      if (!inList) { result.push('<div class="flex flex-col gap-2 my-2">'); inList = true; }
      const match = trimmed.match(/^(\d+[\.\u0964])\s(.+)$/);
      if (match) {
        result.push(`<div class="flex gap-2"><span class="text-[var(--accent)] font-semibold shrink-0">${match[1]}</span><span>${formatBold(match[2])}</span></div>`);
      } else {
        result.push(`<div>${formatBold(trimmed)}</div>`);
      }
      continue;
    }

    if (inList) { result.push("</div>"); inList = false; }

    if (trimmed === "") {
      result.push('<div class="h-2"></div>');
    } else {
      result.push(`<div>${formatBold(trimmed)}</div>`);
    }
  }

  if (inList) result.push("</div>");
  return result.join("\n");
}

function MessageContent({ text, isUser }: { text: string; isUser: boolean }) {
  if (!text) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[var(--ink-muted)] typing-dot" style={{ animationDelay: "0s" }} />
        <span className="h-2 w-2 rounded-full bg-[var(--ink-muted)] typing-dot" style={{ animationDelay: "0.15s" }} />
        <span className="h-2 w-2 rounded-full bg-[var(--ink-muted)] typing-dot" style={{ animationDelay: "0.3s" }} />
      </span>
    );
  }

  if (isUser) {
    return <div className="whitespace-pre-wrap text-sm md:text-[15px] leading-[1.75]">{text}</div>;
  }

  return (
    <div
      className="bn text-sm md:text-[15px] leading-[1.85] space-y-1"
      dangerouslySetInnerHTML={{ __html: renderContent(text) }}
    />
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "আমি **Ain-Bondhu**, আপনার শ্রমিক অধিকার সহায়ক। আপনার সমস্যার বিবরণ দিন — আমি আপনাকে আইনগত তথ্য ও করণীয় সম্পর্কে জানাব এবং প্রয়োজনে আনুষ্ঠানিক অভিযোগপত্র তৈরি করে দেব।",
    },
  ]);
  const [mode, setMode] = useState<"offline" | "online">("offline");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<RunpodSettings>(DEFAULT_SETTINGS);
  const [pendingSettings, setPendingSettings] = useState<RunpodSettings>(DEFAULT_SETTINGS);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const isListeningRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);
  const streamTargetRef = useRef(-1);

  useEffect(() => {
    const saved = loadSettings();
    setSettings(saved);
    setPendingSettings(saved);
  }, []);

  const runHealthCheck = useCallback(async (cfg: RunpodSettings) => {
    const backendUrl = cfg.backendUrl || "http://localhost:5000";
    try {
      const res = await fetch(`${backendUrl}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runpod_config: {
            base_url: cfg.baseUrl,
            api_key: cfg.apiKey,
            model: cfg.modelName,
          },
        }),
      });
      const data = await res.json();
      setMode(data.status === "online" ? "online" : "offline");
    } catch {
      setMode("offline");
    }
  }, []);

  useEffect(() => {
    if (settings.baseUrl) {
      runHealthCheck(settings);
    }
  }, [settings, runHealthCheck]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    const Ctor =
      (w.SpeechRecognition as new () => SpeechRecognition) ||
      (w.webkitSpeechRecognition as new () => SpeechRecognition);
    if (!Ctor) {
      setVoiceSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "bn-BD";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0]?.transcript) {
          if (result.isFinal) {
            finalTranscriptRef.current += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
      }
      setInput(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setInput(finalTranscriptRef.current);
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, []);

  const getRunpodConfig = useCallback(() => ({
    base_url: settings.baseUrl,
    api_key: settings.apiKey,
    model: settings.modelName,
  }), [settings]);

  const handleSend = async (
    overrideMessage?: string,
    opts?: { hideUser?: boolean; isLetter?: boolean }
  ) => {
    const text = (overrideMessage ?? input).trim();
    if (!text || mode !== "online" || isSending || isSendingRef.current) return;
    const hideUser = opts?.hideUser ?? false;
    const isLetter = opts?.isLetter ?? false;
    const userMsg: ChatMessage = { role: "user", content: text };

    const uiMessages = hideUser
      ? [...messages, { role: "assistant" as const, content: "", isLetter }]
      : [...messages, userMsg, { role: "assistant" as const, content: "", isLetter }];
    const reqMessages = [...messages, userMsg];

    streamTargetRef.current = uiMessages.length - 1;
    setMessages(uiMessages);
    if (!hideUser) setInput("");
    setIsSending(true);
    isSendingRef.current = true;

    try {
      const backendUrl = settings.backendUrl || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: reqMessages,
          runpod_config: getRunpodConfig(),
        }),
      });

      if (!res.body) {
        setIsSending(false);
        isSendingRef.current = false;
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partial = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        partial += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = partial.indexOf("\n")) !== -1) {
          const line = partial.slice(0, idx).trim();
          partial = partial.slice(idx + 1);
          if (!line || !line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (!delta) continue;
            setMessages((prev) => {
              const target = streamTargetRef.current;
              if (target < 0 || target >= prev.length) return prev;
              const updated = [...prev];
              updated[target] = { ...updated[target], content: updated[target].content + delta };
              return updated;
            });
          } catch {
            continue;
          }
        }
      }
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
      streamTargetRef.current = -1;
    }
  };

  const handleGenerateLetter = () => {
    const prompt =
      "উপরের কথোপকথনের ভিত্তিতে একটি আনুষ্ঠানিক অভিযোগপত্র লিখুন। ভাষা বাংলা, টোন আনুষ্ঠানিক ও ভদ্র। অভিযোগপত্রের শুরুতে উপযুক্ত শিরোনাম দিন। শেষে আপনার নাম এবং তারিখ উল্লেখ করুন।";
    handleSend(prompt, { hideUser: true, isLetter: true });
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    finalTranscriptRef.current = "";
    setInput("");
    isListeningRef.current = true;
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleDownloadPdf = async (letterContent: string) => {
    try {
      const backendUrl = settings.backendUrl || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/render-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letter: letterContent }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "abhiyogpatra.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleSaveSettings = () => {
    setSettings(pendingSettings);
    saveSettings(pendingSettings);
    setShowSettings(false);
  };

  const lastLetter = [...messages].reverse().find((m) => m.isLetter && m.content);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      {/* Header */}
      <header className="glass border-b border-[var(--border-light)] sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] text-white text-sm font-bold shadow-lg">
              AB
            </div>
            <div>
              <h1 className="bn text-lg font-semibold text-[var(--ink)] leading-tight">
                Ain-Bondhu
              </h1>
              <p className="text-[11px] text-[var(--ink-muted)] leading-tight">
                শ্রমিক অধিকার সহায়ক
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPendingSettings(settings);
                setShowSettings(true);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--ink)] transition-all"
              title="Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${
                mode === "online"
                  ? "bg-[var(--green-bg)] text-[var(--green)]"
                  : "bg-[var(--yellow-bg)] text-[var(--yellow)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  mode === "online" ? "bg-[var(--green)]" : "bg-[var(--yellow)]"
                }`}
              />
              {mode === "online" ? "চালু" : "অফলাইন"}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-6 md:px-8 overflow-y-auto">
        <div className="flex flex-col gap-5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex message-enter ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && !msg.isLetter && (
                <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-dark)] to-[var(--accent)]/60 text-[var(--ink)] text-[10px] font-bold shadow-sm">
                  AB
                </div>
              )}
              <div
                className={`${
                  msg.role === "user"
                    ? "max-w-[85%] md:max-w-[70%] bg-gradient-to-br from-[var(--bubble-user)] to-[#b03a3a] text-[var(--bubble-user-text)] rounded-2xl rounded-br-md"
                    : msg.isLetter
                    ? "max-w-[90%] md:max-w-[80%] bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-[var(--shadow-soft)] rounded-2xl"
                    : "max-w-[85%] md:max-w-[70%] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] rounded-2xl rounded-bl-md"
                } px-5 py-3.5 md:px-6 md:py-4`}
              >
                {msg.isLetter ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border-light)]">
                      <span className="text-[10px] font-semibold tracking-wider text-[var(--accent)] uppercase">
                        📄 অভিযোগপত্র
                      </span>
                    </div>
                    <MessageContent text={msg.content} isUser={false} />
                    {msg.content && (
                      <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-[var(--border-light)]">
                        <button
                          onClick={() => handleCopy(msg.content)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          কপি
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(msg.content)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] px-3.5 py-2 text-xs font-medium text-white hover:brightness-110 transition-all shadow-md"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          পিডিএফ
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <MessageContent text={msg.content} isUser={msg.role === "user"} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Letter preview banner */}
      {lastLetter && (
        <div className="border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-5 py-3 md:px-8">
          <div className="mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[var(--accent)] font-medium">📄 অভিযোগপত্র প্রস্তুত</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(lastLetter.content)}
                className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] transition-all"
              >
                কপি
              </button>
              <button
                onClick={() => handleDownloadPdf(lastLetter.content)}
                className="rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] px-3.5 py-1.5 text-xs font-medium text-white hover:brightness-110 transition-all shadow-md"
              >
                পিডিএফ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-5 py-4 md:px-8">
        <div className="mx-auto max-w-4xl">
          {mode === "offline" ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-sm text-[var(--ink-muted)]">মডেল অফলাইন। সেটিংসে URL দিন।</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-main)] px-4 py-2.5 input-ring transition-all">
                <button
                  onClick={handleToggleListening}
                  disabled={!voiceSupported}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    isListening
                      ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white shadow-md"
                      : "text-[var(--ink-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)]"
                  } disabled:opacity-40`}
                >
                  {isListening ? (
                    <>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2z" />
                      </svg>
                      <span>শুনছি</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span>ভয়েস</span>
                    </>
                  )}
                </button>
                {isListening && (
                  <div className="flex items-end gap-0.5 waveform">
                    <span className="h-3 w-1 rounded-full bg-[var(--accent)]" />
                    <span className="h-4 w-1 rounded-full bg-[var(--accent)]" style={{ animationDelay: "0.15s" }} />
                    <span className="h-5 w-1 rounded-full bg-[var(--accent)]" style={{ animationDelay: "0.3s" }} />
                    <span className="h-4 w-1 rounded-full bg-[var(--accent)]" style={{ animationDelay: "0.45s" }} />
                    <span className="h-3 w-1 rounded-full bg-[var(--accent)]" style={{ animationDelay: "0.6s" }} />
                  </div>
                )}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="আপনার সমস্যা লিখুন..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-muted)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSend()}
                  disabled={isSending || !input.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] px-5 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-40 transition-all shadow-md"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                  পাঠান
                </button>
                <button
                  onClick={handleGenerateLetter}
                  disabled={messages.length < 4 || isSending}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border-light)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-40 transition-all"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  অভিযোগপত্র
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-light)] shadow-[var(--shadow-card)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="bn text-lg font-semibold text-[var(--ink)]">RunPod Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--ink-muted)] mb-1.5 block">Base URL</label>
                <input
                  value={pendingSettings.baseUrl}
                  onChange={(e) => setPendingSettings({ ...pendingSettings, baseUrl: e.target.value })}
                  placeholder="https://xxx-8000.proxy.runpod.net/v1"
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-main)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-focus)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-muted)] mb-1.5 block">API Key</label>
                <input
                  value={pendingSettings.apiKey}
                  onChange={(e) => setPendingSettings({ ...pendingSettings, apiKey: e.target.value })}
                  placeholder="anda"
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-main)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-focus)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-muted)] mb-1.5 block">Model Name</label>
                <input
                  value={pendingSettings.modelName}
                  onChange={(e) => setPendingSettings({ ...pendingSettings, modelName: e.target.value })}
                  placeholder="google/gemma-4-E4B-it"
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-main)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-focus)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-muted)] mb-1.5 block">Backend URL</label>
                <input
                  value={pendingSettings.backendUrl}
                  onChange={(e) => setPendingSettings({ ...pendingSettings, backendUrl: e.target.value })}
                  placeholder="http://localhost:5000"
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-main)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-focus)]"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] py-2.5 text-sm font-medium text-white hover:brightness-110 transition-all shadow-md"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
