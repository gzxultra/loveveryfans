/**
 * CommentInviteCard — A warm, prominent invitation to leave feedback.
 *
 * Placed mid-page (after the kit grid) so users encounter it naturally
 * while browsing, rather than only at the very bottom. Features a
 * floating-style design with a soft gradient background and animated
 * heart/sparkle accents.
 */
import { MessageCircle, Heart, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentInviteCardProps {
  onInviteClick: () => void;
}

export default function CommentInviteCard({ onInviteClick }: CommentInviteCardProps) {
  const { lang, t } = useLanguage();

  return (
    <section className="py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center cursor-pointer group"
          style={{
            background:
              "linear-gradient(135deg, #FFF8F0 0%, #FFF0F5 40%, #F0F8FF 100%)",
            border: "1.5px solid #F0E8DC",
            boxShadow:
              "0 4px 24px rgba(61,50,41,0.07), 0 1px 4px rgba(61,50,41,0.04)",
          }}
          onClick={onInviteClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onInviteClick()}
          aria-label={t("留言反馈", "Leave feedback")}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #FFB5C8 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #B5D5FF 0%, transparent 70%)",
            }}
          />

          {/* Icon cluster */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FFE4EC] flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-[#FF6B8A] fill-[#FF6B8A]" />
            </div>
            <div className="w-12 h-12 rounded-full bg-[#E8F4FF] flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-[#5B9BD5]" />
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-[#F5A623]" />
            </div>
          </div>

          {/* Headline */}
          <h3 className="font-display text-xl sm:text-2xl text-[#1a1108] mb-2 leading-snug">
            {t(
              "你的经验，对其他父母很有帮助 ✨",
              "Your experience helps other parents ✨"
            )}
          </h3>

          {/* Sub-text */}
          <p className="text-sm sm:text-base text-[#6B5E50] max-w-md mx-auto mb-6 leading-relaxed">
            {t(
              "用过 Lovevery？有什么感受或建议？留下几句话，让更多父母受益吧！",
              "Used Lovevery? Share your thoughts and help other parents make the best choice for their little ones."
            )}
          </p>

          {/* CTA button */}
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3D3229] text-white rounded-full text-sm font-medium
              hover:bg-[#2A231C] hover:shadow-lg hover:shadow-[#3D3229]/25 hover:scale-[1.03]
              transition-all duration-300 active:scale-[0.97] min-h-[48px]"
            onClick={(e) => {
              e.stopPropagation();
              onInviteClick();
            }}
          >
            <MessageCircle className="w-4 h-4" />
            {t("写下我的感受", "Share My Experience")}
          </button>

          {/* Social proof hint */}
          <p className="mt-4 text-xs text-[#9B8E7E]">
            {t(
              "已有很多父母分享了他们的故事 💬",
              "Many parents have already shared their stories 💬"
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
