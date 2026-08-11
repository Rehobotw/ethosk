import { useEffect } from "react";
import { Link } from "react-router-dom";

export function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 md:px-12 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-fixed/30 blur-[150px] rounded-full z-[-1]" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Left Side */}
          <div className="flex-1 flex flex-col gap-6 reveal active">
            <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-display-lg text-primary leading-[1.05]">
              Verified<br />Survey<br />Platforms
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl mt-2 leading-relaxed font-body-lg">Run trusted research with verified Ethiopian respondents</p>
            <div className="flex flex-wrap gap-4 pt-6">
              <Link to="/signup?role=researcher">
                <button className="magnetic-btn primary-gradient-btn px-8 py-4 rounded-xl font-body-lg flex items-center justify-between gap-6 shadow-xl hover:shadow-2xl transition-all min-w-[220px] hover:-translate-y-1 active:scale-95" type="button">
                  <span className="flex flex-col items-start text-left leading-tight"><span className="text-lg text-white">Start Survey</span></span>
                  <span className="material-symbols-outlined text-xl bg-white/20 p-2 rounded-full text-white">arrow_forward</span>
                </button>
              </Link>
              <Link to="/signup?role=respondent">
                <button className="magnetic-btn glass-silk text-primary px-8 py-4 rounded-xl font-body-lg transition-all min-w-[220px] text-center leading-tight hover:-translate-y-1 active:scale-95" type="button">Start Response</button>
              </Link>
            </div>
          </div>
          {/* Right Side: AI Quality Monitor */}
          <div className="flex-1 w-full max-w-2xl relative reveal delay-200 active">
            <div className="absolute inset-0 bg-inverse-primary/30 blur-[120px] rounded-full z-[-1]" />
            <div className="glass-silk rounded-2xl overflow-hidden w-full aspect-[4/3] flex items-center justify-center relative z-0 border-white/60">
              <img alt="Premium abstract data flow visualization" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700 mix-blend-multiply" src="/hero_cards.png" />
            </div>
          </div>
        </div>
      </section>

      {/* Three Steps */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center relative" id="how">
        <div className="absolute inset-0 bg-primary-fixed/20 blur-[150px] rounded-full z-[-1] opacity-60" />
        <div className="text-center mb-16 reveal active">
          <span className="text-xs font-label-caps text-surface-tint mb-4 block bg-white/60 backdrop-blur-xl border border-white/40 w-max mx-auto px-4 py-1.5 rounded-full shadow-sm">HOW IT WORKS</span>
          <h2 className="text-4xl md:text-5xl font-headline-lg text-primary">Three steps from question to defensible data</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Step 1 */}
          <div className="glass-silk rounded-2xl p-8 flex flex-col gap-6 reveal delay-100 active">
            <div className="flex justify-between items-start mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                <span className="material-symbols-outlined text-xl font-bold">tune</span>
              </div>
              <span className="text-primary/20 font-display-lg text-4xl">01</span>
            </div>
            <h3 className="font-title-md text-primary">Describe your sample</h3>
            <p className="font-body-md text-on-surface-variant">Set the demographics your study needs. The matched count updates live, and warns you before you send into a sample too small to support a finding.</p>
          </div>
          {/* Step 2 */}
          <div className="glass-silk rounded-2xl p-8 flex flex-col gap-6 reveal delay-200 active">
            <div className="flex justify-between items-start mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                <span className="material-symbols-outlined text-xl pl-0.5 font-bold">send</span>
              </div>
              <span className="text-primary/20 font-display-lg text-4xl">02</span>
            </div>
            <h3 className="font-title-md text-primary">Send to matched respondents</h3>
            <p className="font-body-md text-on-surface-variant">Only respondents who actually meet your filters are invited. Write in English and localise to Amharic or Afan Oromo in a click.</p>
          </div>
          {/* Step 3 */}
          <div className="glass-silk rounded-2xl p-8 flex flex-col gap-6 reveal delay-300 active">
            <div className="flex justify-between items-start mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl text-surface-tint flex items-center justify-center shadow-sm border border-white/60">
                <span className="material-symbols-outlined text-xl font-bold">insights</span>
              </div>
              <span className="text-primary/20 font-display-lg text-4xl">03</span>
            </div>
            <h3 className="font-title-md text-primary">Read results you can defend</h3>
            <p className="font-body-md text-on-surface-variant">Every response arrives with quality checks already applied, so you can see which ones to trust before you start analysing.</p>
          </div>
        </div>
      </section>

      {/* Response Quality */}
      <section className="py-24 px-6 md:px-12 w-full relative" id="product">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-fixed/30 to-transparent z-[-1]" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal active">
            <span className="text-xs font-label-caps text-surface-tint mb-4 block bg-white/60 backdrop-blur-xl border border-white/40 w-max mx-auto px-4 py-1.5 rounded-full shadow-sm">BUILT IN</span>
            <h2 className="text-4xl md:text-5xl font-headline-lg text-primary mb-4">The checks that make a response worth<br />analysing</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto font-body-lg">Sampling and quality control are part of the platform, not something you bolt on afterwards.</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Card */}
            <div className="flex-[2] glass-silk rounded-2xl p-10 flex flex-col justify-between reveal delay-100 active">
              <div>
                <h3 className="text-2xl font-title-md mb-4 text-primary">Response quality, scored deterministically</h3>
                <p className="text-on-surface-variant font-body-lg max-w-2xl mb-10">Timing, repeated answers, typing behaviour on long text, and a consistency check that quietly re-asks one of your questions in different words. A response is flagged or it is not, and you see the numbers behind the decision.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-pressed rounded-xl px-5 py-4 flex items-center gap-4 text-sm font-body-md text-primary border-white/60">
                  <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center border border-white/60 shadow-sm">
                    <span className="material-symbols-outlined text-surface-tint text-lg font-bold">timer</span>
                  </div> Time per question
                </div>
                <div className="glass-pressed rounded-xl px-5 py-4 flex items-center gap-4 text-sm font-body-md text-primary border-white/60">
                  <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center border border-white/60 shadow-sm">
                    <span className="material-symbols-outlined text-surface-tint text-lg font-bold">straighten</span>
                  </div> Straight-line detection
                </div>
                <div className="glass-pressed rounded-xl px-5 py-4 flex items-center gap-4 text-sm font-body-md text-primary border-white/60">
                  <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center border border-white/60 shadow-sm">
                    <span className="material-symbols-outlined text-surface-tint text-lg font-bold">keyboard</span>
                  </div> Typing and paste checks
                </div>
                <div className="glass-pressed rounded-xl px-5 py-4 flex items-center gap-4 text-sm font-body-md text-primary border-white/60">
                  <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center border border-white/60 shadow-sm">
                    <span className="material-symbols-outlined text-surface-tint text-lg font-bold">find_replace</span>
                  </div> Reworded consistency check
                </div>
              </div>
            </div>
            {/* Side Cards */}
            <div className="flex-1 flex flex-col gap-8">
              <div className="glass-silk rounded-2xl p-8 reveal delay-200 h-full flex flex-col active">
                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl flex items-center justify-center mb-5 text-surface-tint border border-white/60 shadow-sm">
                  <span className="material-symbols-outlined text-xl font-bold">fingerprint</span>
                </div>
                <h4 className="font-title-md mb-3 text-primary">Verified once, not repeatedly</h4>
                <p className="font-body-md text-on-surface-variant">Identity is confirmed against Fayda, Ethiopia&rsquo;s national digital ID, so the same person cannot hold two accounts. We store a hash, never the number.</p>
              </div>
              <div className="glass-silk rounded-2xl p-8 reveal delay-300 h-full flex flex-col active">
                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl flex items-center justify-center mb-5 text-surface-tint border border-white/60 shadow-sm">
                  <span className="material-symbols-outlined text-xl font-bold">security</span>
                </div>
                <h4 className="font-title-md mb-3 text-primary">Data rights built in</h4>
                <p className="font-body-md text-on-surface-variant">Consent is recorded per event, respondents see what was logged, and access to personal data is enforced at the row level.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Tiers */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto" id="verification">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 reveal active">
            <span className="text-xs font-label-caps text-surface-tint mb-4 block bg-white/60 backdrop-blur-xl border border-white/40 w-max px-4 py-1.5 rounded-full shadow-sm">VERIFICATION</span>
            <h2 className="text-4xl md:text-5xl font-headline-lg text-primary mb-6">You choose how much proof your study needs</h2>
            <p className="text-on-surface-variant font-body-lg mb-8">Each tier is a stronger claim about a respondent than the one below it, and you set the minimum when you build your audience. Raising it narrows the pool, which the matched count shows you immediately.</p>
            <Link to="/learn/researchers">
              <button className="magnetic-btn glass-silk text-primary px-8 py-4 rounded-xl font-body-lg transition-all min-w-[220px] text-center leading-tight hover:-translate-y-1 active:scale-95 border-white/60" type="button">
                <span className="material-symbols-outlined text-base font-bold align-middle mr-1 text-surface-tint">arrow_forward</span> How verification works
              </button>
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-6 w-full reveal delay-200 active">
            <div className="glass-silk rounded-2xl p-6 flex gap-5 items-start">
              <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-xl border border-white/60 text-primary flex items-center justify-center text-lg font-title-md shrink-0 shadow-sm">0</div>
              <div>
                <h4 className="font-title-md text-primary mb-1">Tier 0: Registered &amp; ID Verified</h4>
                <p className="font-body-md text-on-surface-variant">Email address and Fayda ID confirmed. One person holds one account, ensuring unique and reachable respondents.</p>
              </div>
            </div>
            <div className="glass-silk rounded-2xl p-6 flex gap-5 items-start relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl primary-gradient-btn text-white flex items-center justify-center text-lg font-title-md shrink-0 shadow-md border border-white/40">1</div>
              <div>
                <h4 className="font-title-md text-primary mb-1">Tier 1: Attribute &amp; Institution Verified</h4>
                <p className="font-body-md text-on-surface-variant">A document or registrar backs up the claimed institution or employer, providing the highest level of professional certainty.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full reveal active">
        <div className="glass-silk rounded-2xl p-16 text-center text-primary shadow-xl flex flex-col items-center border border-white/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary-fixed/40 blur-[120px] rounded-full z-[0]" />
          <div className="relative z-10 w-full flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-headline-lg mb-4 text-primary">Start with a sample you can trust</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto mb-10 font-body-lg">Create an account and build your first audience. You will see the matched count before you spend anything.</p>
            <div className="flex items-center gap-6">
              <Link to="/signup">
                <button className="primary-gradient-btn px-8 py-3.5 rounded-full font-body-lg flex items-center gap-2 shadow-md transform hover:-translate-y-0.5 text-sm magnetic-btn" type="button">
                  <span className="material-symbols-outlined text-lg font-bold text-white">add</span> <span className="text-white">Create an account</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
