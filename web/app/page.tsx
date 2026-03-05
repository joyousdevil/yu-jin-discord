import Link from 'next/link';
import Image from 'next/image';
import { Radio, ScrollText, Eye, type LucideIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 sm:py-20">
      {/* Hero */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-end gap-8 sm:gap-10 mb-12 sm:mb-16">
        <div className="flex-1 animate-slide-up [animation-delay:100ms]">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-heading mb-4">Yu-Jin</h1>
          <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8">
            She watches the door, keeps the ledger, and notices when people go quiet.
          </p>
          {/* TODO: Replace # with the real Discord OAuth invite URL from the Developer Portal */}
          <a
            href="#"
            className="inline-block bg-accent text-bg font-bold px-6 py-3 rounded hover:bg-accent-hover hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            Add to Discord
          </a>
        </div>
        <div className="w-48 sm:w-56 shrink-0 mx-auto sm:mx-0 animate-slide-up">
          <Image
            src="/yu-jin.png"
            alt="Yu-Jin"
            width={400}
            height={600}
            className="w-full rounded-sm"
            priority
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-10 mb-12 sm:mb-16">
        <Feature
          icon={Radio}
          title="Voice Notifications"
          description="When a member joins a voice channel, Yu-Jin posts a message in your notify channel. She draws from a repertoire at random — no two joins sound the same."
          delay="250ms"
        />
        <Feature
          icon={ScrollText}
          title="Favor Ledger"
          description="Any server member can log, review, and settle favors. Track who owes whom across your server. The ledger is per-server and persists across bot restarts."
          delay="350ms"
        />
        <Feature
          icon={Eye}
          title="Absence Detection"
          description="Yu-Jin checks daily whether any watched users have been absent from voice longer than their configured threshold. She'll ping them when they've been quiet too long."
          delay="450ms"
        />
      </div>

      {/* Links */}
      <div
        className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted animate-fade-in [animation-delay:550ms]"
      >
        <Link href="/guide" className="hover:text-accent transition-colors">User Guide</Link>
        <Link href="/tos" className="hover:text-accent transition-colors">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, description, delay }: { icon: LucideIcon; title: string; description: string; delay: string }) {
  return (
    <div
      className="border-l-2 border-accent pl-5 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-accent shrink-0" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-heading">{title}</h2>
      </div>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
