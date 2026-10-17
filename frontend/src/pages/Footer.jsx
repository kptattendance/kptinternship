import { Mail, MapPin, Phone } from "lucide-react";

const QUICK_LINKS = [
  { label: "KPT Website", href: "https://gpt.karnataka.gov.in/kptmangalore/public/112/milestones/en" },
  { label: "Our Campus", href: "https://gpt.karnataka.gov.in/kptmangalore/public/10/campus-map/en" },
  { label: "Admissions", href: "https://gpt.karnataka.gov.in/kptmangalore/public/50/fee-structure/en" },
  { label: "Contact Us", href: "https://gpt.karnataka.gov.in/kptmangalore/public/18/contact/en" },
];

const RESOURCES = [
  { label: "Placements", href: "https://gpt.karnataka.gov.in/kptmangalore/public/44/recently-visited-companies/en" },
  { label: "Principal", href: "https://gpt.karnataka.gov.in/kptmangalore/public/57/list-of-principal%27s-/en" },
  { label: "Alumni", href: "https://kptalumni.org/" },
  { label: "Events", href: "https://gpt.karnataka.gov.in/kptmangalore/public/115/events-/en" },
];

function LinkList({ title, links }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold tracking-widest text-pink-300 uppercase">
        {title}
      </h2>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-100/80 transition hover:translate-x-0.5 hover:text-white"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950 text-indigo-100">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* College */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="rounded-2xl bg-white p-2 shadow-lg">
            <img src="/logo.jpg" alt="KPT Logo" loading="lazy" className="h-16 w-auto" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">
            Karnataka (Govt.) Polytechnic
          </h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-indigo-100/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
            Kadri Hills, Mangaluru, Karnataka - 575004
          </p>
          <a
            href="mailto:kptmng@gmail.com"
            className="mt-1 flex items-center gap-2 text-sm text-indigo-100/80 hover:text-white"
          >
            <Mail className="h-4 w-4 text-pink-300" />
            kptmng@gmail.com
          </a>
        </div>

        <LinkList title="Quick Links" links={QUICK_LINKS} />
        <LinkList title="Resources" links={RESOURCES} />

        {/* Contact */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="rounded-2xl bg-white p-2 shadow-lg">
            <img src="/logo2.png" alt="KPT 75 Logo" loading="lazy" className="h-16 w-auto" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">Contact Details</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-indigo-100/80">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
            (0824) - 3516910, 3542476, 2211636, 3515889
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-center text-xs text-indigo-100/70 sm:flex-row lg:px-8">
          <p>
            © {new Date().getFullYear()} Karnataka (Govt.) Polytechnic, Mangaluru — All
            Rights Reserved
          </p>
          <p>Maintained by KPT CSE final year students</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
