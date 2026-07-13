// BrandWatermarks.tsx — dense partner-brand image + text watermark overlay for hero sections
'use client'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoDef {
  src: string
  alt: string
  filter: string
  sizeClasses: string
}

const LOGOS: LogoDef[] = [
  { src: '/brand/partners/nike.png',              alt: 'Nike',             filter: 'invert(100%) brightness(1.2)', sizeClasses: 'w-20 h-12 sm:w-24 sm:h-14' },
  { src: '/brand/partners/new-era.png',           alt: 'New Era',          filter: 'invert(100%) brightness(1.2)', sizeClasses: 'w-20 h-20 sm:w-24 sm:h-24' },
  { src: '/brand/partners/fanatics.png',          alt: 'Fanatics',         filter: 'invert(100%) brightness(1.2)', sizeClasses: 'w-24 h-14 sm:w-28 sm:h-16' },
  { src: '/brand/partners/levelwear.png',         alt: 'Levelwear',        filter: 'invert(100%) brightness(1.2)', sizeClasses: 'w-20 h-20 sm:w-24 sm:h-24' },
  { src: '/brand/partners/47brand.jpg',           alt: '47 Brand',         filter: 'brightness(1.5)',              sizeClasses: 'w-20 h-20 sm:w-22 sm:h-22' },
  { src: '/brand/partners/roots.jpg',             alt: 'Roots',            filter: 'brightness(1.2)',              sizeClasses: 'w-22 h-18 sm:w-28 sm:h-22' },
  { src: '/brand/partners/peace-collective.png',  alt: 'Peace Collective', filter: 'invert(100%) brightness(1.2)', sizeClasses: 'w-20 h-20 sm:w-24 sm:h-24' },
  { src: '/brand/partners/mitchell-ness.png',     alt: 'Mitchell & Ness',  filter: 'brightness(1.3)',              sizeClasses: 'w-24 h-14 sm:w-28 sm:h-16' },
  { src: '/brand/partners/bulletin.png',          alt: 'Bulletin',         filter: 'invert(100%) brightness(1.2)', sizeClasses: 'w-20 h-20 sm:w-24 sm:h-24' },
  // Blue Jays heritage logos
  { src: '/brand/watermarks/jays-script.png',     alt: 'Jays Script',      filter: 'brightness(1.4)',              sizeClasses: 'w-32 h-16 sm:w-40 sm:h-20' },
  { src: '/brand/watermarks/jays-maple.png',      alt: 'Jays Maple',       filter: 'brightness(1.3)',              sizeClasses: 'w-28 h-28 sm:w-36 sm:h-36' },
  { src: '/brand/watermarks/jays-retro.png',      alt: 'Jays Retro',       filter: 'brightness(1.3)',              sizeClasses: 'w-24 h-28 sm:w-32 sm:h-36' },
  { src: '/brand/watermarks/jays-bird.png',       alt: 'Jays Bird',        filter: 'brightness(1.3)',              sizeClasses: 'w-32 h-20 sm:w-40 sm:h-24' },
]

interface WatermarkItem {
  logo: LogoDef
  top: string
  left: string
  opacity: number
  rotate: number
  scale: number
}

interface TextWatermark {
  text: string
  top: string
  left: string
  opacity: number
  rotate: number
  sizeClass: string
}

