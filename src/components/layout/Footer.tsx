import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function Footer() {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <footer className="w-full pt-16 pb-12 px-8 mt-auto bg-white/40 backdrop-blur-3xl text-on-surface-variant font-body-md border-t border-white/40 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 max-w-7xl mx-auto relative z-10">
      <div className="col-span-1 lg:col-span-2 flex flex-col gap-5">
        <div className="flex items-center gap-2 mb-1 opacity-90 hover:opacity-100 transition-opacity">
          <span className="text-xl font-headline-lg text-primary font-bold">Ethosk</span>
        </div>
        <p className="text-on-surface-variant/80 max-w-xs leading-relaxed font-body-md text-sm">
          {isAm
            ? "ከተረጋገጡ ተሳታፊዎች እና ጥራት ካለው መረጃ ጋር በመላው ኢትዮጵያ አስተማማኝ ምርምርን ማጎልበት።"
            : "Empowering trusted research across Ethiopia through verified participants and high-quality data."}
        </p>
        <p className="mt-6 text-[10px] font-label-caps text-on-surface-variant/60 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Ethosk Research. {isAm ? "መብቱ በህግ የተጠበቀ ነው::" : "All rights reserved."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-label-caps text-primary uppercase tracking-widest text-xs font-bold mb-1">
          {isAm ? "ምርት" : "Product"}
        </h4>
        <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" to="/signup/researcher">
          {isAm ? "የምርምር የስራ ቦታ" : "Research Workspace"}
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" to="/signup/respondent">
          {isAm ? "የተረጋገጡ ተሳታፊዎች" : "Verified Respondents"}
        </Link>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="/#pricing">
          {isAm ? "የዋጋ ዝርዝር" : "Pricing"}
        </a>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="/#features">
          {isAm ? "ተጨማሪ አገልግሎቶች" : "Integrations"}
        </a>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-label-caps text-primary uppercase tracking-widest text-xs font-bold mb-1">
          {isAm ? "ግብዓቶች" : "Resources"}
        </h4>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="/#features">
          {isAm ? "ሰነዶች እና መመሪያዎች" : "Documentation"}
        </a>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="/#how">
          {isAm ? "የእርዳታ ማዕከል" : "Help Center"}
        </a>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="/#verification">
          {isAm ? "የ API መመሪያ" : "API Reference"}
        </a>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="/#features">
          {isAm ? "ብሎግ" : "Blog"}
        </a>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-label-caps text-primary uppercase tracking-widest text-xs font-bold mb-1">
          {isAm ? "ድርጅት" : "Company"}
        </h4>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="mailto:contact@ethosk.org">
          {isAm ? "ስለ እኛ" : "About Us"}
        </a>
        <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" href="mailto:careers@ethosk.org">
          {isAm ? "የስራ ዕድሎች" : "Careers"}
        </a>
        <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" to="/privacy">
          {isAm ? "የግላዊነት ፖሊሲ" : "Privacy Policy"}
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors text-sm font-body-md" to="/terms">
          {isAm ? "የአገልግሎት ውሎች" : "Terms of Service"}
        </Link>
      </div>
    </footer>
  );
}
