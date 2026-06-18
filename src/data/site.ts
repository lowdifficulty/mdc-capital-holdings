export interface PortfolioCompany {
  id: string;
  name: string;
  website: string;
  category: string;
  industry: string;
  shortDescription: string;
  gridDescription: string;
  longDescription: string;
  keyFocusAreas: string[];
  accentColor: string;
}

export const portfolioCompanies: PortfolioCompany[] = [
  {
    id: "smb-health-supply",
    name: "SMB Health Supply",
    website: "https://smbhealthsupply.com/",
    category: "Healthcare Distribution",
    industry: "Healthcare Distribution / Advanced Wound Care",
    shortDescription:
      "SMB Health Supply is a medical supply company focused on advanced wound care products for healthcare professionals treating acute and chronic wounds.",
    gridDescription:
      "Advanced wound care supply solutions for healthcare professionals, including amniotic skin grafts, collagen dressings, and complementary wound care products.",
    longDescription:
      "SMB Health Supply distributes advanced wound care products including amniotic skin grafts, collagen dressings, and complementary wound care supplies. The company supports medical practices and healthcare organizations with dependable product access, responsive fulfillment, and long-term supply partnerships.",
    keyFocusAreas: [
      "Advanced wound care distribution",
      "Amniotic skin grafts",
      "Collagen dressings",
      "Provider supply relationships",
      "Fulfillment and operational reliability",
      "Healthcare compliance awareness",
    ],
    accentColor: "#1769FF",
  },
  {
    id: "mobile-dog-salon",
    name: "Mobile Dog Salon",
    website: "https://mobiledog-salon.com/",
    category: "Mobile Pet Services",
    industry: "Local Services / Mobile Pet Grooming",
    shortDescription:
      "Mobile Dog Salon is a mobile pet grooming company bringing professional grooming services directly to customers' driveways.",
    gridDescription:
      "A mobile pet grooming company delivering professional, one-on-one grooming services directly to customers across Orange County.",
    longDescription:
      "Mobile Dog Salon offers convenient, one-on-one mobile grooming for dogs and pets across Orange County. The business is built around comfort, convenience, safety, and a better customer experience for busy families, anxious pets, senior pet owners, and multi-pet households.",
    keyFocusAreas: [
      "Mobile dog grooming",
      "Pet bathing and washing",
      "Nail trimming",
      "Deshedding",
      "One-on-one curbside service",
      "Orange County local service expansion",
      "Groomer recruiting and van-based operations",
    ],
    accentColor: "#0EA5E9",
  },
  {
    id: "lowdif",
    name: "LOWDIF",
    website: "https://lowdif.com/",
    category: "Music Technology",
    industry: "Music Technology / Web3 / Streaming",
    shortDescription:
      "LOWDIF is a music streaming and token platform built around Proof of Listen.",
    gridDescription:
      "A music streaming and token platform exploring Proof of Listen, listener rewards, artist payments, and tokenized engagement.",
    longDescription:
      "LOWDIF is developing a music streaming experience where completed listens can mint LOWDIF tokens and split value between listeners and artists. The platform explores a new model for music participation, artist rewards, listener incentives, and advertiser-driven token utility.",
    keyFocusAreas: [
      "Music streaming",
      "Proof of Listen",
      "Artist rewards",
      "Listener incentives",
      "Tokenized music engagement",
      "Advertising and token burn mechanics",
      "Creator economy infrastructure",
    ],
    accentColor: "#6366F1",
  },
  {
    id: "rx-center",
    name: "RX Center",
    website: "https://rx.center/",
    category: "Digital Health",
    industry: "Digital Health / Online Care",
    shortDescription:
      "RX Center is a digital healthcare brand concept focused on simple online access to licensed-provider-led care.",
    gridDescription:
      "A digital healthcare brand concept focused on online access to licensed-provider-led care across modern wellness categories.",
    longDescription:
      "RX Center is positioned around online healthcare experiences for modern patients, including weight loss, peptides, men's health, women's health, and ongoing care management. The brand emphasizes convenience, online intake, provider review, transparent pricing, and care delivered around real life.",
    keyFocusAreas: [
      "Online healthcare",
      "Licensed-provider-led care",
      "Weight loss programs",
      "Men's health",
      "Women's health",
      "Peptides and longevity",
      "Patient portal experience",
      "Cash-pay healthcare model",
    ],
    accentColor: "#059669",
  },
];

export const whatWeDoCards = [
  {
    title: "Acquire",
    body: "We pursue small business acquisitions and majority ownership opportunities where our operating platform can create meaningful long-term value.",
  },
  {
    title: "Build",
    body: "We develop new companies from the ground up when we see a market gap, strong demand, and a clear path to scalable execution.",
  },
  {
    title: "Operate",
    body: "We provide hands-on support across strategy, marketing, technology, sales, hiring, systems, compliance, and growth operations.",
  },
  {
    title: "Scale",
    body: "We help businesses move from founder-dependent execution to repeatable systems, stronger teams, and measurable growth.",
  },
];

