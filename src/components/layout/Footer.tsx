import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full pt-16 pb-12 px-8 mt-auto bg-white/40 backdrop-blur-3xl text-on-surface-variant font-body-md border-t border-white/40 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 max-w-7xl mx-auto relative z-10">
      <div className="col-span-1 lg:col-span-2 flex flex-col gap-5">
        <div className="flex items-center gap-2 mb-1 opacity-90 hover:opacity-100 transition-opacity">
          <Link className="text-xl font-headline-lg text-primary" to="/">
            Ethosk
          </Link>
        </div>
        <p className="text-on-surface-variant/80 max-w-xs leading-relaxed font-body-md">
          Empowering trusted research across Ethiopia through verified participants and high-quality data.
        </p>
        <p className="mt-6 text-[10px] font-label-caps text-on-surface-variant/60 uppercase tracking-widest">
          © 2024 Ethosk Research.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-label-caps text-primary uppercase tracking-widest mb-1">Product</h4>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/learn/researchers">
          Research Workspace
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/learn/respondents">
          Verified Respondents
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/pricing">
          Pricing
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          Integrations
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-label-caps text-primary uppercase tracking-widest mb-1">Resources</h4>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          Documentation
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          Help Center
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          API Reference
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          Blog
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-label-caps text-primary uppercase tracking-widest mb-1">Company</h4>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          About Us
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          Careers
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          Privacy Policy
        </Link>
        <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md" to="/trust">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
