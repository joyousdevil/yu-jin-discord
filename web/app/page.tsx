import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 sm:py-20">
      {/* Hero */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-end gap-8 sm:gap-10 mb-12 sm:mb-16">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-heading mb-4">Yu-Jin</h1>
          <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8">
            She watches the door, keeps the ledger, and notices when people go quiet.
          </p>
          {/* TODO: Replace # with the real Discord OAuth invite URL from the Developer Portal */}
          <a
            href="#"
            className="inline-block bg-accent text-bg font-bold px-6 py-3 rounded hover:bg-accent-hover transition-colors"
          >
            Add to Discord
          </a>
        </div>
        <div className="w-48 sm:w-56 shrink-0 mx-auto sm:mx-0">
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
          title="Voice Notifications"
          description="When a member joins a voice channel, Yu-Jin posts a message in your notify channel. She draws from a repertoire at random — no two joins sound the same."
        />
        <Feature
          title="Favor Ledger"
          description="Any server member can log, review, and settle favors. Track who owes whom across your server. The ledger is per-server and persists across bot restarts."
        />
        <Feature
          title="Absence Detection"
          description="Yu-Jin checks daily whether any watched users have been absent from voice longer than their configured threshold. She'll ping them when they've been quiet too long."
        />
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <Link href="/guide" className="hover:text-accent transition-colors">User Guide</Link>
        <Link href="/tos" className="hover:text-accent transition-colors">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
      </div>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-l-2 border-accent pl-5">
      <h2 className="text-lg font-semibold text-heading mb-1">{title}</h2>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
