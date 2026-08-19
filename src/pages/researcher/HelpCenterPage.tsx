import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "How long does admin approval take for new surveys and IRB clearance documents?",
    answer:
      "Administrative legibility and quality checks typically complete within 2 business hours during Addis Ababa operational hours (Monday to Friday, 8:30 AM to 5:30 PM EAT). Urgent institutional requests can be flagged directly to our operations desk.",
  },
  {
    id: "faq-2",
    question: "How is respondent incentive money protected during an active study?",
    answer:
      "Escrow funds are locked securely in institutional custody upon survey posting. Payouts to verified respondents are executed via Telebirr or CBE Birr only after automated fraud heuristics and attention checks pass.",
  },
  {
    id: "faq-3",
    question: "Can I export raw response data in CSV or SPSS formats?",
    answer:
      "Yes, Pro tier researchers can export full anonymized dataset schemas, demographic cross-tabs, and raw response tables directly from the Analytics dashboard at any point during or after fieldwork.",
  },
  {
    id: "faq-4",
    question: "What happens if an uploaded Fayda ID or Kebele document is flagged as illegible?",
    answer:
      "Researchers and respondents receive an immediate notification with specific resubmission instructions. The review queue prioritizes updated document uploads for rapid re-evaluation within 1 hour.",
  },
];

const CATEGORIES = [
  {
    title: "Survey Building & AI Schema",
    description: "Guides on logic, voice surveys, and AI prompt schemas.",
    icon: "psychology",
    color: "bg-[#dde9ff] text-[#001d29]",
  },
  {
    title: "Targeting & Verification",
    description: "Fayda gating, demographic filtering, and algorithms.",
    icon: "verified_user",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Wallet, Escrow & Invoicing",
    description: "Funding in ETB, Telebirr/CBE deposits, tax receipts.",
    icon: "account_balance_wallet",
    color: "bg-[#eff4ff] text-[#2872A1]",
  },
  {
    title: "IRB & Ethics Review",
    description: "Ethical clearance letters and approval timelines.",
    icon: "gavel",
    color: "bg-amber-50 text-amber-700",
  },
];