export const situations = [
  {
    quote: "I want to grow my company.",
    body: "MDC can support companies looking to expand into new markets, improve marketing, launch new products, strengthen operations, or build a more scalable sales engine.",
  },
  {
    quote: "I want an operating partner.",
    body: "Many small businesses do not need passive capital. They need hands-on execution. MDC brings operator-level involvement to help turn opportunity into measurable progress.",
  },
  {
    quote: "I want to transition out of the business.",
    body: "For owners considering succession, liquidity, or a gradual transition, MDC can provide continuity, operational support, and a long-term home for the company.",
  },
  {
    quote: "I want to build a new platform.",
    body: "MDC supports new business creation when there is a strong market need, a clear customer pain point, and a practical path to revenue.",
  },
  {
    quote: "I want better systems.",
    body: "We help companies improve the operational backbone: CRM, payments, reporting, lead flow, fulfillment, customer communication, automation, and analytics.",
  },
  {
    quote: "I want to use AI and technology.",
    body: "MDC helps operating businesses apply modern technology, AI tools, automation, and digital marketing without losing the human service layer that makes small businesses valuable.",
  },
];

export const operatingCapabilities = [
  {
    title: "Marketing & Demand Generation",
    body: "We build lead generation systems, paid media campaigns, local SEO, landing pages, creative assets, and customer acquisition funnels that turn attention into revenue.",
  },
  {
    title: "Sales & Customer Communication",
    body: "We improve call handling, SMS follow-up, CRM workflows, appointment booking, customer intake, and sales processes so fewer opportunities are missed.",
  },
  {
    title: "Technology & Automation",
    body: "We implement practical technology systems, AI tools, automations, dashboards, and internal workflows that reduce manual work and improve visibility.",
  },
  {
    title: "Operations & Fulfillment",
    body: "We help businesses tighten scheduling, fulfillment, staffing, inventory, routing, vendor coordination, reporting, and customer experience.",
  },
  {
    title: "Brand & Positioning",
    body: "We clarify the market message, strengthen trust, improve visual identity, and build brands that customers understand quickly.",
  },
  {
    title: "Finance & Reporting",
    body: "We help operators understand unit economics, cash flow, margins, customer acquisition cost, lifetime value, and growth priorities.",
  },
];

export const investmentThemes = [
  {
    title: "Healthcare Services & Distribution",
    body: "We look for healthcare businesses with real provider or patient demand, recurring operational needs, and opportunities to improve access, fulfillment, communication, and compliance-aware growth.",
  },
  {
    title: "Local Services",
    body: "Local service businesses can become highly valuable when they have strong customer demand, repeatable operations, reliable staffing, and modern customer acquisition systems.",
  },
  {
    title: "Digital Health",
    body: "We are interested in healthcare experiences that make care easier to access, easier to understand, and easier to manage through technology and licensed-provider-led models.",
  },
  {
    title: "Music, Media & Technology",
    body: "MDC supports digital platforms that rethink how creators, customers, and communities exchange value.",
  },
  {
    title: "AI-Enabled Operations",
    body: "We believe small businesses can benefit from AI and automation when it is applied practically: faster follow-up, cleaner workflows, better reporting, smarter routing, and improved customer experience.",
  },
];

export const whatWeLookFor = [
  "Real customer demand",
  "Clear revenue model",
  "Operational complexity we can improve",
  "Fragmented or underserved markets",
  "Founder-led or operator-led businesses",
  "Strong brand potential",
  "Technology or marketing upside",
  "Durable customer relationships",
  "Room for geographic or product expansion",
];

export const whatWeAvoid = [
  "Purely passive investments",
  "Businesses with no clear path to revenue",
  "Hype-driven opportunities without customer demand",
  "Situations where our operating platform cannot add value",
  "Short-term flips",
];

export const principles = [
  {
    title: "Long-term ownership",
    body: "We are not building around short-term exits. We want companies that can compound over years.",
  },
  {
    title: "Operator involvement",
    body: "We do not just advise from the sidelines. We help improve the actual systems that drive results.",
  },
  {
    title: "Practical technology",
    body: "We use technology, AI, and automation where they make the business simpler, faster, and stronger.",
  },
  {
    title: "Customer demand first",
    body: "We prefer real businesses with real customers over ideas that only work on paper.",
  },
  {
    title: "Brand matters",
    body: "Great small businesses deserve brands, websites, and customer experiences that match the quality of the service.",
  },
];

export const contactRoles = [
  "Business owner",
  "Founder",
  "Investor",
  "Operator",
  "Strategic partner",
  "Other",
];

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/strategy", label: "Strategy" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/operating-platform", label: "Operating Platform" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
