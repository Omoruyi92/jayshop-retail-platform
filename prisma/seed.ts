/**
 * prisma/seed.ts — comprehensive demo seed for Jays Shop.
 *
 * Populates a fresh database with the full production-like demo dataset so
 * anyone who clones the repo gets a fully working storefront with every
 * feature visible:
 *
 *   - Default Tenant + HoldSettings + SlackSettings stub
 *   - Admin accounts: admin@jays.shop (OWNER) and staff@jays.shop (STAFF),
 *     password taken from the SEED_ADMIN_PASSWORD env var (bcrypt, cost 12)
 *   - All 12 StoreLocation records (main store, gates, stadium sections,
 *     pickup queue)
 *   - All 12 Products with their 37 per-size SizeInventory rows
 *   - All 16 HeroSlide records (HOME carousel, SHOP / STYLE_LANDING /
 *     PLAYERS / GALLERY heroes)
 *   - StyleCategory records for the Shop-by-Style landing page
 *
 * Runtime data (AuditLog, InventoryTransaction, Hold, HoldHistory, Customer)
 * is intentionally NOT seeded — it is created by using the app.
 *
 * Row IDs match production so existing media URLs (Cloudflare R2 objects and
 * local /uploads/, /hero-videos/ paths) keep resolving.
 *
 * The seed is idempotent: every record is upserted on its unique key, so it
 * is safe to run `npx prisma db seed` multiple times.
 *
 * Usage:
 *   SEED_ADMIN_PASSWORD=your-local-password npx prisma db seed
 */
