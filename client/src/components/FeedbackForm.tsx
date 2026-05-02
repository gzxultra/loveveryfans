import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";
import { MessageCircle, Send, CheckCircle, AlertCircle, Heart } from "lucide-react";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mqedbdyw";

type FormStatus = "idle" | "sending" | "success" | "error";

export default function FeedbackForm() {
  const { lang } = useLanguage();
  const i18n = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setStatus("sending");

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || "(not provided)",
          message: message.trim(),
          _subject: `Lovevery Kit Guide Feedback from ${name.trim()}`,
        }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const resetForm = () => {
    setStatus("idle");
  };

  // Success state
  if (status === "success") {
    return (
      <section id="feedback" className="py-12 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
            style={{
              background: "linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%)",
              border: "1.5px solid #C8E6C9",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-[#7FB685]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#7FB685]" />
            </div>
            <h3 className="font-display text-2xl text-[#1a1108] mb-2">
              {i18n.feedback.successTitle[lang]}
            </h3>
            <p className="text-[#6B5E50] mb-6">{i18n.feedback.successDesc[lang]}</p>
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#7FB685] rounded-full hover:bg-[#6aa872] transition-colors"
            >
              {i18n.feedback.sendAnother[lang]}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <section id="feedback" className="py-12 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
            style={{
              background: "linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%)",
              border: "1.5px solid #FECACA",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-display text-2xl text-[#1a1108] mb-2">
              {i18n.feedback.errorTitle[lang]}
            </h3>
            <p className="text-[#6B5E50] mb-6">{i18n.feedback.errorDesc[lang]}</p>
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#3D3229] rounded-full hover:bg-[#2A231C] transition-colors"
            >
              {i18n.feedback.retry[lang]}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Default form state
  return (
    <section id="feedback" className="py-12 sm:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gradient card wrapper */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #FFF8F2 0%, #FFF3F8 50%, #F5F8FF 100%)",
            border: "1.5px solid #EDE5DC",
            boxShadow: "0 8px 32px rgba(61,50,41,0.08), 0 2px 8px rgba(61,50,41,0.04)",
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25 pointer-events-none"
            style={{ background: "radial-gradient(circle, #FFB5C8 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #B5D5FF 0%, transparent 70%)" }}
          />

          <div className="relative p-6 sm:p-10">
            {/* Section header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FFE4EC] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#FF6B8A] fill-[#FF6B8A]" />
                </div>
                <div className="w-12 h-12 rounded-full bg-[#E8F4FF] flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#5B9BD5]" />
                </div>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-[#1a1108] mb-2">
                {lang === "cn"
                  ? "和我们分享你的故事 💬"
                  : "Share Your Story With Us 💬"}
              </h2>
              <p className="text-sm sm:text-base text-[#6B5E50] max-w-lg mx-auto leading-relaxed">
                {lang === "cn"
                  ? "你的经历和建议，能帮助更多父母做出更好的选择。每一条留言我们都会认真阅读。"
                  : "Your experience and suggestions help other parents make better choices. We read every message carefully."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name + Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="feedback-name"
                    className="block text-sm font-medium text-[#3D3229] mb-1.5"
                  >
                    {i18n.feedback.nameLabel[lang]}
                    <span className="text-[#E8A87C] ml-0.5">*</span>
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={i18n.feedback.namePlaceholder[lang]}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFD3] bg-white/80 text-sm text-[#3D3229] placeholder-[#B0A89E] outline-none focus:ring-2 focus:ring-[#7FB685]/30 focus:border-[#7FB685]/50 transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="feedback-email"
                    className="block text-sm font-medium text-[#3D3229] mb-1.5"
                  >
                    {i18n.feedback.emailLabel[lang]}
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={i18n.feedback.emailPlaceholder[lang]}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFD3] bg-white/80 text-sm text-[#3D3229] placeholder-[#B0A89E] outline-none focus:ring-2 focus:ring-[#7FB685]/30 focus:border-[#7FB685]/50 transition-all"
                  />
                </div>
              </div>

              {/* Message field */}
              <div>
                <label
                  htmlFor="feedback-message"
                  className="block text-sm font-medium text-[#3D3229] mb-1.5"
                >
                  {i18n.feedback.messageLabel[lang]}
                  <span className="text-[#E8A87C] ml-0.5">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    lang === "cn"
                      ? "比如：我们用了哪个 Kit，宝宝最喜欢哪个玩具，有什么建议……"
                      : "e.g. Which kit we used, which toy our baby loved most, any suggestions..."
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#E8DFD3] bg-white/80 text-sm text-[#3D3229] placeholder-[#B0A89E] outline-none focus:ring-2 focus:ring-[#7FB685]/30 focus:border-[#7FB685]/50 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <p className="text-xs text-[#9B8E7E]">
                  {lang === "cn" ? "* 为必填项" : "* Required fields"}
                </p>
                <button
                  type="submit"
                  disabled={status === "sending" || !name.trim() || !message.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3D3229] text-white rounded-full text-sm font-medium
                    hover:bg-[#2A231C] hover:shadow-lg hover:shadow-[#3D3229]/20 hover:scale-[1.02]
                    transition-all duration-300 active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    min-h-[48px]"
                >
                  {status === "sending" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {i18n.feedback.sending[lang]}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {i18n.feedback.submit[lang]}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