/** Very dense logo scatter — fills the hero background edge-to-edge */
function generateWatermarkLogos(): WatermarkItem[] {
  return [
    // ── Row 0–5% ────────────────────────────────────────────────────────
    { logo: LOGOS[3],  top: '0%',  left: '2%',   opacity: 0.060, rotate: -18, scale: 0.90 },
    { logo: LOGOS[9],  top: '1%',  left: '20%',  opacity: 0.045, rotate:   4, scale: 0.65 },
    { logo: LOGOS[4],  top: '2%',  left: '38%',  opacity: 0.055, rotate:   8, scale: 0.95 },
    { logo: LOGOS[12], top: '0%',  left: '55%',  opacity: 0.045, rotate:  -5, scale: 0.60 },
    { logo: LOGOS[1],  top: '3%',  left: '72%',  opacity: 0.060, rotate:  12, scale: 0.85 },
    { logo: LOGOS[0],  top: '1%',  left: '90%',  opacity: 0.055, rotate:  -6, scale: 0.95 },

    // ── Row 8–15% ───────────────────────────────────────────────────────
    { logo: LOGOS[0],  top: '8%',  left: '5%',   opacity: 0.065, rotate:  -8, scale: 1.00 },
    { logo: LOGOS[6],  top: '9%',  left: '18%',  opacity: 0.050, rotate:  -6, scale: 0.85 },
    { logo: LOGOS[10], top: '7%',  left: '32%',  opacity: 0.040, rotate:  15, scale: 0.50 },
    { logo: LOGOS[8],  top: '10%', left: '48%',  opacity: 0.050, rotate:  10, scale: 0.82 },
    { logo: LOGOS[2],  top: '8%',  left: '65%',  opacity: 0.060, rotate:   8, scale: 1.00 },
    { logo: LOGOS[11], top: '12%', left: '78%',  opacity: 0.040, rotate: -12, scale: 0.55 },
    { logo: LOGOS[4],  top: '11%', left: '92%',  opacity: 0.055, rotate:  14, scale: 0.90 },

    // ── Row 16–22% ──────────────────────────────────────────────────────
    { logo: LOGOS[5],  top: '16%', left: '0%',   opacity: 0.050, rotate:   2, scale: 0.85 },
    { logo: LOGOS[12], top: '18%', left: '14%',  opacity: 0.045, rotate:   7, scale: 0.65 },
    { logo: LOGOS[3],  top: '17%', left: '28%',  opacity: 0.050, rotate: -10, scale: 0.88 },
    { logo: LOGOS[7],  top: '20%', left: '42%',  opacity: 0.055, rotate:   4, scale: 0.90 },
    { logo: LOGOS[9],  top: '16%', left: '58%',  opacity: 0.045, rotate:  -8, scale: 0.70 },
    { logo: LOGOS[10], top: '19%', left: '75%',  opacity: 0.040, rotate:  12, scale: 0.52 },
    { logo: LOGOS[1],  top: '21%', left: '88%',  opacity: 0.055, rotate:  -4, scale: 0.85 },

    // ── Row 25–32% ──────────────────────────────────────────────────────
    { logo: LOGOS[3],  top: '25%', left: '3%',   opacity: 0.060, rotate: -12, scale: 0.95 },
    { logo: LOGOS[11], top: '27%', left: '16%',  opacity: 0.040, rotate: -15, scale: 0.58 },
    { logo: LOGOS[1],  top: '26%', left: '30%',  opacity: 0.050, rotate:   6, scale: 0.82 },
    { logo: LOGOS[6],  top: '28%', left: '45%',  opacity: 0.040, rotate:  -3, scale: 0.78 },
    { logo: LOGOS[5],  top: '25%', left: '60%',  opacity: 0.055, rotate:  -5, scale: 0.92 },
    { logo: LOGOS[2],  top: '28%', left: '78%',  opacity: 0.060, rotate:  10, scale: 1.05 },
    { logo: LOGOS[8],  top: '30%', left: '92%',  opacity: 0.050, rotate:   5, scale: 0.80 },

    // ── Row 34–42% ──────────────────────────────────────────────────────
    { logo: LOGOS[4],  top: '34%', left: '8%',   opacity: 0.060, rotate:  18, scale: 0.98 },
    { logo: LOGOS[0],  top: '36%', left: '22%',  opacity: 0.045, rotate:   3, scale: 0.82 },
    { logo: LOGOS[12], top: '35%', left: '38%',  opacity: 0.040, rotate:  -4, scale: 0.62 },
    { logo: LOGOS[2],  top: '38%', left: '52%',  opacity: 0.040, rotate:   4, scale: 0.80 },
    { logo: LOGOS[7],  top: '34%', left: '65%',  opacity: 0.055, rotate:   8, scale: 0.90 },
    { logo: LOGOS[3],  top: '40%', left: '80%',  opacity: 0.060, rotate:  -8, scale: 0.92 },
    { logo: LOGOS[9],  top: '37%', left: '94%',  opacity: 0.040, rotate:  10, scale: 0.65 },

    // ── Row 44–52% ──────────────────────────────────────────────────────
    { logo: LOGOS[10], top: '44%', left: '2%',   opacity: 0.045, rotate:  -6, scale: 0.52 },
    { logo: LOGOS[5],  top: '46%', left: '15%',  opacity: 0.050, rotate:  -2, scale: 0.85 },
    { logo: LOGOS[8],  top: '48%', left: '30%',  opacity: 0.045, rotate:   6, scale: 0.80 },
    { logo: LOGOS[11], top: '45%', left: '45%',  opacity: 0.035, rotate: -10, scale: 0.55 },
    { logo: LOGOS[0],  top: '47%', left: '58%',  opacity: 0.060, rotate:   4, scale: 1.00 },
    { logo: LOGOS[9],  top: '44%', left: '72%',  opacity: 0.045, rotate:  10, scale: 0.68 },
    { logo: LOGOS[1],  top: '50%', left: '88%',  opacity: 0.055, rotate:  -4, scale: 0.85 },

    // ── Row 53–60% ──────────────────────────────────────────────────────
    { logo: LOGOS[0],  top: '53%', left: '5%',   opacity: 0.065, rotate:   4, scale: 1.00 },
    { logo: LOGOS[12], top: '55%', left: '18%',  opacity: 0.045, rotate:  14, scale: 0.65 },
    { logo: LOGOS[1],  top: '56%', left: '34%',  opacity: 0.050, rotate:  -4, scale: 0.85 },
    { logo: LOGOS[7],  top: '53%', left: '48%',  opacity: 0.050, rotate:   3, scale: 0.88 },
    { logo: LOGOS[4],  top: '58%', left: '62%',  opacity: 0.055, rotate:  12, scale: 0.90 },
    { logo: LOGOS[10], top: '54%', left: '78%',  opacity: 0.040, rotate:  -6, scale: 0.50 },
    { logo: LOGOS[2],  top: '56%', left: '92%',  opacity: 0.060, rotate:  -6, scale: 0.95 },

    // ── Row 62–70% ──────────────────────────────────────────────────────
    { logo: LOGOS[3],  top: '62%', left: '10%',  opacity: 0.055, rotate:  -8, scale: 0.90 },
    { logo: LOGOS[6],  top: '64%', left: '24%',  opacity: 0.045, rotate:   5, scale: 0.82 },
    { logo: LOGOS[5],  top: '63%', left: '40%',  opacity: 0.050, rotate:   6, scale: 0.85 },
    { logo: LOGOS[11], top: '66%', left: '55%',  opacity: 0.035, rotate:  18, scale: 0.55 },
    { logo: LOGOS[0],  top: '62%', left: '70%',  opacity: 0.060, rotate:  -3, scale: 1.00 },
    { logo: LOGOS[1],  top: '68%', left: '85%',  opacity: 0.050, rotate:  14, scale: 0.82 },
    { logo: LOGOS[9],  top: '65%', left: '95%',  opacity: 0.040, rotate:  -8, scale: 0.65 },

    // ── Row 72–80% ──────────────────────────────────────────────────────
    { logo: LOGOS[12], top: '72%', left: '3%',   opacity: 0.045, rotate:  14, scale: 0.65 },
    { logo: LOGOS[4],  top: '74%', left: '18%',  opacity: 0.055, rotate:   9, scale: 0.88 },
    { logo: LOGOS[2],  top: '73%', left: '32%',  opacity: 0.055, rotate:   3, scale: 0.92 },
    { logo: LOGOS[8],  top: '76%', left: '48%',  opacity: 0.045, rotate:  -5, scale: 0.82 },
    { logo: LOGOS[3],  top: '72%', left: '62%',  opacity: 0.060, rotate:   7, scale: 0.95 },
    { logo: LOGOS[10], top: '78%', left: '78%',  opacity: 0.040, rotate:   8, scale: 0.52 },
    { logo: LOGOS[5],  top: '75%', left: '90%',  opacity: 0.050, rotate:  -8, scale: 0.85 },

    // ── Row 82–92% ──────────────────────────────────────────────────────
    { logo: LOGOS[7],  top: '82%', left: '5%',   opacity: 0.055, rotate:   8, scale: 0.90 },
    { logo: LOGOS[0],  top: '84%', left: '20%',  opacity: 0.055, rotate:  -3, scale: 0.90 },
    { logo: LOGOS[11], top: '83%', left: '35%',  opacity: 0.035, rotate:  -9, scale: 0.55 },
    { logo: LOGOS[9],  top: '85%', left: '50%',  opacity: 0.045, rotate:  -3, scale: 0.70 },
    { logo: LOGOS[1],  top: '82%', left: '65%',  opacity: 0.050, rotate:   2, scale: 0.82 },
    { logo: LOGOS[6],  top: '86%', left: '80%',  opacity: 0.045, rotate:  -5, scale: 0.80 },
    { logo: LOGOS[4],  top: '88%', left: '94%',  opacity: 0.050, rotate: -12, scale: 0.85 },

    // ── Row 90–98% (bottom) ─────────────────────────────────────────────
    { logo: LOGOS[2],  top: '92%', left: '8%',   opacity: 0.050, rotate:   5, scale: 0.88 },
    { logo: LOGOS[12], top: '94%', left: '25%',  opacity: 0.040, rotate:  10, scale: 0.62 },
    { logo: LOGOS[8],  top: '91%', left: '42%',  opacity: 0.045, rotate:   6, scale: 0.78 },
    { logo: LOGOS[5],  top: '95%', left: '58%',  opacity: 0.045, rotate:  -4, scale: 0.82 },
    { logo: LOGOS[10], top: '93%', left: '72%',  opacity: 0.035, rotate:   8, scale: 0.50 },
    { logo: LOGOS[3],  top: '90%', left: '86%',  opacity: 0.050, rotate:  -6, scale: 0.88 },
  ]
}