import { PrismaClient, AdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD

// ---------------------------------------------------------------------------
// Exported demo data (IDs match production so media URLs keep working)
// ---------------------------------------------------------------------------

const TENANT = {
  id: "cms64ma4z000054r0zc5h4m8y",
  name: "Default",
  slug: "default",
  isDefault: true,
  createdAt: new Date("2026-07-29T13:34:30.612Z"),
} as const

const HOLD_SETTINGS = {
  id: "cms7k4u9h000113ei9qgqx2dt",
  enable48HourHold: true,
  standardHoldHours: 3,
  extendedHoldHours: 48,
} as const

const SLACK_SETTINGS = {
  id: "cms7k477e000210wi8480sacz",
  webhookUrl: "",
  channelName: "#jays-shop-holds",
  interactiveEnabled: false,
} as const

const STORE_LOCATIONS = [
  {
    id: "cms64ma55000254r00a4q0zkr",
    code: "SEC-110",
    name: "Section 110 / Gate 5",
    isMainStore: true,
    isPickupQueue: false,
    active: true,
    sortOrder: 1,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.617Z"),
  },
  {
    id: "cms64ma59000454r0a5hrrngs",
    code: "GATE-1",
    name: "Gate 1",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 2,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.621Z"),
  },
  {
    id: "cms64ma5a000654r0w3zb3pxr",
    code: "SEC-114",
    name: "Section 114",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 3,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.622Z"),
  },
  {
    id: "cms64ma5b000854r04hyav40t",
    code: "SEC-123",
    name: "Section 123",
    isMainStore: false,
    isPickupQueue: true,
    active: true,
    sortOrder: 4,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.624Z"),
  },
  {
    id: "cms64ma5c000a54r0w8cbe1nt",
    code: "SEC-133",
    name: "Section 133",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 5,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.625Z"),
  },
  {
    id: "cms64ma5d000c54r076qruzli",
    code: "SEC-136",
    name: "Section 136",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 6,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.625Z"),
  },
  {
    id: "cms64ma5e000e54r0szomv9ba",
    code: "SEC-146",
    name: "Section 146",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 7,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.627Z"),
  },
  {
    id: "cms64ma5f000g54r0tdal0xez",
    code: "SEC-213",
    name: "Section 213",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 8,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.627Z"),
  },
  {
    id: "cms64ma5g000i54r0wiwp63i7",
    code: "SEC-235",
    name: "Section 235",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 9,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.628Z"),
  },
  {
    id: "cms64ma5g000k54r0uduhiizq",
    code: "SEC-515",
    name: "Section 515",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 10,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.629Z"),
  },
  {
    id: "cms64ma5h000m54r0jwtnsg7f",
    code: "SEC-525",
    name: "Section 525",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 11,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.63Z"),
  },
  {
    id: "cms64ma5i000o54r0lkpocyh4",
    code: "SEC-530",
    name: "Section 530",
    isMainStore: false,
    isPickupQueue: false,
    active: true,
    sortOrder: 12,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    createdAt: new Date("2026-07-29T13:34:30.631Z"),
  },
] as const

const STYLE_CATEGORIES = [
  {
    id: "cmuu55qo50002bupzzkhfqw8q",
    name: "Fleece",
    slug: "fleece",
    coverImageUrl: "/uploads/styles/QzwHCzoKlQ.webp",
    sortOrder: 0,
    isActive: true,
    createdAt: new Date("2026-10-04T18:15:31.397Z"),
  },
] as const

const PRODUCTS = [
  {
    id: "cms7k477n000410wisy0xin77",
    name: "Vladimir Guerrero Jr. #27 Home Jersey",
    slug: "vlad-jr-home-jersey",
    description: "Official Nike replica jersey, navy blue with white lettering. Authentic team colours with tackle-twill name and number.",
    priceCents: 17999,
    imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80",
    category: "men",
    subcategory: "jerseys",
    quantity: 19,
    sizes: "S,M,L,XL,2XL,3XL",
    brand: "Nike",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.044Z"),
  },
  {
    id: "cms7k4780000i10wilnau8nwb",
    name: "Bo Bichette #11 Away Jersey",
    slug: "bo-bichette-away-jersey",
    description: "Authentic MLB away jersey in grey with jays-red accents. Moisture-wicking fabric ideal for warm days.",
    priceCents: 16999,
    imageUrl: "https://images.unsplash.com/photo-1529520426793-9e2a5e3f2b03?w=600&q=80",
    category: "men",
    subcategory: "jerseys",
    quantity: 18,
    sizes: "S,M,L,XL,2XL",
    brand: "Nike",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.056Z"),
  },
  {
    id: "cms7k4784000u10wie1csaq2g",
    name: "Blue Jays Women's V-Neck Tee",
    slug: "women-v-neck-tee",
    description: "Soft cotton blend V-neck with embroidered Blue Jays logo on the chest. Machine washable.",
    priceCents: 3999,
    imageUrl: "https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=600&q=80",
    category: "women",
    subcategory: "tops",
    quantity: 18,
    sizes: "XS,S,M,L,XL",
    brand: "Fanatics",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.06Z"),
  },
  {
    id: "cms7k4789001610wik5hanp2u",
    name: "Blue Jays Youth Replica Jersey",
    slug: "youth-replica-jersey",
    description: "Official youth jersey designed for smaller frames. Same great design as the adult version.",
    priceCents: 8999,
    imageUrl: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=600&q=80",
    category: "kids",
    subcategory: "jerseys",
    quantity: 15,
    sizes: "XS,S,M,L",
    brand: "Nike",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.065Z"),
  },
  {
    id: "cms7k478c001g10wiv09j3wmm",
    name: "Blue Jays New Era 59Fifty Fitted Cap",
    slug: "new-era-fitted-cap",
    description: "Structured crown fitted cap with authentic team logo. New Era's flagship game-day model.",
    priceCents: 4999,
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    category: "hats",
    subcategory: "fitted",
    quantity: 23,
    sizes: "7,7 1/8,7 1/4,7 3/8,7 1/2,7 5/8,7 3/4",
    brand: "New Era",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.068Z"),
  },
  {
    id: "cms7k478h001w10wi9ylwsb22",
    name: "Blue Jays Snapback Cap",
    slug: "snapback-cap",
    description: "Adjustable snapback with flat brim and embroidered bird head logo. One size fits most.",
    priceCents: 3499,
    imageUrl: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80",
    category: "hats",
    subcategory: "snapbacks",
    quantity: 25,
    brand: "New Era",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.074Z"),
  },
  {
    id: "cms7k478i001y10wi2y3kfx6y",
    name: "Blue Jays Full-Zip Hoodie",
    slug: "full-zip-hoodie",
    description: "Heavy fleece full-zip hoodie with embroidered chest logo and Rogers Centre graphic on back.",
    priceCents: 8499,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
    category: "men",
    subcategory: "hoodies",
    quantity: 18,
    sizes: "S,M,L,XL,2XL",
    brand: "Fanatics",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.075Z"),
  },
  {
    id: "cms7k478m002a10wibvzt4jga",
    name: "Blue Jays Women's Quarter-Zip Fleece",
    slug: "women-quarter-zip-fleece",
    description: "Soft-shell quarter-zip with metallic Blue Jays wordmark. Great for cool stadium evenings.",
    priceCents: 6999,
    imageUrl: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&q=80",
    category: "women",
    subcategory: "hoodies",
    quantity: 18,
    sizes: "XS,S,M,L,XL",
    brand: "Fanatics",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.079Z"),
  },
  {
    id: "cms7k478q002m10wi4x5hx8gn",
    name: "Blue Jays Ceramic Coffee Mug",
    slug: "coffee-mug",
    description: "15 oz ceramic mug with full-wrap team logo. Microwave and dishwasher safe.",
    priceCents: 1999,
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
    category: "accessories",
    subcategory: "mugs",
    quantity: 40,
    brand: "MLB",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.083Z"),
  },
  {
    id: "cms7k478r002o10wiqpxk0p0a",
    name: "Blue Jays Insulated Water Bottle",
    slug: "insulated-water-bottle",
    description: "32 oz stainless steel insulated bottle. Keeps cold 24h, hot 12h. Leak-proof lid.",
    priceCents: 3499,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
    category: "accessories",
    subcategory: "drinkware",
    quantity: 25,
    brand: "MLB",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.084Z"),
  },
  {
    id: "cms7k478s002q10wifssjskym",
    name: "Blue Jays Pennant Flag",
    slug: "pennant-flag",
    description: "Classic felt pennant, 30 \u00d7 12 in, with wood dowel. Perfect for bedroom or office wall.",
    priceCents: 1299,
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80",
    category: "memorabilia",
    subcategory: "flags",
    quantity: 50,
    brand: "WinCraft",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.085Z"),
  },
  {
    id: "cms7k478t002s10wiklpnm4q1",
    name: "Blue Jays Autograph Mini Bat",
    slug: "mini-bat",
    description: "Official MLB souvenir mini bat, 18 in. Hand-finished with team colours. Great keepsake.",
    priceCents: 2499,
    imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80",
    category: "memorabilia",
    subcategory: "collectibles",
    quantity: 8,
    brand: "MLB",
    status: "AVAILABLE",
    isLicensed: false,
    isChampion: false,
    isBestSeller: false,
    isClearance: false,
    tenantId: "cms64ma4z000054r0zc5h4m8y",
    isFeatured: false,
    isNewArrival: false,
    isSport: false,
    isWorldSeries: false,
    salePriceCents: 0,
    isBlankJersey: false,
    isCityConnect: false,
    isChampionshipGear: false,
    holdEnabled: true,
    createdAt: new Date("2026-07-30T13:36:07.086Z"),
  },
] as const

const SIZE_INVENTORIES = [
  {
    id: "cms7k477v000810wiyxxich8q",
    productId: "cms7k477n000410wisy0xin77",
    size: "M",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k477w000a10wimyyh4i3g",
    productId: "cms7k477n000410wisy0xin77",
    size: "L",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k477x000c10wi0ptnmaqm",
    productId: "cms7k477n000410wisy0xin77",
    size: "XL",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k477z000g10wizmy1szkf",
    productId: "cms7k477n000410wisy0xin77",
    size: "3XL",
    quantity: 1,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4781000m10wih2to6z2m",
    productId: "cms7k4780000i10wilnau8nwb",
    size: "M",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4782000o10wiuiis2vxf",
    productId: "cms7k4780000i10wilnau8nwb",
    size: "L",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4782000q10wienot53md",
    productId: "cms7k4780000i10wilnau8nwb",
    size: "XL",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4786000y10witylzq50q",
    productId: "cms7k4784000u10wie1csaq2g",
    size: "S",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4786001010wih3vlk82o",
    productId: "cms7k4784000u10wie1csaq2g",
    size: "M",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4788001410wizj80sq52",
    productId: "cms7k4784000u10wie1csaq2g",
    size: "XL",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478b001a10wis3vgkns2",
    productId: "cms7k4789001610wik5hanp2u",
    size: "S",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478b001c10wi7tkbbzzk",
    productId: "cms7k4789001610wik5hanp2u",
    size: "M",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478e001m10wii0ebele2",
    productId: "cms7k478c001g10wiv09j3wmm",
    size: "7 1/4",
    quantity: 4,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478f001o10wiuhwrd37w",
    productId: "cms7k478c001g10wiv09j3wmm",
    size: "7 3/8",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478f001q10wiiflv52ko",
    productId: "cms7k478c001g10wiv09j3wmm",
    size: "7 1/2",
    quantity: 4,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478g001s10wii40tuna2",
    productId: "cms7k478c001g10wiv09j3wmm",
    size: "7 5/8",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478g001u10wi88pzehch",
    productId: "cms7k478c001g10wiv09j3wmm",
    size: "7 3/4",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478k002210wihu4wxo3u",
    productId: "cms7k478i001y10wi2y3kfx6y",
    size: "M",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478k002410wihrz5rixs",
    productId: "cms7k478i001y10wi2y3kfx6y",
    size: "L",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478l002610wile0o14qy",
    productId: "cms7k478i001y10wi2y3kfx6y",
    size: "XL",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478m002810wiommwk3yq",
    productId: "cms7k478i001y10wi2y3kfx6y",
    size: "2XL",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478o002e10wi1xszppdp",
    productId: "cms7k478m002a10wibvzt4jga",
    size: "S",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478o002g10wi8ixmrtx3",
    productId: "cms7k478m002a10wibvzt4jga",
    size: "M",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478p002i10wi3294h487",
    productId: "cms7k478m002a10wibvzt4jga",
    size: "L",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478p002k10wijcdnv214",
    productId: "cms7k478m002a10wibvzt4jga",
    size: "XL",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478b001e10wi3r1vvqeh",
    productId: "cms7k4789001610wik5hanp2u",
    size: "L",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 1,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k477y000e10wi7kpob1ok",
    productId: "cms7k477n000410wisy0xin77",
    size: "2XL",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 1,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478d001i10wia9o5q796",
    productId: "cms7k478c001g10wiv09j3wmm",
    size: "7",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4783000s10wivnre931d",
    productId: "cms7k4780000i10wilnau8nwb",
    size: "2XL",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478n002c10wivaqvir3m",
    productId: "cms7k478m002a10wibvzt4jga",
    size: "XS",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4788001210wi5wqe0d1t",
    productId: "cms7k4784000u10wie1csaq2g",
    size: "L",
    quantity: 5,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k477s000610wi45nzgscn",
    productId: "cms7k477n000410wisy0xin77",
    size: "S",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 1,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4781000k10wi478ku26u",
    productId: "cms7k4780000i10wilnau8nwb",
    size: "S",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 1,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k4785000w10wi8u9f2sgo",
    productId: "cms7k4784000u10wie1csaq2g",
    size: "XS",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478a001810wigk3z27it",
    productId: "cms7k4789001610wik5hanp2u",
    size: "XS",
    quantity: 2,
    heldQuantity: 0,
    pickedQuantity: 1,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478e001k10witpxtp3hl",
    productId: "cms7k478c001g10wiv09j3wmm",
    size: "7 1/8",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 0,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
  {
    id: "cms7k478j002010wij61dd7rv",
    productId: "cms7k478i001y10wi2y3kfx6y",
    size: "S",
    quantity: 3,
    heldQuantity: 0,
    pickedQuantity: 1,
    locationId: "cms64ma55000254r00a4q0zkr",
  },
] as const

const HERO_SLIDES = [
  {
    id: "cms64kodu0003wxa04gta89zg",
    scope: "GALLERY",
    mediaType: "VIDEO",
    url: "/hero-videos/gallery/1785126440024-m3UVJ6vWVRN8jlkgweZGGWMAMXFDib.mp4",
    mobileUrl: "/hero-videos/gallery/gallery-mobile-3x4.mp4",
    altText: "GALLERY hero video",
    sortOrder: 0,
    active: true,
    createdAt: new Date("2026-07-29T13:33:15.763Z"),
  },
  {
    id: "cms64kodk0000wxa0vrbees2z",
    scope: "HOME",
    mediaType: "VIDEO",
    url: "/hero-videos/home/1785120325358-Z4L71B1n9VMpQ3D19gsV30YsmajVzJ.mp4",
    mobileUrl: "/hero-videos/home/home-mobile-3x4.mp4",
    altText: "HOME hero video",
    sortOrder: 0,
    active: false,
    createdAt: new Date("2026-07-29T13:33:15.752Z"),
  },
  {
    id: "cms67gt9p0000ortvwf6fvjc2",
    scope: "HOME",
    mediaType: "VIDEO",
    url: "/hero-videos/home/home-desktop.mp4",
    mobileUrl: "/hero-videos/home/home-mobile.mp4",
    altText: "Blue Jays Shop hero \u2014 official team store, CN Tower skyline",
    sortOrder: 0,
    active: true,
    createdAt: new Date("2026-07-29T14:54:14.318Z"),
  },
  {
    id: "cms6b4psn0001137ijpao03st",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "https://pub-3d3bdd757883440d8a771904dea90451.r2.dev/hero-slides/home/q5TUe0jTAveT.webp",
    altText: "",
    sortOrder: 2,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.65Z"),
  },
  {
    id: "cms6bd7gi00085a39v44kc83u",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "https://pub-3d3bdd757883440d8a771904dea90451.r2.dev/hero-slides/home/NJED_zP6qmpH.webp",
    altText: "",
    sortOrder: 3,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.668Z"),
  },
  {
    id: "cms6bbbsa00025a39fes2k5wa",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "https://pub-3d3bdd757883440d8a771904dea90451.r2.dev/hero-slides/home/w2TzpHnKDg8P.webp",
    altText: "",
    sortOrder: 4,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.669Z"),
  },
  {
    id: "cms6bd0z200075a39zt8ctbsj",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "https://pub-3d3bdd757883440d8a771904dea90451.r2.dev/hero-slides/home/1_rANQl0FF-H.webp",
    altText: "",
    sortOrder: 5,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.67Z"),
  },
  {
    id: "cmrwo8mar0001rtvx62chyse6",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "/uploads/hero-slides/home/844S-w7KoKLd.webp",
    altText: "",
    sortOrder: 6,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.672Z"),
  },
  {
    id: "cmrvwbjov003110qqbm43l7gl",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=1600&q=80",
    altText: "",
    sortOrder: 7,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.673Z"),
  },
  {
    id: "cmrw8lasj0003136k4ems6dpi",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "/uploads/hero-slides/home/Ilwwio9b6RcG.webp",
    altText: "",
    sortOrder: 8,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.674Z"),
  },
  {
    id: "cmrw6hzcw0009gxjkloi9fg60",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "/uploads/hero-slides/home/JHo3WIGNtRsC.webp",
    altText: "",
    sortOrder: 9,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.675Z"),
  },
  {
    id: "cmrw6tn5f0000dppmd9ef3bvf",
    scope: "HOME",
    mediaType: "IMAGE",
    url: "/uploads/hero-slides/home/f9HVdvLAMT4P.webp",
    altText: "",
    sortOrder: 10,
    active: true,
    createdAt: new Date("2026-10-04T19:49:03.676Z"),
  },
  {
    id: "cms64kodv0004wxa0jdvhzvu8",
    scope: "PLAYERS",
    mediaType: "VIDEO",
    url: "/hero-videos/players/1785125356138-eRgHFuYv6k8OwPtcnyohlrLCZp6Isy.mp4",
    mobileUrl: "/hero-videos/players/players-mobile-3x4.mp4",
    altText: "PLAYERS hero video",
    sortOrder: 0,
    active: true,
    createdAt: new Date("2026-07-29T13:33:15.763Z"),
  },
  {
    id: "cms64kods0001wxa04xaz5p54",
    scope: "SHOP",
    mediaType: "VIDEO",
    url: "/hero-videos/shop/1785120353721-zlrtIFICrW43d3uMFI01jNFhuEgdgy.mp4",
    mobileUrl: "/hero-videos/shop/shop-mobile-3x4.mp4",
    altText: "SHOP hero video",
    sortOrder: 0,
    active: true,
    createdAt: new Date("2026-07-29T13:33:15.761Z"),
  },
  {
    id: "cms64kodt0002wxa0sa098aad",
    scope: "STYLE_LANDING",
    mediaType: "VIDEO",
    url: "/hero-videos/style_landing/1785125332178-Ewn7pLopM07nP3H03hTlmftl2NsivS.mp4",
    mobileUrl: "/hero-videos/style_landing/style_landing-mobile-3x4.mp4",
    altText: "STYLE_LANDING hero video",
    sortOrder: 0,
    active: true,
    createdAt: new Date("2026-07-29T13:33:15.762Z"),
  },
  {
    id: "cmuu435lo000yymkgzmc5frbv",
    scope: "STYLE_LANDING",
    mediaType: "IMAGE",
    url: "/uploads/hero-slides/style_landing/EAo66Hs0mzAL.webp",
    altText: "",
    sortOrder: 1,
    active: true,
    createdAt: new Date("2026-10-04T17:45:31.165Z"),
  },
] as const

const ADMINS: { id: string; email: string; role: AdminRole; tenantId: string }[] = [
  {
    id: "cms7k476v000110wid5bzlggl",
    email: "admin@jays.shop",
    role: "OWNER",
    tenantId: "cms64ma4z000054r0zc5h4m8y",
  },
  {
    id: "cms7k7gnt0001zy1nf0pvclmw",
    email: "staff@jays.shop",
    role: "STAFF",
    tenantId: "cms64ma4z000054r0zc5h4m8y",
  },
]

// ---------------------------------------------------------------------------
// Seed routines — every write is an upsert so the seed is idempotent
// ---------------------------------------------------------------------------

async function seedTenant() {
  const { id, ...data } = TENANT
  await prisma.tenant.upsert({
    where: { slug: TENANT.slug },
    create: { id, ...data },
    update: data,
  })
  console.log(`Tenant: ${TENANT.name} (${TENANT.slug})`)
}

async function seedSettings() {
  const { id: hsId, ...hs } = HOLD_SETTINGS
  await prisma.holdSettings.upsert({
    where: { id: hsId },
    create: { id: hsId, ...hs },
    update: hs,
  })
  const { id: ssId, ...ss } = SLACK_SETTINGS
  await prisma.slackSettings.upsert({
    where: { id: ssId },
    create: { id: ssId, ...ss },
    update: ss,
  })
  console.log('HoldSettings + SlackSettings seeded')
}

async function seedStoreLocations() {
  for (const loc of STORE_LOCATIONS) {
    const { id, code, ...data } = loc
    await prisma.storeLocation.upsert({
      where: { code },
      create: { id, code, ...data },
      update: data,
    })
  }
  console.log(`StoreLocations: ${STORE_LOCATIONS.length}`)
}

async function seedStyleCategories() {
  for (const cat of STYLE_CATEGORIES) {
    const { id, slug, ...data } = cat
    await prisma.styleCategory.upsert({
      where: { slug },
      create: { id, slug, ...data },
      update: data,
    })
  }
  console.log(`StyleCategories: ${STYLE_CATEGORIES.length}`)
}

async function seedProducts() {
  for (const p of PRODUCTS) {
    const { id, slug, ...data } = p
    await prisma.product.upsert({
      where: { slug },
      create: { id, slug, ...data },
      update: data,
    })
  }
  console.log(`Products: ${PRODUCTS.length}`)
}

async function seedSizeInventories() {
  for (const row of SIZE_INVENTORIES) {
    const { id, productId, size, locationId, ...data } = row
    await prisma.sizeInventory.upsert({
      where: { productId_size_locationId: { productId, size, locationId } },
      create: { id, productId, size, locationId, ...data },
      update: data,
    })
  }
  console.log(`SizeInventories: ${SIZE_INVENTORIES.length}`)
}

async function seedHeroSlides() {
  for (const s of HERO_SLIDES) {
    const { id, ...data } = s
    await prisma.heroSlide.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    })
  }
  console.log(`HeroSlides: ${HERO_SLIDES.length}`)
}

