'use client'
import Link from 'next/link'
import { ChevronLeft, ShieldCheck, CreditCard, Package, Clock, MapPin, AlertTriangle, Accessibility, DollarSign, Lock, FileText, Star, ShieldAlert } from 'lucide-react'

export default function PolicyPage() {
  const sections = [
    {
      id: 'general',
      icon: ShieldCheck,
      title: 'General Store Policy',
      items: [
        'All merchandise sold at Jays Shop is officially licensed by Major League Baseball (MLB) and the Toronto Blue Jays.',
        'Prices are listed in Canadian Dollars (CAD) and include applicable taxes unless otherwise noted.',
        'Jays Shop reserves the right to limit quantities on select items, especially during promotional events or high-demand periods.',
        'Products displayed are subject to availability and may vary by location within Rogers Centre.',
        'Jays Shop complies with all applicable Canadian consumer protection laws and the Ontario Consumer Protection Act.',
      ],
    },
    {
      id: 'accessibility',
      icon: Accessibility,
      title: 'Accessibility',
      items: [
        'Jays Shop is committed to providing accessible customer service in accordance with the Accessibility for Ontarians with Disabilities Act (AODA).',
        'Our in-store and digital experiences are designed to be inclusive for customers of all abilities.',
        'Assistive devices, service animals, and support persons are welcome at all Jays Shop locations.',
        'Staff are trained to communicate and assist customers with diverse accessibility needs.',
        'Our website follows WCAG 2.1 Level AA standards to ensure screen reader compatibility, keyboard navigation, and sufficient colour contrast.',
        'If you require accommodations or have accessibility feedback, please contact Gate 5 Store at 416.341.2904.',
      ],
    },
    {
      id: 'pricing',
      icon: DollarSign,
      title: 'Pricing Policy',
      items: [
        'All prices are displayed in Canadian Dollars (CAD) and include applicable HST (13%) unless stated otherwise.',
        'Prices are subject to change without prior notice. The price displayed at the time of purchase is the final price.',
        'Jays Shop honours price matching only within its own retail locations — external retailer price matching is not available.',
        'Price adjustments are available within 7 days of purchase if the same item is reduced in price. Proof of purchase is required.',
        'Clearance and promotional pricing is final and not eligible for further adjustments.',
        'Bundle or multi-buy offers are applied automatically at checkout where applicable.',
        'Gift cards are sold at face value and do not expire.',
      ],
    },
    {
      id: 'reviews',
      icon: Star,
      title: 'Product Review Guidelines',
      items: [
        'We encourage fans to share honest feedback on products purchased from Jays Shop.',
        'Reviews must be based on genuine first-hand experience with the product.',
        'Reviews containing offensive language, personal attacks, spam, or promotional content will be removed.',
        'Do not include personal information (full names, addresses, phone numbers) in your reviews.',
        'Star ratings should reflect overall satisfaction: 5 = Excellent, 4 = Good, 3 = Average, 2 = Below Average, 1 = Poor.',
        'Jays Shop reserves the right to moderate and remove reviews that violate these guidelines.',
        'Verified purchase reviews are prioritized and marked with a badge for authenticity.',
        'Review data is used to improve product quality and customer experience and may be displayed publicly on the store.',
      ],
    },
    {
      id: 'security',
      icon: ShieldAlert,
      title: 'Secure Shopping Guarantee',
      items: [
        'Jays Shop uses industry-standard SSL/TLS encryption to protect all data transmitted through our website and digital platforms.',
        'Payment processing is handled by PCI DSS-compliant payment providers. Jays Shop never stores your full credit card information.',
        'All in-store payment terminals support chip-and-PIN, contactless (tap), and mobile wallet transactions (Apple Pay, Google Pay).',
        'Hold reservation QR codes are uniquely generated and encrypted — they cannot be duplicated or transferred.',
        'Our systems are regularly audited for security vulnerabilities and comply with Canadian data protection standards.',
        'If you suspect unauthorized use of your account or personal data, contact us immediately at 416.341.2904.',
        'Jays Shop guarantees a secure shopping experience — if a security issue arises from our systems, we will work with you to resolve it promptly.',
      ],
    },
    {
      id: 'purchasing',
      icon: CreditCard,
      title: 'Purchasing Guidelines',
      items: [
        'We accept Visa, Mastercard, American Express, Debit, Apple Pay, and Google Pay. Cash is not accepted.',
        'All sales are final on clearance and sale items unless the product is defective.',
        'Gift receipts are available upon request at the time of purchase.',
        'Price adjustments are not available after purchase unless the item goes on clearance within 7 days.',
      ],
    },
    {
      id: 'authenticity',
      icon: Package,
      title: 'Product Authenticity',
      items: [
        'All jerseys, caps, and apparel sold at Jays Shop are 100% authentic and officially licensed.',
        'Authenticated items include a hologram sticker and certificate of authenticity where applicable.',
        'Counterfeit merchandise is never sold at any Jays Shop location.',
      ],
    },
    {
      id: 'holds',
      icon: Clock,
      title: 'Hold & Reserve Policy',
      items: [
        'Fans may reserve items for in-store pickup using the hold system.',
        '48-hour holds are available for Gate 5 Store (Section 110) pickup.',
        '3-hour priority holds are available for Stadium queue pickup (Section 123), with an approximate 30-minute queue time.',
        'Unclaimed holds will be automatically released after the hold period expires.',
        'Holds are non-transferable and require the original reservation QR code for pickup.',
      ],
    },
    {
      id: 'locations',
      icon: MapPin,
      title: 'Store Locations & Hours',
      items: [
        'Jays Shop is located at 1 Blue Jays Way, Toronto, ON M5V 1J4, inside Rogers Centre.',
        'Store hours: 10:00 AM – 5:00 PM on game days and select non-game days.',
        'Hours may vary during playoffs, special events, and holidays.',
        'For inquiries, call Gate 5 Store at 416.341.2904.',
      ],
    },
    {
      id: 'liability',
      icon: AlertTriangle,
      title: 'Liability & Disclaimers',
      items: [
        'Jays Shop is not responsible for lost, stolen, or damaged merchandise after purchase.',
        'Product images online may differ slightly from in-store appearance due to lighting and display settings.',
        'Jays Shop reserves the right to update these policies at any time without prior notice.',
      ],
    },
  ]

  const quickLinks = [
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'pricing', label: 'Pricing Policy' },
    { id: 'reviews', label: 'Product Review Guidelines' },
    { id: 'security', label: 'Secure Shopping Guarantee' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-jays-ice to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-jays-navy via-[#1a4480] to-jays-royal text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 sm:pt-24 sm:pb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-200/70 hover:text-white text-xs mb-4 transition-colors">
            <ChevronLeft size={14} /> Back to Home
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide">Store Policy</h1>
          <p className="text-blue-200/80 text-sm mt-2">Everything you need to know about shopping at Jays Shop</p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="max-w-4xl mx-auto px-4 -mt-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Jump to</p>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="px-3 py-1.5 text-xs font-medium text-jays-navy bg-jays-ice hover:bg-jays-navy hover:text-white rounded-full border border-gray-200 hover:border-jays-navy transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-jays-navy/5 flex items-center justify-center">
                  <section.icon size={18} className="text-jays-navy" />
                </div>
                <h2 className="font-display font-bold text-jays-navy text-base sm:text-lg uppercase tracking-wide">{section.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                    <span className="text-jays-royal mt-1 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Last updated: July 2026</p>
          <Link href="/returns" className="text-xs text-jays-royal hover:underline mt-1 inline-block">View 60-Day Return Policy</Link>
        </div>
      </div>
    </div>
  )
}
