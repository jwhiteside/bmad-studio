import { ExternalLink, Github, Heart, BookOpen, Scale } from 'lucide-react'

const VERSION = '1.0.0'

function LinkCard({ href, icon: Icon, title, description }: { href: string; icon: typeof Github; title: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors"
    >
      <Icon size={18} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold">{title}</span>
          <ExternalLink size={10} className="text-[var(--color-muted)]" />
        </div>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">{description}</p>
      </div>
    </a>
  )
}

const faqs: Array<{ q: string; a: string }> = [
  {
    q: 'What is BMAD?',
    a: 'BMAD (Build Manage Architect Deploy) is an agentic engineering framework that defines AI agents, skills, and workflows as structured markdown files. It provides a method for orchestrating AI agents in software delivery workflows.',
  },
  {
    q: 'What does BMAD Studio do?',
    a: 'Studio is the configuration and visibility layer for BMAD projects. It reads and writes the same markdown and YAML files that BMAD uses — no database, no hidden state. You can browse agents, visualize workflows, manage skills, and configure your project through a web interface.',
  },
  {
    q: 'Does Studio execute agents or workflows?',
    a: 'No. Studio configures and visualizes. Your IDE (Claude Code, Cursor, Windsurf, etc.) remains the execution environment. Studio helps you understand and manage the setup; the IDE runs the agents.',
  },
  {
    q: 'What BMAD version is supported?',
    a: 'Studio targets BMAD v6+. It reads the BMAD version from your project config and warns if the version is unsupported.',
  },
  {
    q: 'How do I install Studio?',
    a: 'Run `npx bmad-studio` from your BMAD project root. It starts a local server and opens in your browser. No global install required.',
  },
  {
    q: 'Where does Studio store its data?',
    a: 'Studio reads directly from your _bmad/ directory. Studio-only runtime data (drafts, sync config) lives in .bmad-studio/ which can be deleted at any time with zero impact on your project.',
  },
  {
    q: 'Can I use Studio without a BMAD project?',
    a: 'Studio will start in setup mode and guide you through initializing a BMAD structure. However, most features require an existing BMAD project to be useful.',
  },
  {
    q: 'Is my data sent anywhere?',
    a: 'No. Studio runs entirely locally. There are no analytics, no telemetry, and no external network requests. All data stays on your machine.',
  },
]

export function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold mb-2">About BMAD Studio</h1>
      <p className="text-sm text-[var(--color-muted)] mb-8">
        Version {VERSION}
      </p>

      {/* Description */}
      <div className="mb-8">
        <p className="text-sm leading-relaxed">
          BMAD Studio is the visual administration layer for the BMAD ecosystem.
          It gives you a dashboard for your project's AI agents, skills, workflows, teams, and outputs —
          letting you browse, configure, and manage everything through a browser UI while your IDE
          handles execution.
        </p>
        <p className="text-sm leading-relaxed mt-3 text-[var(--color-muted)]">
          Studio reads and writes BMAD's existing text files directly — no database, no hidden state.
          Install modules from the registry to extend your toolkit, switch between projects instantly,
          and track sprint progress from the home dashboard.
        </p>
      </div>

      {/* Links */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-3">Links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <LinkCard
            href="https://github.com/jwhiteside/bmad-studio"
            icon={Github}
            title="GitHub Repository"
            description="Source code, issues, and releases"
          />
          <LinkCard
            href="https://github.com/bmadcode/BMAD-METHOD"
            icon={BookOpen}
            title="BMAD Method"
            description="The agentic engineering framework"
          />
          <LinkCard
            href="https://github.com/jwhiteside/bmad-studio/blob/main/CONTRIBUTING.md"
            icon={Heart}
            title="Contributing"
            description="How to report bugs and submit PRs"
          />
          <LinkCard
            href="https://github.com/jwhiteside/bmad-studio/blob/main/LICENSE"
            icon={Scale}
            title="MIT License"
            description="Free and open-source software"
          />
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-3">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
              <p className="text-sm font-bold mb-1.5">{faq.q}</p>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-3">Built With</h2>
        <div className="flex flex-wrap gap-2">
          {['React 18', 'Fastify 5', 'TypeScript', 'Tailwind CSS', 'Vite', 'CodeMirror 6', 'shadcn/ui'].map((tech) => (
            <span key={tech} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-[var(--color-muted)] border-t border-[var(--color-border-subtle)] pt-4">
        <p>Made by <a href="https://github.com/jwhiteside" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Jonathan Whiteside</a>. Licensed under the MIT License.</p>
      </div>
    </div>
  )
}