async function seedAdmins() {
  const missing = []
  for (const a of ADMINS) {
    const existing = await prisma.admin.findUnique({ where: { email: a.email } })
    if (existing) {
      console.log(`Admin already exists: ${a.email} (skipped)`)
    } else {
      missing.push(a)
    }
  }
  if (missing.length === 0) return

  if (!SEED_ADMIN_PASSWORD) {
    throw new Error(
      'SEED_ADMIN_PASSWORD env var is required to create admin accounts.\n' +
        'Usage: SEED_ADMIN_PASSWORD=your-local-password npx prisma db seed'
    )
  }
  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12)
  for (const a of missing) {
    await prisma.admin.create({ data: { ...a, passwordHash } })
    console.log(`Admin created: ${a.email} (${a.role})`)
  }
}

async function main() {
  console.log('Seeding Jays Shop demo data...')
  await seedTenant()
  await seedSettings()
  await seedStoreLocations()
  await seedStyleCategories()
  await seedProducts()
  await seedSizeInventories()
  await seedHeroSlides()
  await seedAdmins()
  console.log('\nSeed complete!')
  console.log('---------------------------------')
  console.log('Admin login:  admin@jays.shop (OWNER)')
  console.log('Staff login:  staff@jays.shop (STAFF)')
  console.log('Password:     (set via SEED_ADMIN_PASSWORD)')
  console.log('---------------------------------')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