const POPULAR_TAGS = [
  "Survey Building",
  "Fayda Verification",
  "Escrow Payouts",
  "IRB Clearance",
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = FAQS.filter(
    (faq) =>
      !searchQuery.trim() ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-[1100px] mx-auto w-full pb-20 space-y-12 animate-fade-in">
      {/* ── Hero Search Section (Stitch Spec) ── */}
      <div className="text-center space-y-4 pt-4 max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tight text-[#001d29]">
          How can we help your research today?
        </h1>
        <p className="text-xs md:text-sm text-[#41484c] leading-relaxed">
          Explore documentation, study design best practices, Fayda verification guidelines, and billing support.
        </p>

        {/* Search Bar */}
        <div className="pt-2">
          <div className="relative group max-w-xl mx-auto">
            <Icon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71787c] group-focus-within:text-[#001d29] text-[22px]"
              name="search"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, guides, API endpoints, or billing terms..."
              className="w-full pl-12 pr-24 py-3.5 bg-white border border-[#c1c7cc]/60 rounded-2xl text-xs md:text-sm text-[#001d29] focus:outline-none focus:border-[#001d29] focus:ring-1 focus:ring-[#001d29] shadow-sm transition-all outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
              <span className="font-mono text-[10px] text-[#71787c] bg-[#f8f9ff] border border-[#c1c7cc]/40 px-2 py-0.5 rounded">
                Press /
              </span>
            </div>
          </div>

          {/* Popular Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-[#71787c]">
            <span className="font-semibold text-[#41484c]">Popular:</span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="px-3 py-1 bg-white border border-[#c1c7cc]/40 hover:border-[#001d29] text-[#001d29] rounded-full text-xs font-medium transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Cards Grid (2x2) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.title}
            onClick={() => setSearchQuery(cat.title.split(" ")[0] || "")}
            className="bg-white rounded-2xl border border-[#c1c7cc]/40 p-6 flex items-start gap-4 hover:border-[#001d29]/40 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
              <Icon className="text-[24px]" name={cat.icon} />
            </div>
            <div>
              <h2 className="font-headline font-bold text-base md:text-lg text-[#001d29] group-hover:text-[#003345] transition-colors mb-1">
                {cat.title}
              </h2>
              <p className="text-xs text-[#41484c] leading-relaxed">
                {cat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Frequently Asked Questions (Accordion) ── */}
      <div className="space-y-4">
        <h2 className="font-headline text-xl md:text-2xl font-bold text-[#001d29]">
          Frequently Asked Questions
        </h2>

        <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 divide-y divide-[#c1c7cc]/20 overflow-hidden shadow-2xs">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71787c]">
              No articles found matching "{searchQuery}". Try searching for another topic or submit a support ticket below.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f8f9ff]/50 transition-colors"
                  >
                    <span className="font-semibold text-xs md:text-sm text-[#001d29]">
                      {faq.question}
                    </span>
                    <Icon
                      className={`text-[20px] text-[#71787c] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      name="expand_more"
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-[#41484c] leading-relaxed bg-[#f8f9ff]/30">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Bottom Support Banner (Stitch Spec) ── */}
      <div className="bg-[#003345] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-3 max-w-xl">
          <h2 className="font-headline text-xl md:text-2xl font-bold">
            Still need assistance?
          </h2>
          <p className="text-xs md:text-sm text-[#d3e3ff]">
            Contact our local operations team in Addis Ababa.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-mono">
              <Icon className="text-[14px]" name="schedule" />
              <span>Mon–Fri, 8:30 AM – 5:30 PM EAT</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-mono">
              <Icon className="text-[14px]" name="bolt" />
              <span>&lt; 30 mins</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link
            to="/#how"
            className="px-5 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 text-xs font-semibold transition-colors text-center flex items-center justify-center gap-1.5"
          >
            <span>Read Full API &amp; Dev Docs</span>
            <Icon className="text-[16px]" name="arrow_forward" />
          </Link>

          <button
            type="button"
            onClick={() => setTicketModalOpen(true)}
            className="px-6 py-3 bg-white text-[#001d29] hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors text-center shadow-xs cursor-pointer"
          >
            Submit Support Ticket
          </button>
        </div>
      </div>

      {/* Support Ticket Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-[#c1c7cc]/30">
              <h3 className="font-headline font-bold text-lg text-[#001d29]">
                Submit Support Ticket
              </h3>
              <button
                type="button"
                onClick={() => {
                  setTicketModalOpen(false);
                  setTicketSent(false);
                }}
                className="text-[#71787c] hover:text-[#001d29] cursor-pointer"
              >
                <Icon className="text-[20px]" name="close" />
              </button>
            </div>

            {ticketSent ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Icon className="text-[30px]" name="check_circle" />
                </div>
                <h4 className="font-headline font-bold text-base text-[#001d29]">
                  Ticket Submitted Successfully!
                </h4>
                <p className="text-xs text-[#41484c]">
                  Our research operations team in Addis Ababa will reply within 30 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTicketModalOpen(false);
                    setTicketSent(false);
                  }}
                  className="px-6 py-2.5 bg-[#001d29] text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setTicketSent(true);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-[#001d29] mb-1">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., IRB clearance letter question"
                    className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg outline-none focus:ring-1 focus:ring-[#001d29]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#001d29] mb-1">
                    Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your question or issue in detail..."
                    className="w-full p-3 border border-[#c1c7cc] rounded-lg outline-none focus:ring-1 focus:ring-[#001d29] resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTicketModalOpen(false)}
                    className="px-4 py-2 border border-[#c1c7cc] rounded-xl font-semibold text-[#71787c]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#001d29] hover:bg-[#003345] text-white rounded-xl font-bold cursor-pointer"
                  >
                    Send Ticket
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
