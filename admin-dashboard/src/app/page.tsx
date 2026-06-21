import Link from 'next/link';
import {
  Truck, ArrowRight, Activity, Map, Package, Smartphone, CreditCard,
  BarChart3, ShieldCheck, Clock, Snowflake, Box, Container, Warehouse,
  CheckCircle2, MapPin, Phone, Mail,
} from 'lucide-react';

const STATS = [
  { value: '500+', label: 'Trucks in fleet' },
  { value: '12k', label: 'Loads / month' },
  { value: '98.7%', label: 'On-time delivery' },
  { value: '48', label: 'States covered' },
  { value: '2,400', label: 'Active drivers' },
  { value: '$18M', label: 'Driver payouts / yr' },
];

const FEATURES = [
  { icon: Activity, title: 'Live Dispatch Board', desc: 'See every driver, every open load, and every trip in motion — updated in real time over Socket.IO.' },
  { icon: Package, title: 'Full Load Lifecycle', desc: 'Track each load from OPEN through ASSIGNED, picked up, en route, and DELIVERED with a clean audit trail.' },
  { icon: Map, title: 'Real-time Tracking', desc: 'Live GPS location for active trips so dispatchers and customers always know where the freight is.' },
  { icon: Smartphone, title: 'Driver Mobile App', desc: 'Drivers accept loads, navigate, and submit proof-of-delivery photos right from their phone.' },
  { icon: CreditCard, title: 'Automated Payouts', desc: 'Payments are created automatically on delivery, with per-driver earnings and payout tracking.' },
  { icon: BarChart3, title: 'Operations Analytics', desc: 'Revenue, profit margin, and top-driver leaderboards with growth metrics, all in one view.' },
];

const FLEET = [
  { icon: Box, name: 'Dry Van', desc: 'General freight & palletized goods' },
  { icon: Snowflake, name: 'Reefer', desc: 'Temperature-controlled cargo' },
  { icon: Container, name: 'Flatbed', desc: 'Oversized & construction loads' },
  { icon: Warehouse, name: 'Step Deck', desc: 'Tall freight & heavy equipment' },
];

const STEPS = [
  { n: '01', title: 'Book the load', desc: 'Import from Uber Freight, DAT, Truckstop, and more — or create loads manually in seconds.' },
  { n: '02', title: 'Dispatch a driver', desc: 'Match the right driver and vehicle, then push the assignment straight to their mobile app.' },
  { n: '03', title: 'Deliver & get paid', desc: 'Drivers complete the trip with proof of delivery, and payouts are generated automatically.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ─── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">RoadTrix</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-accent transition-colors">Features</a>
            <a href="#fleet" className="hover:text-accent transition-colors">Fleet</a>
            <a href="#how" className="hover:text-accent transition-colors">How it works</a>
          </nav>
          <Link href="/login" className="btn-primary">
            Sign in <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent-900 to-accent-800 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Trusted logistics, end to end
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Move freight<br />
              <span className="text-white/70">smarter, faster,</span><br />
              on time.
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-xl">
              RoadTrix is the operations platform behind a modern trucking fleet — dispatch loads,
              track every trip live, and pay drivers automatically on delivery.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-accent-800 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors">
                Access the dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors">
                Explore features
              </a>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-white/50">
              <Clock className="w-4 h-4" /> Real-time dispatch · 24/7 fleet visibility
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats band ──────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-accent">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Platform</p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Everything dispatch needs, in one place</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            From the moment a load is booked to the second a driver is paid, RoadTrix keeps your whole operation in sync.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Fleet ───────────────────────────────────────────── */}
      <section id="fleet" className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Our fleet</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">The right equipment for every load</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              A 500-truck fleet spanning every major freight category, maintained and tracked around the clock.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLEET.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1">{name}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">How it works</p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">From booking to payout in three steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="text-5xl font-bold text-accent/20">{s.n}</span>
              <h3 className="font-semibold text-lg mt-3 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
          {['No load left untracked', 'Automatic driver payouts', 'Real-time GPS on every trip', 'Proof of delivery on file'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-accent" /> {item}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-accent-900 to-accent-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Ready to roll?</h2>
            <p className="mt-2 text-white/60">Sign in to the operations dashboard or driver portal.</p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-accent-800 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors">
            Sign in <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">RoadTrix</span>
            </div>
            <p className="text-sm leading-relaxed">Transportation operations platform for modern dispatch teams.</p>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-white font-semibold mb-3">Platform</p>
            <a href="#features" className="block hover:text-white transition-colors">Features</a>
            <a href="#fleet" className="block hover:text-white transition-colors">Fleet</a>
            <Link href="/login" className="block hover:text-white transition-colors">Dashboard login</Link>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-white font-semibold mb-3">Contact</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Dallas, TX · Nationwide</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +1 (555) 000-0000</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> ops@roadtrix.com</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-5 text-xs flex flex-col sm:flex-row justify-between gap-2">
            <span>© 2026 RoadTrix. All rights reserved.</span>
            <span>Dispatch smarter. Track in real-time. Maximize every load.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
