/**
 * Birdie Knowledge Base — Jays Shop AI Assistant
 *
 * Contains 40+ sample prompts with keyword triggers and multiple
 * response variations for the canned-reply (demo) fallback mode.
 * Also exports the system prompt context used by the OpenAI path.
 */

export interface KnowledgeEntry {
  /** Keywords / regex patterns that trigger this entry */
  keywords: RegExp
  /** Priority — higher wins when multiple entries match (default 0) */
  priority?: number
  /** Response variations — one is picked at random */
  responses: string[]
}

// ─── Knowledge entries (ordered by topic) ─────────────────────────

export const BIRDIE_KNOWLEDGE: KnowledgeEntry[] = [
  // ══════════════════════════════════════════════
  // 1. GREETINGS & GENERAL
  // ══════════════════════════════════════════════
  {
    keywords: /^(hi|hello|hey|sup|yo|what'?s up|good (morning|afternoon|evening))/i,
    priority: -1,
    responses: [
      "Hey there! 👋 I'm Birdie, your Jays Shop assistant. I can help you find merch, check sizes, or explain how holds work. What can I do for you?",
      "Welcome to Jays Shop! I'm Birdie — ask me about products, holds, store locations, or anything Blue Jays. How can I help today?",
    ],
  },
  {
    keywords: /who are you|what (can you|do you) do|what is birdie|your name/i,
    responses: [
      "I'm Birdie, the Jays Shop virtual assistant! I can help you browse Blue Jays merchandise, explain how our hold system works, check product availability, and answer questions about the store. Think of me as your personal shopping guide at Rogers Centre! 🐦",
      "I'm Birdie — your AI shopping assistant for the official Jays Shop. I know our product catalog, how holds work, store locations inside Rogers Centre, and fan FAQs. Fire away!",
    ],
  },
  {
    keywords: /thank|thanks|thx|appreciate|cheers/i,
    priority: -1,
    responses: [
      "You're welcome! Let me know if you need anything else. Go Jays! 💙",
      "Happy to help! Enjoy the game and your Blue Jays gear! 🎉",
    ],
  },

  // ══════════════════════════════════════════════
  // 2. HOLDS — HOW THEY WORK
  // ══════════════════════════════════════════════
  {
    keywords: /how.*(hold|reserve|reservation)s? work|what.*(hold|reserve)|explain.*(hold|reserve)|place.*(hold|reserve)/i,
    priority: 2,
    responses: [
      "Here's how holds work at Jays Shop:\n\n1️⃣ Browse products on our Shop page\n2️⃣ Pick your size and tap \"Hold This Item\"\n3️⃣ Enter your name and phone number — no payment needed!\n4️⃣ Your item is reserved for 3 hours\n5️⃣ Show your QR code at any Jays Shop location to pick up\n\nYou can hold up to 3 items at a time. It's completely free!",
      "Placing a hold is easy and free! Find a product you like, select your size, and hit \"Hold This Item.\" You'll get a QR code to show staff at the store. Holds last 3 hours — perfect for grabbing gear during the game without worrying about it selling out. You can hold up to 3 items simultaneously.",
    ],
  },
  {
    keywords: /how long.*(hold|last|expire|reserved)|hold.*(duration|time|hours|expire|expiry)/i,
    priority: 2,
    responses: [
      "Holds last 3 hours from the moment you place them. This is designed for express stadium pickup — grab your gear during the game! If the hold expires before pickup, the item is automatically released back to inventory.",
      "Each hold is reserved for 3 hours. Since we're a stadium shop built for game-day convenience, the 3-hour window gives you plenty of time to stop by any Jays Shop location inside Rogers Centre.",
    ],
  },
  {
    keywords: /cancel.*(hold|reservation)|release.*(hold|item)|remove.*(hold)/i,
    priority: 1,
    responses: [
      "To cancel a hold, go to the \"My Holds\" page and you can release it from there. You can also just let it expire — holds automatically release after 3 hours. No penalty or charge for cancellations!",
      "You can cancel anytime from your My Holds page. Or simply don't pick it up — after 3 hours it's automatically released. There's never a charge for cancelling or letting a hold expire.",
    ],
  },
  {
    keywords: /extend.*(hold|reservation)|more time|renew.*(hold)/i,
    priority: 1,
    responses: [
      "Holds can't be extended beyond the 3-hour window — this keeps things fair for all fans. But you're welcome to place a new hold on the same item if it's still available after your current one expires!",
      "Sorry, holds aren't extendable. The 3-hour limit is designed for quick stadium pickup. If your hold expires, you can always re-hold the item if it's still in stock.",
    ],
  },
  {
    keywords: /how many.*(hold|item|reserve)|limit.*(hold|item)|maximum/i,
    priority: 1,
    responses: [
      "You can hold up to 3 items at the same time. This keeps inventory fair for all fans at the game. Once you pick up or release a hold, that slot opens up for another item!",
      "The limit is 3 simultaneous holds per fan. This ensures everyone gets a fair shot at the gear they want. Pick up an item and you free up a slot for another hold.",
    ],
  },
  {
    keywords: /cost.*(hold|reserve)|hold.*(free|charge|pay|fee)|pay.*(hold)/i,
    priority: 1,
    responses: [
      "Holds are 100% free — no payment or credit card required! You only pay when you pick up the item in store. Think of it as a no-commitment reservation.",
      "Completely free! No payment info needed to place a hold. You pay at the register when you pick up your item in person.",
    ],
  },

  // ══════════════════════════════════════════════
  // 3. PICKUP & IN-STORE
  // ══════════════════════════════════════════════
  {
    keywords: /pick\s?up|collect|how.*(get|retrieve).*(item|order|hold)|qr|show.*(code|staff)/i,
    priority: 1,
    responses: [
      "To pick up your held item:\n\n1️⃣ Go to any Jays Shop location inside Rogers Centre\n2️⃣ Show your QR code (from the My Holds page) to staff\n3️⃣ They'll locate your item and complete the sale\n\nIt's that simple! Priority pickup queue at Section 123.",
      "Head to any Jays Shop location and show your hold QR code to a team member. They'll pull your item right away — no waiting in the regular line. Our main priority pickup is at Section 123!",
    ],
  },
  {
    keywords: /where.*(store|shop|location|find)|which.*(section|store)|store.*(location|find|where|section)|rogers centre/i,
    priority: 1,
    responses: [
      "Jays Shop has multiple retail locations throughout Rogers Centre. Our main store and priority pickup point is at Section 123. You can pick up held items at any location — our real-time inventory system keeps everything synced across all stores!",
      "You'll find Jays Shop locations throughout Rogers Centre! The main store is near Section 123, which also serves as the priority pickup queue for held items. All locations share the same real-time inventory, so what you see online is what's available in-store.",
    ],
  },
  {
    keywords: /ship|deliver|online.*(order|buy|purchase)|mail|fedex|ups/i,
    responses: [
      "Currently, Jays Shop is an in-stadium pickup service — we don't offer shipping or delivery. The magic is in the live game-day experience! Reserve online, then grab your gear at Rogers Centre. 🏟️",
      "We're focused on the in-stadium experience right now, so shipping isn't available. Browse and hold items online, then pick them up at any Jays Shop location inside Rogers Centre during your visit!",
    ],
  },

  // ══════════════════════════════════════════════
  // 4. PRODUCTS — JERSEYS
  // ══════════════════════════════════════════════
  {
    keywords: /jersey|jerseys|replica|authentic|nike.*(jersey|replica)/i,
    priority: 1,
    responses: [
      "We carry official Nike Blue Jays jerseys including replicas and authentic on-field editions! Popular picks include Guerrero Jr. #27, Bichette #11, and Biggio #8. Head to Shop → Men → Jerseys (or Women/Kids) to see what's in stock with real-time availability.",
      "Our jersey collection features official Nike replicas in home white, away grey, and alternate royal blue. Player jerseys, blank jerseys, and custom options are available. Check the Shop page and filter by \"Jerseys\" to see current sizes and availability!",
    ],
  },
  {
    keywords: /vlad|guerrero|vladdy/i,
    priority: 2,
    responses: [
      "Vladdy's #27 jersey is one of our best sellers! Available in home white, away grey, and royal blue. Check Shop → Jerseys to see current size availability. Pro tip: hold one early in the game before they sell out! ⚾",
      "The Vladimir Guerrero Jr. #27 replica jersey is always in high demand! We stock it in multiple colorways. Browse the Shop page and filter by Jerseys to find your size — and place a hold if you spot one!",
    ],
  },

  // ══════════════════════════════════════════════
  // 5. PRODUCTS — HATS & CAPS
  // ══════════════════════════════════════════════
  {
    keywords: /cap|hat|fitted|snapback|toque|beanie|new era|59fifty|39thirty/i,
    priority: 1,
    responses: [
      "We've got a great selection of Blue Jays headwear! New Era fitted caps (59FIFTY), snapbacks (9FIFTY), flex-fit (39THIRTY), and winter toques. Head to Shop → filter by Hats to see styles, sizes, and real-time availability.",
      "From classic fitted 59FIFTYs to casual snapbacks and cozy winter toques — we've got your head covered! Check out our hat collection in the Shop under the Hats subcategory. Each listing shows live stock levels.",
    ],
  },

  // ══════════════════════════════════════════════
  // 6. PRODUCTS — APPAREL
  // ══════════════════════════════════════════════
  {
    keywords: /hoodie|hoodies|sweater|sweatshirt|pullover|zip.?up|fleece/i,
    priority: 1,
    responses: [
      "Stay warm in Blue Jays style! We carry pullover hoodies, zip-ups, and fleece options. Check Shop → Fleece for the full range. Sizes typically run from S to 3XL. Place a hold to make sure yours doesn't sell out during the game!",
      "Our hoodie and fleece collection includes classic navy pullovers, zip-up hoodies, and lightweight fleece options — perfect for those cool evening games at the dome! Browse Shop → Fleece to see what's available.",
    ],
  },
  {
    keywords: /t-?shirt|tee|tees|graphic.*(tee|shirt)/i,
    priority: 1,
    responses: [
      "We stock a variety of Blue Jays t-shirts — from classic logo tees to player-specific graphic tees and championship commemoratives. Check Shop → T-Shirts for the full lineup with real-time size availability!",
      "Our t-shirt collection features official Blue Jays designs, player tees, and special edition prints. Head to the Shop and filter by T-Shirts to see everything. Sizes range from S to 3XL in most styles.",
    ],
  },

  // ══════════════════════════════════════════════
  // 7. PRODUCTS — KIDS
  // ══════════════════════════════════════════════
  {
    keywords: /kid|kids|children|child|youth|toddler|infant|baby|junior/i,
    priority: 1,
    responses: [
      "We've got gear for the little fans too! 🧒 Our Kids section includes youth jerseys, t-shirts, hats, and accessories. Head to Shop → Kids to browse. Youth sizes typically range from XS to XL.",
      "Start 'em young! Our Kids collection features youth-sized jerseys, tees, caps, and fun accessories. Filter by \"Kids\" in the Shop to find age-appropriate gear. Great for making game day extra special for the whole family! ⚾",
    ],
  },

  // ══════════════════════════════════════════════
  // 8. PRODUCTS — ACCESSORIES
  // ══════════════════════════════════════════════
  {
    keywords: /accessor|keychain|lanyard|pin|pennant|flag|mug|tumbler|blanket|towel|scarf|bag|backpack|souvenir/i,
    priority: 1,
    responses: [
      "Looking for souvenirs or accessories? We carry keychains, lanyards, pins, pennants, mugs, tumblers, rally towels, blankets, and more! Filter by \"Accessories\" in the Shop to browse the full selection.",
      "Our accessories collection has something for every fan — from collectible pins and pennants to practical items like tumblers, bags, and rally towels. Check Shop → Accessories to see what's in stock!",
    ],
  },

  // ══════════════════════════════════════════════
  // 9. SIZING & FIT
  // ══════════════════════════════════════════════
  {
    keywords: /size|sizing|fit|fitting|what size|size chart|measurements|too (big|small|tight|loose)|run (big|small)/i,
    priority: 1,
    responses: [
      "For jerseys: Nike replicas generally run true to size. If you prefer a looser fit or plan to layer, go one size up. Sizes range S–3XL for adults.\n\nFor fitted caps: Measure around your head just above the ears. Common sizes are 7 to 7⅝.\n\nIf you're unsure, our in-store staff can help you find the perfect fit!",
      "Sizing tips:\n• Jerseys: True to size for a standard fit; size up for layering\n• Hoodies/Fleece: Standard fit, check individual product descriptions\n• Fitted caps: Know your head size (7–7⅝ range)\n• T-shirts: Standard unisex/men's or women's cut\n\nStill unsure? Place a hold and try it on at the store — no commitment until you pay!",
    ],
  },

  // ══════════════════════════════════════════════
  // 10. PRICING
  // ══════════════════════════════════════════════
  {
    keywords: /price|cost|how much|expensive|cheap|affordable|budget|deals|sale|discount|promo/i,
    priority: 1,
    responses: [
      "All prices are shown in CAD on each product page. General ranges:\n• Jerseys: $159–$189\n• Hoodies/Fleece: $89–$129\n• T-Shirts: $39–$59\n• Caps/Hats: $35–$55\n• Accessories: $12–$45\n\nPrices reflect official MLB merchandise. Check individual product pages for exact pricing!",
      "Pricing is listed in Canadian dollars on every product page. We carry official MLB-licensed merchandise, so prices reflect authentic quality. Browse the Shop to see exact prices — they're displayed right on each product card!",
    ],
  },

  // ══════════════════════════════════════════════
  // 11. AVAILABILITY & STOCK
  // ══════════════════════════════════════════════
  {
    keywords: /stock|in stock|available|availability|out of stock|sold out|inventory|when.*(back|restock)/i,
    priority: 1,
    responses: [
      "Our Shop page shows real-time inventory across all Jays Shop locations inside Rogers Centre. If an item shows as available, it's on the shelf right now! If something's sold out, check back — we restock regularly, especially on game days.",
      "Every product listing shows live availability. The inventory updates in real-time as items are sold or restocked. If you spot something you want, place a hold right away — popular items (especially player jerseys) move fast on game day! ⚾",
    ],
  },
  {
    keywords: /which store has|where.*(find|get|buy).*(specific|particular|this)|location.*(stock|carry|have)/i,
    priority: 1,
    responses: [
      "Our system shows real-time inventory across all Jays Shop locations. When you view a product, you can see which store sections currently have it in stock. The main store at Section 123 typically carries the widest selection!",
      "Each product page shows availability by store location. Our inventory is synced across all Rogers Centre Jays Shop locations in real time, so you can see exactly where your item is waiting. Priority pickup is at Section 123.",
    ],
  },

  // ══════════════════════════════════════════════
  // 12. GAME DAY TIPS
  // ══════════════════════════════════════════════
  {
    keywords: /game day|game.?day|tip|advice|first (time|game)|what should i|recommend/i,
    responses: [
      "Game day shopping tips! 🏟️\n\n• Browse & hold items BEFORE you arrive — beat the rush!\n• Popular jerseys sell fast in the first few innings\n• Priority pickup at Section 123 means no waiting in line\n• Holds last 3 hours — perfect for grabbing gear between innings\n• Check the Kids section for little fans — great souvenir picks!",
      "Pro tips for game day:\n\n1. Pre-browse the shop and hold your must-haves before gates open\n2. Use the priority pickup queue at Section 123 for faster service\n3. Keep an eye on limited-edition drops — they go fast!\n4. Holds are free, so reserve first and decide later\n5. Our inventory updates live, so if it shows in stock, it's there!",
    ],
  },

  // ══════════════════════════════════════════════
  // 13. PAYMENT & TRANSACTIONS
  // ══════════════════════════════════════════════
  {
    keywords: /pay|payment|credit card|debit|cash|apple pay|tap|visa|mastercard|amex/i,
    priority: 1,
    responses: [
      "Payment is handled in-store when you pick up your item. Jays Shop accepts all major credit/debit cards and contactless payment (Apple Pay, Google Pay, tap). We do not accept cash. Holds themselves are completely free — no payment info required!",
      "You pay at the counter when you collect your held item. We accept Visa, Mastercard, Amex, debit, Apple Pay, and Google Pay — no cash. No payment is needed to place a hold — it's just a reservation!",
    ],
  },
  {
    keywords: /refund|return|exchange|warranty|defect/i,
    responses: [
      "For returns, exchanges, or defective merchandise, please speak with staff at any Jays Shop location. They can assist with exchanges and process refunds according to store policy. Bring your receipt for the smoothest experience!",
      "Returns and exchanges are handled by our in-store team. Visit any Jays Shop location at Rogers Centre with your receipt, and our staff will take care of you. For defective items, we'll make it right!",
    ],
  },

  // ══════════════════════════════════════════════
  // 14. ACCOUNT & MY HOLDS
  // ══════════════════════════════════════════════
  {
    keywords: /my holds|my.*(reservation|account|order)|view.*(hold|reservation)|check.*(hold|status)/i,
    priority: 1,
    responses: [
      "Visit the \"My Holds\" page from the top navigation to see all your current and past reservations. You'll find your QR code, item details, hold status, and time remaining. You can also release holds from there!",
      "Head to My Holds in the navigation bar — that's your personal dashboard. You'll see active holds with countdown timers, QR codes for pickup, and your hold history. It's all tied to your phone number!",
    ],
  },

  // ══════════════════════════════════════════════
  // 15. BLUE JAYS TEAM INFO
  // ══════════════════════════════════════════════
  {
    keywords: /world series|championship|1992|1993|2025|alcs|pennant|history|founded/i,
    responses: [
      "The Toronto Blue Jays — Canada's team! 🇨🇦\n\n• Founded: 1977 (first MLB franchise in Canada)\n• World Series Champions: 1992, 1993 (back-to-back!)\n• 2025 ALCS Champions\n• Home: Rogers Centre, Toronto\n\nCelebrate the legacy with official championship gear at the Jays Shop!",
      "Blue Jays highlights: Founded 1977, back-to-back World Series champs in '92 and '93, and 2025 ALCS champions! You can find championship commemorative gear and retro throwback items in our shop. ⚾🏆",
    ],
  },
  {
    keywords: /player|roster|who plays|lineup|bichette|biggio|springer/i,
    responses: [
      "We carry jerseys and gear for current and fan-favorite Blue Jays players! Popular picks include Guerrero Jr. #27, Bichette #11, Springer #4, and Biggio #8. Browse Shop → Jerseys to find your favorite player's gear.",
      "Looking for player gear? We stock jerseys, t-shirts, and accessories featuring current roster players and Blue Jays legends. Head to the Shop and search by player name to find what's available!",
    ],
  },

  // ══════════════════════════════════════════════
  // 16. BRANDS & PARTNERS
  // ══════════════════════════════════════════════
  {
    keywords: /brand|nike|new era|'?47|fanatics|roots|mitchell.*(ness)|majestic|partner/i,
    responses: [
      "Jays Shop carries officially licensed merchandise from top brands:\n• Nike — Jerseys, performance wear\n• New Era — Fitted caps, snapbacks\n• '47 Brand — Casual caps, relaxed wear\n• Roots — Canadian-made lifestyle apparel\n• Fanatics — Fan gear and accessories\n\nAll products are authentic MLB-licensed merchandise!",
      "We partner with the biggest names in sports apparel! Nike for jerseys and performance gear, New Era for the iconic fitted caps, '47 for casual wear, Roots for Canadian-made items, and more. Everything in the shop is officially licensed. 🏷️",
    ],
  },

  // ══════════════════════════════════════════════
  // 17. REVIEWS & RATINGS
  // ══════════════════════════════════════════════
  {
    keywords: /review|rating|feedback|rate|stars|recommend|opinion/i,
    responses: [
      "You can leave a review on any product page! Just scroll down to the reviews section, pick your star rating (1–5), and share your thoughts. Your feedback helps other fans make great choices. 🌟",
      "We love hearing from fans! Each product page has a reviews section where you can rate items and leave written feedback. Reviews help fellow fans and help us improve our selection!",
    ],
  },

  // ══════════════════════════════════════════════
  // 18. LANGUAGE & ACCESSIBILITY
  // ══════════════════════════════════════════════
  {
    keywords: /language|french|fran[çc]ais|spanish|espa[ñn]ol|translate|english/i,
    responses: [
      "Jays Shop supports English, French, and Spanish! Use the language selector in the top navigation bar to switch. The site, product info, and navigation will update to your preferred language. 🌍",
      "You can switch languages using the dropdown in the header — we offer English, Français, and Español. All core content including navigation, categories, and product information is available in all three languages!",
    ],
  },

  // ══════════════════════════════════════════════
  // 19. STORE HOURS & OPERATIONS
  // ══════════════════════════════════════════════
  {
    keywords: /hours|open|close|when.*(open|close)|operating|schedule/i,
    responses: [
      "Jays Shop at Gate 5 is open 10:00 AM – 5:00 PM. On game days the store closes to the general public before gates open (gates open 2 hours before first pitch) — about 1 hour before gates on weekdays and 2 hours before gates on weekends. After that, it serves ticketed fans only!",
      "We're open 10:00 AM to 5:00 PM daily. Heads up for game days: the store closes to the general public ahead of gate opening — 1 hour before gates on weekdays, 2 hours before on weekends — so shop early or place a hold in advance to skip the rush!",
    ],
  },

  // ══════════════════════════════════════════════
  // 20. GIFT IDEAS
  // ══════════════════════════════════════════════
  {
    keywords: /gift|present|birthday|surprise|for (my|a) (friend|dad|mom|son|daughter|husband|wife|kid)/i,
    responses: [
      "Great gift ideas for Blue Jays fans! 🎁\n\n• Jerseys — the ultimate fan gift ($159–$189)\n• Fitted caps — classic and stylish ($35–$55)\n• Hoodies — cozy and practical ($89–$129)\n• Accessories — keychains, mugs, pins ($12–$45)\n\nNot sure about sizing? A cap or accessory is always a safe bet!",
      "Shopping for someone special? Our best-selling gifts include player jerseys, New Era fitted caps, and Blue Jays hoodies. For a budget-friendly option, check out our accessories — pins, keychains, and rally towels make great souvenirs! Can't decide on a size? Caps and accessories are worry-free picks. 🎁",
    ],
  },

  // ══════════════════════════════════════════════
  // 21. SPECIAL / LIMITED EDITIONS
  // ══════════════════════════════════════════════
  {
    keywords: /limited edition|special edition|exclusive|collector|commemorat|rare|new (arrival|drop|release)/i,
    responses: [
      "We occasionally carry limited-edition and commemorative items — especially around playoffs, special events, and team milestones. These move FAST, so check the Shop regularly and hold items the moment you spot them! Follow @BlueJays on social media for drop announcements. 🔥",
      "Limited editions and exclusive drops are available periodically! Championship commemorative gear, special event merchandise, and player milestone items are some of our most popular sellers. Browse the Shop and keep an eye out — when they're gone, they're gone!",
    ],
  },

  // ══════════════════════════════════════════════
  // 22. ABOUT THE JAYS SHOP
  // ══════════════════════════════════════════════
  {
    keywords: /about.*(jays shop|store|us)|what is jays shop|tell me about/i,
    responses: [
      "Jays Shop is the official retail destination for Toronto Blue Jays fans! Located throughout Rogers Centre, we offer authentic team merchandise — jerseys, apparel, collectibles, and exclusive game-day products. Our mission: a seamless omnichannel retail experience with real-time inventory visibility, convenient stadium pickup, and exceptional customer service. Visit our About page to learn more! 💙",
      "The Jays Shop is the official Blue Jays merchandise store at Rogers Centre. We combine the excitement of live baseball with modern shopping tech — real-time inventory, location-aware browsing, and our unique hold system for express pickup. Check out the About page for our full story!",
    ],
  },

  // ══════════════════════════════════════════════
  // 23. SOCIAL MEDIA
  // ══════════════════════════════════════════════
  {
    keywords: /social media|instagram|twitter|x\.com|follow|@bluejays/i,
    responses: [
      "Follow the Blue Jays on social media for the latest news, merch drops, and fan content!\n\n📸 Instagram: @bluejays\n🐦 X (Twitter): @BlueJays\n\nLinks are in the footer of our site!",
      "Stay connected with the Blue Jays! Find us on Instagram (@bluejays) and X (@BlueJays) for news, exclusive drops, and fan highlights. Check the footer for direct links! 📱",
    ],
  },

  // ══════════════════════════════════════════════
  // 24. NAVIGATION HELP
  // ══════════════════════════════════════════════
  {
    keywords: /how.*(browse|shop|find|navigate|use)|where.*(product|category|filter)/i,
    responses: [
      "Here's how to browse:\n\n1. Go to the Shop page from the top navigation\n2. Use the category pills (Men, Women, Kids, Accessories) to filter\n3. Pick a subcategory (Jerseys, Hats, Fleece, etc.)\n4. Use the search bar to find specific items\n5. Click any product for details, then hold it!\n\nThe search bar also supports player names, brands, and product types.",
      "Shopping is easy! Use the category tabs at the top of the Shop page to filter by Men, Women, Kids, or Accessories. Then narrow down with subcategories. You can also type directly into the search bar — it works with player names, product types, and brands!",
    ],
  },

  // ══════════════════════════════════════════════
  // 25. COMPLAINTS / ISSUES
  // ══════════════════════════════════════════════
  {
    keywords: /problem|issue|complaint|not working|broken|bug|error|wrong|bad experience|frustrated|unhappy/i,
    priority: 2,
    responses: [
      "I'm sorry to hear you're having trouble! 😔 Here's what I'd suggest:\n\n• For website issues: Try refreshing the page or clearing your browser cache\n• For hold issues: Check My Holds to see your current status\n• For in-store concerns: Please speak with a Jays Shop team member\n• For urgent issues: Contact our staff directly at any store location\n\nIs there something specific I can help troubleshoot?",
      "Sorry about that! Let me try to help:\n\n• If a product isn't loading, try refreshing the page\n• If a hold seems stuck, visit My Holds to check its status\n• For product quality or in-store service issues, our staff at any Jays Shop location can assist you directly\n\nWhat specific issue are you running into?",
    ],
  },

  // ══════════════════════════════════════════════
  // 26. STAFF / EMPLOYMENT
  // ══════════════════════════════════════════════
  {
    keywords: /job|hiring|work|employ|staff|career|volunteer/i,
    responses: [
      "For employment opportunities at the Jays Shop or Rogers Centre, please check the official Toronto Blue Jays careers page or inquire in person at the store. I can help with shopping — but HR is a bit outside my wheelhouse! 😄",
      "Interested in joining the team? Job openings for Rogers Centre and Blue Jays retail are posted on the official Blue Jays website under Careers. I'm here for shopping help, but I hope you find a great opportunity! 💙",
    ],
  },

  // ══════════════════════════════════════════════
  // 27. WEATHER & DOME
  // ══════════════════════════════════════════════
  {
    keywords: /weather|rain|cold|dome|roof|indoor|outdoor/i,
    responses: [
      "Rogers Centre has a retractable roof, so games go on rain or shine! The Jays Shop locations are inside the stadium, so you can shop comfortably regardless of weather. Pro tip: if the roof is closed on a cool night, grab a hoodie from our Fleece section! 🌧️",
      "No need to worry about weather — Rogers Centre's retractable roof keeps everyone dry. All Jays Shop locations are inside the stadium. That said, our fleece and hoodies are great for air-conditioned comfort during those hot summer games! 😄",
    ],
  },

  // ══════════════════════════════════════════════
  // 28. WOMEN'S MERCHANDISE
  // ══════════════════════════════════════════════
  {
    keywords: /women|woman|ladies|female|girl|her/i,
    priority: 1,
    responses: [
      "We have a dedicated Women's collection! Shop → Women features jerseys, tees, hoodies, and accessories designed for women's fit and sizing. Brands like Nike and Fanatics offer women's-cut versions of popular styles. 💙",
      "Our Women's section has a great selection of Blue Jays gear tailored for a women's fit — jerseys, graphic tees, hoodies, and more. Head to Shop → Women to browse! Sizing runs XS to 2XL in most styles.",
    ],
  },

  // ══════════════════════════════════════════════
  // 29. CUSTOMIZATION
  // ══════════════════════════════════════════════
  {
    keywords: /custom|personalize|name on|my name|number on|customize/i,
    responses: [
      "For custom jerseys with your name and number, please ask staff at the main Jays Shop location (Section 123). Customization options may vary by game day and availability. It's a popular service, so ask early! ⚾",
      "Jersey customization with your own name and number may be available at select store locations — check with staff at Section 123 for current options and turnaround time. Custom orders are handled in-store only.",
    ],
  },

  // ══════════════════════════════════════════════
  // 30. CATCH-ALL / UNRECOGNIZED
  // ══════════════════════════════════════════════
  {
    keywords: /.*/,
    priority: -10,
    responses: [
      "I'm not sure I understood that — but I'm here to help with anything Jays Shop related! Try asking about:\n\n• Products (jerseys, caps, hoodies, accessories)\n• How holds work\n• Store locations at Rogers Centre\n• Sizing and pricing\n• Your current holds\n\nWhat would you like to know?",
      "Hmm, I didn't quite catch that. I can help with:\n\n🛍️ Product info and availability\n📌 How to place and manage holds\n🏟️ Store locations and pickup\n📏 Sizing and pricing\n\nTry rephrasing or pick one of these topics!",
    ],
  },
]

// ─── System prompt for OpenAI mode ────────────────────────────────

export const BIRDIE_SYSTEM_CONTEXT = `STORE DETAILS:
- Jays Shop is the official merchandise store for the Toronto Blue Jays
- Multiple retail locations inside Rogers Centre, Toronto
- Main store and priority pickup at Section 123
- In-stadium pickup only — no shipping or delivery
- Real-time inventory visibility across all locations
- Open 10 AM – 5 PM; on game days, closes to the general public before gates open (gates open ~2hrs before first pitch): 1hr before gates on weekdays, 2hrs before on weekends

HOW HOLDS WORK:
- Holds are free — no payment or credit card required
- Each hold lasts 3 hours (express stadium pickup window)
- Customers can hold up to 3 items at once
- Show QR code in-store to pick up
- Items expire automatically if not picked up
- Holds cannot be extended, but items can be re-held if still available
- Cancel anytime from My Holds page

PRODUCT CATEGORIES:
- Men: Jerseys, Fleece/Hoodies, T-Shirts, Hats, Accessories
- Women: Jerseys, Tees, Hoodies, Accessories
- Kids/Youth: Jerseys, T-Shirts, Hats, Accessories
- Accessories: Keychains, pins, pennants, mugs, tumblers, towels, bags

BRANDS: Nike, New Era, '47 Brand, Roots, Fanatics, Mitchell & Ness

PRICING (CAD):
- Jerseys: $159–$189
- Hoodies/Fleece: $89–$129
- T-Shirts: $39–$59
- Caps/Hats: $35–$55
- Accessories: $12–$45

PAYMENT: All major credit/debit cards, Apple Pay, Google Pay (in-store only). Cash is not accepted.

SIZING: Jerseys run true to size (S–3XL); fitted caps 7–7⅝; women's XS–2XL; youth XS–XL

TEAM FACTS:
- Founded: 1977 (first MLB franchise in Canada)
- World Series Champions: 1992, 1993
- 2025 ALCS Champions
- Popular players: Guerrero Jr. #27, Bichette #11, Springer #4, Biggio #8

SOCIAL: Instagram @bluejays, X (Twitter) @BlueJays

LANGUAGES: English, French (Français), Spanish (Español)

REVIEWS: Fans can rate products 1–5 stars and leave written reviews on product pages`

// ─── Helper: pick a canned reply ──────────────────────────────────

export function getCannedReply(userMessage: string): string {
  const lower = userMessage.toLowerCase().trim()

  // Find all matching entries, sort by priority descending
  const matches = BIRDIE_KNOWLEDGE
    .filter((entry) => entry.keywords.test(lower))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  const best = matches[0]
  if (!best) {
    return "I'm here to help with anything Jays Shop related! Ask me about products, holds, store locations, or sizing."
  }

  // Pick a random response variation
  const idx = Math.floor(Math.random() * best.responses.length)
  return best.responses[idx]
}