/** Dense text wordmarks filling gaps between logos */
function generateWatermarkTexts(): TextWatermark[] {
  return [
    // ── Top ─────────────────────────────────────────────────────────────
    { text: 'LEVELWEAR',        top: '0%',  left: '12%',  opacity: 0.040, rotate: -10, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: "'47",              top: '1%',  left: '30%',  opacity: 0.040, rotate:   5, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'BLUE JAYS',        top: '0%',  left: '48%',  opacity: 0.035, rotate:  -3, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'NEW ERA',          top: '2%',  left: '65%',  opacity: 0.045, rotate:  10, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'NIKE',             top: '0%',  left: '84%',  opacity: 0.045, rotate:  -4, sizeClass: 'text-xs sm:text-sm lg:text-base' },

    // ── 6–12% ───────────────────────────────────────────────────────────
    { text: 'ROOTS',            top: '6%',  left: '0%',   opacity: 0.040, rotate:   2, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'TORONTO',          top: '7%',  left: '25%',  opacity: 0.035, rotate: -12, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'FANATICS',         top: '9%',  left: '40%',  opacity: 0.035, rotate:  12, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'JAYS SHOP',        top: '6%',  left: '58%',  opacity: 0.035, rotate:   3, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'PEACE COLLECTIVE', top: '10%', left: '82%',  opacity: 0.030, rotate:  -6, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 14–20% ──────────────────────────────────────────────────────────
    { text: 'NIKE',             top: '14%', left: '3%',   opacity: 0.045, rotate:  -5, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'BULLETIN',         top: '15%', left: '20%',  opacity: 0.035, rotate:   8, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'MITCHELL & NESS',  top: '16%', left: '36%',  opacity: 0.035, rotate:  -4, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'BLUE JAYS',        top: '14%', left: '52%',  opacity: 0.035, rotate:   6, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: "'47",              top: '18%', left: '68%',  opacity: 0.040, rotate:  16, sizeClass: 'text-sm sm:text-base lg:text-lg' },
    { text: 'LEVELWEAR',        top: '15%', left: '88%',  opacity: 0.035, rotate:  -8, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 22–28% ──────────────────────────────────────────────────────────
    { text: 'FANATICS',         top: '22%', left: '6%',   opacity: 0.035, rotate:   4, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'MAJESTIC',         top: '24%', left: '22%',  opacity: 0.030, rotate: -15, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'TORONTO',          top: '23%', left: '40%',  opacity: 0.030, rotate:   2, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'NEW ERA',          top: '26%', left: '55%',  opacity: 0.035, rotate:  -6, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'ROOTS',            top: '22%', left: '72%',  opacity: 0.040, rotate:   3, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'BULLETIN',         top: '25%', left: '90%',  opacity: 0.030, rotate:  -4, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 30–38% ──────────────────────────────────────────────────────────
    { text: "'47",              top: '30%', left: '5%',   opacity: 0.040, rotate:   8, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'NIKE',             top: '32%', left: '18%',  opacity: 0.040, rotate:  -3, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'PEACE COLLECTIVE', top: '31%', left: '35%',  opacity: 0.030, rotate:  -2, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'MITCHELL & NESS',  top: '34%', left: '55%',  opacity: 0.030, rotate:  15, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'JAYS SHOP',        top: '30%', left: '72%',  opacity: 0.035, rotate:  -7, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'MAJESTIC',         top: '36%', left: '88%',  opacity: 0.030, rotate:  -2, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 40–48% ──────────────────────────────────────────────────────────
    { text: 'LEVELWEAR',        top: '40%', left: '0%',   opacity: 0.035, rotate: -14, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'BLUE JAYS',        top: '42%', left: '16%',  opacity: 0.035, rotate:   6, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'FANATICS',         top: '41%', left: '34%',  opacity: 0.030, rotate:   4, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'ROOTS',            top: '44%', left: '50%',  opacity: 0.030, rotate:  -8, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'NEW ERA',          top: '40%', left: '65%',  opacity: 0.035, rotate:   3, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'TORONTO',          top: '46%', left: '82%',  opacity: 0.030, rotate: -10, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 50–58% ──────────────────────────────────────────────────────────
    { text: 'NIKE',             top: '50%', left: '10%',  opacity: 0.045, rotate:   2, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: "'47",              top: '52%', left: '28%',  opacity: 0.035, rotate:   9, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'BULLETIN',         top: '51%', left: '42%',  opacity: 0.030, rotate:  -5, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'LEVELWEAR',        top: '54%', left: '58%',  opacity: 0.035, rotate:  12, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'FANATICS',         top: '50%', left: '75%',  opacity: 0.040, rotate:  -8, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'MITCHELL & NESS',  top: '56%', left: '90%',  opacity: 0.030, rotate:   5, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 60–68% ──────────────────────────────────────────────────────────
    { text: 'ROOTS',            top: '60%', left: '2%',   opacity: 0.040, rotate:  -3, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'PEACE COLLECTIVE', top: '62%', left: '18%',  opacity: 0.030, rotate:   7, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'BLUE JAYS',        top: '60%', left: '35%',  opacity: 0.035, rotate:  -4, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'NIKE',             top: '64%', left: '52%',  opacity: 0.040, rotate:   8, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'MAJESTIC',         top: '61%', left: '68%',  opacity: 0.030, rotate:  -5, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: "'47",              top: '66%', left: '82%',  opacity: 0.035, rotate:  14, sizeClass: 'text-sm sm:text-base lg:text-lg' },

    // ── 70–78% ──────────────────────────────────────────────────────────
    { text: 'NEW ERA',          top: '70%', left: '8%',   opacity: 0.040, rotate:   5, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'JAYS SHOP',        top: '72%', left: '25%',  opacity: 0.035, rotate:  -6, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'FANATICS',         top: '71%', left: '40%',  opacity: 0.035, rotate: -10, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'BULLETIN',         top: '74%', left: '55%',  opacity: 0.030, rotate:   3, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'TORONTO',          top: '70%', left: '72%',  opacity: 0.030, rotate:  -4, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'LEVELWEAR',        top: '76%', left: '88%',  opacity: 0.035, rotate:   6, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 80–90% ──────────────────────────────────────────────────────────
    { text: 'NIKE',             top: '80%', left: '3%',   opacity: 0.040, rotate:   3, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'MITCHELL & NESS',  top: '82%', left: '18%',  opacity: 0.030, rotate:  -8, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: "'47",              top: '81%', left: '35%',  opacity: 0.035, rotate:  14, sizeClass: 'text-sm sm:text-base lg:text-lg' },
    { text: 'ROOTS',            top: '84%', left: '52%',  opacity: 0.035, rotate:   1, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'BLUE JAYS',        top: '80%', left: '68%',  opacity: 0.035, rotate:  -5, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'PEACE COLLECTIVE', top: '86%', left: '84%',  opacity: 0.030, rotate:   4, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },

    // ── 90–98% ──────────────────────────────────────────────────────────
    { text: 'FANATICS',         top: '90%', left: '5%',   opacity: 0.035, rotate:  -7, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'NEW ERA',          top: '92%', left: '22%',  opacity: 0.035, rotate:   6, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'NIKE',             top: '91%', left: '40%',  opacity: 0.035, rotate:  -1, sizeClass: 'text-xs sm:text-sm lg:text-base' },
    { text: 'MAJESTIC',         top: '94%', left: '58%',  opacity: 0.030, rotate:   8, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
    { text: 'ROOTS',            top: '90%', left: '75%',  opacity: 0.035, rotate:  -4, sizeClass: 'text-[10px] sm:text-xs lg:text-sm' },
    { text: 'LEVELWEAR',        top: '95%', left: '92%',  opacity: 0.030, rotate:   3, sizeClass: 'text-[9px] sm:text-[10px] lg:text-xs' },
  ]
}

interface Props {
  className?: string
}

export default function BrandWatermarks({ className }: Props) {
  const logos = generateWatermarkLogos()
  const texts = generateWatermarkTexts()

  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden pointer-events-none select-none', className)}
    >
      {/* Logo watermarks */}
      {logos.map((m, i) => (
        <div
          key={`logo-${i}`}
          className={cn('absolute animate-float', m.logo.sizeClasses)}
          style={{
            top: m.top,
            left: m.left,
            opacity: m.opacity,
            rotate: `${m.rotate}deg`,
            scale: m.scale,
            filter: m.logo.filter,
            transition: 'none',
            willChange: 'transform',
            animationDelay: `${(i % 7) * 0.7}s`,
            animationDuration: `${9 + (i % 5) * 1.2}s`,
          }}
        >
          <Image
            src={m.logo.src}
            alt={m.logo.alt}
            fill
            sizes="(max-width: 640px) 20vw, 10vw"
            className="object-contain"
            priority={false}
          />
        </div>
      ))}

      {/* Brand-name text watermarks */}
      {texts.map((t, i) => (
        <div
          key={`text-${i}`}
          className={cn(
            'absolute animate-drift font-display font-bold uppercase tracking-[0.25em] text-white whitespace-nowrap',
            t.sizeClass
          )}
          style={{
            top: t.top,
            left: t.left,
            opacity: t.opacity,
            rotate: `${t.rotate}deg`,
            textShadow: '0 1px 5px rgba(30, 39, 97, 0.3)',
            transition: 'none',
            willChange: 'transform',
            animationDelay: `${(i % 6) * 0.8}s`,
            animationDuration: `${12 + (i % 4) * 1.5}s`,
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
