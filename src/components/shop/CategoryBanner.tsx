import type { LucideIcon } from 'lucide-react'
import { Home, Shirt, Sparkles, Baby, Watch, ShieldCheck, Trophy, Star, Tag as TagIcon } from 'lucide-react'
import { SUBS_BY_CAT, KIDS_SUBCATEGORIES } from '@/lib/constants'

interface BannerConfig {
  eyebrow: string
  title: string
  subtitle: string
  gradient: string
  textClass: string
  chipClass: string
  icon: LucideIcon
  ctaLabel: string
  tags: string[]
}

function titleCase(s: string) {
  return s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const DEFAULT_TAGS = ['Jerseys', 'Hoodies', 'Caps', 'T-Shirts', 'Kids', 'Collectibles']

const BANNERS: Record<string, BannerConfig> = {
  All: {
    eyebrow: 'The Fanatic Experience',
    title: 'THE DUGOUT',
    subtitle: 'Curated game-day drops, premium essentials, and featured Blue Jays merchandise.',
    gradient: 'from-jays-red via-red-700 to-jays-navy',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: Home,
    ctaLabel: 'Full Roster',
    tags: DEFAULT_TAGS,
  },
  men: {
    eyebrow: 'Gear Up',
    title: "MEN'S COLLECTION",
    subtitle: 'Jerseys, fleece, and everyday essentials built for game day.',
    gradient: 'from-jays-navy via-jays-royal to-jays-navy',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: Shirt,
    ctaLabel: 'Shop Men',
    tags: (SUBS_BY_CAT.men ?? []).map(titleCase),
  },
  women: {
    eyebrow: 'Rep The Blue Jays',
    title: "WOMEN'S COLLECTION",
    subtitle: 'Bold styles and premium fits designed for every fan.',
    gradient: 'from-rose-600 via-fuchsia-700 to-jays-navy',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: Sparkles,
    ctaLabel: 'Shop Women',
    tags: (SUBS_BY_CAT.women ?? []).map(titleCase),
  },
  kids: {
    eyebrow: 'Future Fans',
    title: "KIDS' COLLECTION",
    subtitle: 'Little-league gear for the youngest members of the Jays family.',
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    textClass: 'text-jays-navy',
    chipClass: 'bg-jays-navy/10 text-jays-navy',
    icon: Baby,
    ctaLabel: 'Shop Kids',
    tags: [...KIDS_SUBCATEGORIES].map(titleCase),
  },
  accessories: {
    eyebrow: 'Finish The Look',
    title: 'ACCESSORIES',
    subtitle: 'Hats, bags, and collectibles to complete your fan gear.',
    gradient: 'from-emerald-600 via-teal-600 to-jays-navy',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: Watch,
    ctaLabel: 'Shop Accessories',
    tags: (SUBS_BY_CAT.accessories ?? []).map(titleCase),
  },
  authentication: {
    eyebrow: 'Verified Authentic',
    title: 'AUTHENTICATION',
    subtitle: 'Officially licensed, game-worn, and autographed collectibles.',
    gradient: 'from-indigo-700 via-jays-royal to-jays-navy',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: ShieldCheck,
    ctaLabel: 'Shop Authentication',
    tags: ['Autographed', 'Game-Worn', 'Certified'],
  },
  sports: {
    eyebrow: 'All Season Long',
    title: 'SPORTS GEAR',
    subtitle: 'Performance gear for training, travel, and game day.',
    gradient: 'from-slate-700 via-jays-navy to-jays-royal',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: Trophy,
    ctaLabel: 'Shop Sports',
    tags: ['Training', 'Travel', 'Game Day'],
  },
  Featured: {
    eyebrow: 'Game Day Picks',
    title: 'FEATURED PRODUCTS',
    subtitle: 'Hand-selected top picks from the Jays Shop team.',
    gradient: 'from-yellow-400 via-amber-400 to-yellow-500',
    textClass: 'text-jays-navy',
    chipClass: 'bg-jays-navy/10 text-jays-navy',
    icon: Star,
    ctaLabel: 'View Featured',
    tags: [],
  },
  'New Arrivals': {
    eyebrow: 'Just Landed',
    title: 'NEW ARRIVALS',
    subtitle: 'Fresh drops and the latest additions to the Jays Shop lineup.',
    gradient: 'from-sky-500 via-blue-600 to-jays-navy',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: Sparkles,
    ctaLabel: 'View New Arrivals',
    tags: [],
  },
  'Sales & Clearance': {
    eyebrow: 'Limited Time',
    title: 'SALES & CLEARANCE',
    subtitle: 'Deep discounts on select gear — while supplies last.',
    gradient: 'from-jays-red via-red-600 to-rose-700',
    textClass: 'text-white',
    chipClass: 'bg-white/10 text-white',
    icon: TagIcon,
    ctaLabel: 'Shop Deals',
    tags: [],
  },
}

export default function CategoryBanner({ activeCategory }: { activeCategory: string }) {
  const config = BANNERS[activeCategory] ?? BANNERS.All
  const Icon = config.icon
  const isDark = config.textClass === 'text-white'

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br shadow-xl ring-1 ring-black/5 transition-colors duration-300 ${config.gradient} ${config.textClass}`}
      >
        {/* subtle dotted texture, matches the sticky category nav treatment */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        />
        {/* soft glow orbs for a premium, layered feel */}
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-12 -bottom-24 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={`hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg sm:flex ${
                isDark ? 'bg-white/15 shadow-black/10' : 'bg-jays-navy/10 shadow-jays-navy/10'
              }`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  isDark ? 'bg-white/10' : 'bg-jays-navy/10'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-jays-navy'}`} />
                {config.eyebrow}
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">{config.title}</h2>
              <p className="mt-2 max-w-xl text-sm opacity-85 sm:text-base">{config.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            {config.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {config.tags.map((tag) => (
                  <span key={tag} className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${config.chipClass}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-display font-semibold uppercase tracking-wide shadow-sm ${config.chipClass}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {config.ctaLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
