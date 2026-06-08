import { Link } from "react-router-dom";

import accessibleLogo from "../assets/accessiblelogo.png";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Features", to: "/#features" },
  { label: "How it works", to: "/#how-it-works" },
  { label: "Staff login", to: "/login" },
  { label: "Sign up", to: "/signup" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-block">
              <img
                src={accessibleLogo}
                alt="Accessible Publishers Ltd"
                className="h-10 w-auto max-w-[260px] rounded-md bg-white object-contain object-left p-1"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              Accessible Knowledge Base helps staff at Accessible Publishers
              Limited learn company history, products, and workplace skills in
              one organized platform.
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              For progressive minds · Since 1996
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick links
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>Accessible Publishers Limited</li>
              <li>Lagos, Nigeria</li>
              <li>
                <a
                  href="mailto:info@accessiblepublishers.com"
                  className="transition hover:text-white"
                >
                  info@accessiblepublishers.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Accessible Publishers Limited. All rights reserved.</p>
          <p>Formerly Rasmed Publications Limited</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
