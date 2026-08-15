import { useEffect, useState } from "react";
import type { UserRole } from "@shared/types";
import { Icon } from "@/components/ui";
import { useLanguage } from "@/lib/language";

interface SlideItem {
  icon: string;
  title: string;
  description: string;
}

export function AuthSlideshow({
  role,
  variant = "card",
}: {
  role: UserRole | "respondent" | "researcher";
  variant?: "card" | "panel";
}) {
  const { language } = useLanguage();
  const isAm = language === "am";

  const RESEARCHER_SLIDES: SlideItem[] = [
    {
      icon: "fingerprint",
      title: isAm ? "በመታወቂያ የተረጋገጠ ፓነል" : "ID-verified panel",
      description: isAm
        ? "እያንዳንዱ ተሳታፊ ወደ ገበያው ከመግባቱ በፊት ጥብቅ የማንነት ማረጋገጫ ያልፋል።"
        : "Every respondent undergoes rigorous identity verification before entering the marketplace.",
    },
    {
      icon: "security",
      title: isAm ? "ግልጽ የማጭበርበር ፍተሻዎች" : "Deterministic fraud checks",
      description: isAm
        ? "የቀጥታ ባህሪ ትንተና እና አውቶማቲክ ፍተሻዎች ዝቅተኛ ጥራት ያላቸውን መረጃዎች ያጣራሉ።"
        : "Real-time behavioral analysis and programmatic screening filters out low-quality data.",
    },
    {
      icon: "account_balance_wallet",
      title: isAm ? "የተጠበቁ በጀቶች" : "Reserved budgets",
      description: isAm
        ? "ያልተጠበቁ ተጨማሪ ወጪዎች የሌሉበት ግልጽ የዋጋ አሰጣጥ። ምን እንደሚያወጡ ሙሉ በሙሉ ይቆጣጠራሉ።"
        : "Transparent pricing with no surprise costs. You control exactly what you spend.",
    },
  ];

  const RESPONDENT_SLIDES: SlideItem[] = [
    {
      icon: "verified_user",
      title: isAm ? "ማንነትዎን ያረጋግጡ" : "Verify Identity",
      description: isAm
        ? "የፋይዳ ዲጂታል መታወቂያዎን አንድ ጊዜ ያገናኙ። አስተማማኝ ማረጋገጫ ማንነትዎን ይጠብቃል::"
        : "Connect your Fayda digital ID once. Cryptographic verification secures your identity with zero duplicate accounts.",
    },
    {
      icon: "quiz",
      title: isAm ? "ጥናቶችን ያግኙ" : "Find Surveys",
      description: isAm
        ? "ከእርስዎ ልምድ፣ ክልል እና የቋንቋ ምርጫዎች ጋር የሚጣጣሙ የጥናት ግብዣዎችን ይቀበሉ።"
        : "Receive targeted survey invitations matched to your background, region, and language preferences.",
    },
    {
      icon: "account_balance_wallet",
      title: isAm ? "ሽልማቶችን ያግኙ" : "Earn Rewards",
      description: isAm
        ? "ለእያንዳንዱ ላጠናቀቁት ጥናት ተመጣጣኝ ክፍያ ያግኙ እና በቀጥታ ወደ ቴሌብር ወይም ሲቢኢ ብር ያውጡ።"
        : "Get rewarded fairly for every completed study and withdraw directly to Telebirr or CBE Birr.",
    },
  ];

  const slides = role === "researcher" ? RESEARCHER_SLIDES : RESPONDENT_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  // ─── Panel variant: matches Stitch left-panel trust narrative ───
  if (variant === "panel") {
    const heroTitle =
      role === "researcher"
        ? "Access verified respondents you can trust"
        : "Earn by sharing your unique perspective.";

    return (
      <div
        className="flex flex-col h-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-[8vh]">
          <span className="font-title-md text-title-md text-primary tracking-tight font-bold">Ethosk</span>
        </div>

        {/* Hero headline */}
        <h1 className="font-display-lg text-4xl xl:text-5xl font-extrabold text-on-primary-fixed max-w-md leading-tight tracking-tight">
          {heroTitle}
        </h1>

        {/* Trust indicators */}
        <div className="flex flex-col gap-6 mt-12 mb-8 flex-1">
          {slides.map((slide, idx) => (
            <div
              className="flex items-start gap-4 group cursor-pointer"
              key={idx}
              onClick={() => setCurrentIndex(idx)}
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-primary text-white shadow-lg scale-110"
                    : "bg-surface-variant text-on-primary-fixed shadow-sm"
                }`}
                style={{ boxShadow: "0 4px 20px rgba(0,89,133,0.08)" }}
              >
                <span className="material-symbols-outlined">{slide.icon}</span>
              </div>
              <div>
                <h3 className="font-title-lg text-title-lg text-on-primary-fixed font-bold">
                  {slide.title}
                </h3>
                <p
                  className={`font-body-lg text-body-lg mt-1 transition-all duration-300 ${
                    idx === currentIndex
                      ? "text-on-primary-fixed opacity-100 max-h-20"
                      : "text-on-primary-fixed-variant opacity-70 max-h-12 overflow-hidden"
                  }`}
                >
                  {slide.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 pt-4">
          {slides.map((_, index) => (
            <button
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-3 bg-on-primary-fixed/20 hover:bg-on-primary-fixed/40"
              }`}
              key={index}
              onClick={() => setCurrentIndex(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Card variant: standalone glassmorphic card (fallback) ───
  const current = slides[currentIndex]!;

  return (
    <div
      className="hidden lg:flex flex-1 flex-col justify-between p-10 glass-silk rounded-3xl border border-white/60 shadow-xl max-w-lg xl:max-w-xl min-h-[580px] relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 via-transparent to-inverse-primary/20 pointer-events-none z-0" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-headline-lg text-primary font-bold">Ethosk</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
              {role === "researcher" ? "Researcher Portal" : "Respondent Portal"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 my-auto py-6 space-y-5">
        <div className="w-14 h-14 rounded-2xl primary-gradient-btn flex items-center justify-center text-white shadow-md border border-white/40">
          <Icon className="text-3xl" name={current.icon} />
        </div>

        <h2 className="text-2xl xl:text-3xl font-headline-lg font-bold text-primary tracking-tight">
          {current.title}
        </h2>

        <p className="text-on-surface-variant font-body-md text-base leading-relaxed">
          {current.description}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/40 pt-5">
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-primary shadow-xs"
                  : "w-2 bg-primary/20 hover:bg-primary/40"
              }`}
              key={index}
              onClick={() => setCurrentIndex(index)}
              type="button"
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            aria-label="Previous slide"
            className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 border border-white/40 flex items-center justify-center text-primary transition-colors shadow-xs"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            type="button"
          >
            <Icon className="text-lg" name="chevron_left" />
          </button>
          <button
            aria-label="Next slide"
            className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 border border-white/40 flex items-center justify-center text-primary transition-colors shadow-xs"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
            type="button"
          >
            <Icon className="text-lg" name="chevron_right" />
          </button>
        </div>
      </div>
    </div>
  );
}
