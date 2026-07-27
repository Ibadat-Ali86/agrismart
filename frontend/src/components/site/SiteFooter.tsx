import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-primary-dark text-white/90">
      <div className="container mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="[&_span]:!text-white" />
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/70">
              Smart farming for a better tomorrow.
            </p>
          </div>
          <FooterCol
            title="Quick Links"
            links={[
              { to: "/features", label: "Features" },
              { to: "/marketplace", label: "Marketplace" },
              { to: "/pricing", label: "Pricing" },
              { to: "/about", label: "About Us" },
            ]}
          />
          <FooterCol
            title="Support"
            links={[
              { to: "/help", label: "Help Center" },
              { to: "/contact", label: "Contact Us" },
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/terms", label: "Terms of Service" },
            ]}
          />
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Follow Us
            </h4>
            <div className="mt-4 flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-primary"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-1.5 text-sm text-white/70">
              Made with <Heart className="size-4 fill-red-400 text-red-400" /> for Farmers
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <p>© 2025 AgriSmart Technologies Pvt. Ltd. All rights reserved.</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-white/70 transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}


export default FooterCol;
