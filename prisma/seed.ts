import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function at(hoursFromNow: number, minutes = 0) {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow, minutes, 0, 0);
  return d;
}
function today(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}
function daysFromNow(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  // Idempotent: ensure the agent + settings exist, then top up demo data using
  // natural keys so re-running adds new records without duplicating or wiping.
  const email = process.env.SEED_AGENT_EMAIL || "garethdeansomers@gmail.com";

  const agent = await prisma.agent.upsert({
    where: { email },
    update: {},
    create: {
      name: process.env.SEED_AGENT_NAME || "Sarah Al Mansoori",
      email,
      phone: "+971501234567",
    },
  });
  const agentId = agent.id;

  await prisma.settings.upsert({
    where: { agentId },
    update: {},
    create: {
      agentId,
      whatsappBusinessNumber: "+971501234567",
      aiTone: "professional, warm, and concise",
      aiApprovalMode: "require_approval",
      quietHoursStart: "21:00",
      quietHoursEnd: "08:00",
      quietHoursDays: [5],
      quietHoursMessage:
        "Thank you for your message. I've received your enquiry and will respond as soon as possible.",
      brokerNumber: "BRN-12345",
      whatsappTemplates: [
        {
          id: crypto.randomUUID(),
          name: "Sale outreach",
          body: "Hello, I'm a real estate agent representing a buyer who is ready to purchase in your building. If you'd consider selling your unit, I can bring a serious, pre-qualified client. Would you be open to discussing it?",
        },
        {
          id: crypto.randomUUID(),
          name: "Rental outreach",
          body: "Hello, I'm a real estate agent with a qualified tenant actively looking to rent in your building. If you'd consider letting your unit, I'd be glad to arrange a viewing with a serious, pre-vetted client. Would that work?",
        },
      ],
    },
  });

  // Default login account (scrypt-hashed) so per-user auth works out of the box.
  // Idempotent: an existing user keeps its password.
  const seedPassword = (process.env.APP_PASSWORD || "klientflo").trim();
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = `scrypt:${salt}:${crypto
    .scryptSync(seedPassword, salt, 64)
    .toString("hex")}`;
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: {
      agentId,
      email: email.toLowerCase(),
      name: agent.name,
      passwordHash,
    },
  });

  // --- idempotent helpers ------------------------------------------------
  type Obj = Record<string, unknown>;
  const ensureProperty = async (data: Obj) =>
    (await prisma.property.findFirst({
      where: { agentId, listingId: data.listingId as string },
    })) ?? prisma.property.create({ data: { agentId, ...data } as never });

  const ensureClient = (data: { phone: string } & Obj) =>
    prisma.contact.upsert({
      where: { agentId_phone: { agentId, phone: data.phone } },
      update: {},
      create: { agentId, ...data } as never,
    });

  const ensureConversation = async ({
    messages,
    ...data
  }: { contactPhone: string; messages?: Obj[] } & Obj) => {
    const existing = await prisma.conversation.findUnique({
      where: { agentId_contactPhone: { agentId, contactPhone: data.contactPhone } },
    });
    if (existing) return existing;
    return prisma.conversation.create({
      data: {
        agentId,
        ...data,
        messages: messages
          ? { create: messages.map((m) => ({ agentId, ...m })) }
          : undefined,
      } as never,
    });
  };

  const ensureDeal = async (data: { clientId: string; type: string } & Obj) =>
    (await prisma.deal.findFirst({
      where: { agentId, clientId: data.clientId, type: data.type as never },
    })) ?? prisma.deal.create({ data: { agentId, ...data } as never });

  const ensureEvent = async (data: { title: string } & Obj) =>
    (await prisma.event.findFirst({ where: { agentId, title: data.title } })) ??
    prisma.event.create({ data: { agentId, ...data } as never });

  const ensureDocument = async (data: { name: string } & Obj) =>
    (await prisma.document.findFirst({ where: { agentId, name: data.name } })) ??
    prisma.document.create({ data: { agentId, ...data } as never });

  const ensureAction = async (data: { label: string } & Obj) =>
    (await prisma.suggestedAction.findFirst({
      where: { agentId, label: data.label },
    })) ?? prisma.suggestedAction.create({ data: { agentId, ...data } as never });

  const ensureOwner = async (data: { name: string; phone?: string } & Obj) =>
    (await prisma.owner.findFirst({
      where: {
        agentId,
        name: data.name,
        ...(data.phone ? { phone: data.phone as string } : {}),
      },
    })) ??
    prisma.owner.create({ data: { agentId, source: "import", ...data } as never });

  const ensureTemplate = async (data: { name: string } & Obj) =>
    (await prisma.template.findFirst({ where: { agentId, name: data.name } })) ??
    prisma.template.create({ data: { agentId, ...data } as never });

  const ensureMedia = async (data: { name: string; type: string } & Obj) =>
    (await prisma.mediaAsset.findFirst({
      where: { agentId, name: data.name, type: data.type as string },
    })) ?? prisma.mediaAsset.create({ data: { agentId, ...data } as never });

  // --- Properties --------------------------------------------------------
  const marina = await ensureProperty({
    listingId: "PF-1001",
    title: "Stunning 2BR with full Marina views",
    price: 1_950_000,
    bedrooms: 2, bathrooms: 2, sizeSqft: 1180,
    propertyType: "Apartment", area: "Dubai Marina", community: "Marina Gate",
    description: "Bright, fully upgraded 2-bedroom with floor-to-ceiling windows and full marina views. Ready to move in.",
    images: ["/seed/marina-1.jpg", "/seed/marina-2.jpg"],
    floorPlans: ["/seed/marina-floorplan.pdf"], brochureUrl: "/seed/marina-brochure.pdf",
    paymentPlan: "Cash or mortgage. 60/40 available on selected units.",
    listingUrl: "https://www.propertyfinder.ae/en/plp/buy/pf-1001",
    permitNumber: "DLD-7788", source: "property_finder", status: "active",
  });
  const downtown = await ensureProperty({
    listingId: "BY-2002",
    title: "Cosy 1BR in the heart of Downtown",
    price: 115_000, bedrooms: 1, bathrooms: 1, sizeSqft: 720,
    propertyType: "Apartment", area: "Downtown Dubai", community: "Burj Views",
    description: "Well-maintained 1-bedroom with Burj Khalifa glimpses, walking distance to Dubai Mall.",
    images: ["/seed/downtown-1.jpg"], floorPlans: [],
    listingUrl: "https://www.bayut.com/property/details-2002.html",
    permitNumber: "DLD-5566", source: "bayut", status: "active",
  });
  const palm = await ensureProperty({
    listingId: "PF-3003", title: "Signature 3BR villa on Palm Jumeirah",
    price: 8_500_000, bedrooms: 3, bathrooms: 4, sizeSqft: 3400,
    propertyType: "Villa", area: "Palm Jumeirah", community: "Garden Homes",
    description: "Beachfront living with private garden and direct beach access.",
    images: ["/seed/palm-1.jpg"], floorPlans: [], source: "property_finder", status: "active",
  });
  await ensureProperty({
    listingId: "BY-4004", title: "Spacious 2BR in JVC — great value",
    price: 88_000, bedrooms: 2, bathrooms: 2, sizeSqft: 1100,
    propertyType: "Apartment", area: "Jumeirah Village Circle", community: "Belgravia",
    images: [], source: "bayut", status: "expired", expiresAt: daysFromNow(-3),
  });
  const jlt = await ensureProperty({
    listingId: "PF-5005", title: "Investor studio in JLT with lake views",
    price: 650_000, bedrooms: 0, bathrooms: 1, sizeSqft: 480,
    propertyType: "Apartment", area: "Jumeirah Lake Towers", community: "Lake Terrace",
    description: "High-floor studio, strong rental yield, fully furnished.",
    images: [], source: "property_finder", status: "active", listingUrl: "https://www.propertyfinder.ae/en/plp/buy/pf-5005",
  });
  const bizbay = await ensureProperty({
    listingId: "PF-6006", title: "Modern 1BR in Business Bay with canal view",
    price: 1_250_000, bedrooms: 1, bathrooms: 2, sizeSqft: 820,
    propertyType: "Apartment", area: "Business Bay", community: "Executive Towers",
    description: "Bright 1-bedroom with canal views, close to the metro and DIFC.",
    images: [], source: "property_finder", status: "active",
  });
  const marina1 = await ensureProperty({
    listingId: "BY-7007", title: "Furnished 1BR in Dubai Marina",
    price: 105_000, bedrooms: 1, bathrooms: 1, sizeSqft: 750,
    propertyType: "Apartment", area: "Dubai Marina", community: "Marina Diamonds",
    images: [], source: "bayut", status: "active",
  });
  const downtown2 = await ensureProperty({
    listingId: "PF-8008", title: "Premium 2BR in Downtown with Burj views",
    price: 2_800_000, bedrooms: 2, bathrooms: 3, sizeSqft: 1400,
    propertyType: "Apartment", area: "Downtown Dubai", community: "The Address",
    images: [], source: "property_finder", status: "active",
  });

  // --- Clients -----------------------------------------------------------
  const ahmed = await ensureClient({
    name: "Ahmed Khan", phone: "+971521112233", email: "ahmed.khan@example.com",
    nationality: "Pakistani", clientType: "buyer", budgetMin: 1_700_000, budgetMax: 2_000_000,
    area: "Dubai Marina", bedrooms: 2, propertyType: "Apartment", paymentMethod: "cash",
    timeline: "This month", status: "Hot lead", nextAction: "Send Marina listings and offer viewing slots",
  });
  const priya = await ensureClient({
    name: "Priya Sharma", phone: "+971522223344", email: "priya.s@example.com",
    nationality: "Indian", clientType: "tenant", budgetMin: 100_000, budgetMax: 120_000,
    area: "Downtown Dubai", bedrooms: 1, propertyType: "Apartment", timeline: "Next 2 weeks",
    status: "Qualified", nextAction: "Confirm viewing for Downtown 1BR",
  });
  const james = await ensureClient({
    name: "James Wilson", phone: "+971523334455", email: "j.wilson@example.com",
    nationality: "British", clientType: "buyer", budgetMin: 7_500_000, budgetMax: 9_000_000,
    area: "Palm Jumeirah", bedrooms: 3, propertyType: "Villa", paymentMethod: "mortgage",
    timeline: "Next quarter", status: "Viewing completed", nextAction: "Follow up on offer decision",
  });
  const fatima = await ensureClient({
    name: "Fatima Al Sayed", phone: "+971524445566", nationality: "Emirati",
    clientType: "landlord", status: "Existing client", notes: "Owns 2 units in JVC, looking for tenants.",
  });
  const chen = await ensureClient({
    name: "Chen Wei", phone: "+971525556611", email: "chen.wei@example.com",
    nationality: "Chinese", clientType: "tenant", budgetMin: 80_000, budgetMax: 95_000,
    area: "Jumeirah Village Circle", bedrooms: 2, propertyType: "Apartment",
    timeline: "This week", status: "Hot lead", nextAction: "Arrange JVC viewing this weekend",
  });
  const olga = await ensureClient({
    name: "Olga Petrova", phone: "+971526667722", email: "olga.p@example.com",
    nationality: "Russian", clientType: "buyer", budgetMin: 600_000, budgetMax: 700_000,
    area: "Jumeirah Lake Towers", bedrooms: 0, propertyType: "Apartment", paymentMethod: "cash",
    timeline: "This month", status: "New enquiry", nextAction: "Send JLT studio options",
  });
  const mohammed = await ensureClient({
    name: "Mohammed Hassan", phone: "+971527778833", email: "m.hassan@example.com",
    nationality: "Egyptian", clientType: "buyer", budgetMin: 1_100_000, budgetMax: 1_400_000,
    area: "Business Bay", bedrooms: 1, propertyType: "Apartment", paymentMethod: "mortgage",
    timeline: "Next quarter", status: "Negotiating", nextAction: "Respond to price query on Business Bay 1BR",
  });
  const sophie = await ensureClient({
    name: "Sophie Martin", phone: "+971528889944", email: "sophie.m@example.com",
    nationality: "French", clientType: "tenant", budgetMin: 90_000, budgetMax: 110_000,
    area: "Dubai Marina", bedrooms: 1, propertyType: "Apartment", timeline: "Next month",
    status: "Offer accepted", nextAction: "Collect documents for tenancy contract",
  });
  const raj = await ensureClient({
    name: "Raj Patel", phone: "+971529990055", email: "raj.patel@example.com",
    nationality: "Indian", clientType: "buyer", budgetMin: 2_500_000, budgetMax: 3_000_000,
    area: "Downtown Dubai", bedrooms: 2, propertyType: "Apartment", paymentMethod: "cash",
    timeline: "This month", status: "Hot lead", nextAction: "Send Downtown 2BR comparison",
  });

  // --- Conversations -----------------------------------------------------
  const convAhmed = await ensureConversation({
    clientId: ahmed.id, contactPhone: ahmed.phone, contactName: ahmed.name,
    classification: "viewing_request", urgency: 5, awaitingReply: true, lastMessageAt: at(-1),
    summary: "Cash buyer wants a 2BR in Dubai Marina under AED 2M, ready to view this weekend.",
    messages: [
      { direction: "inbound", type: "text", body: "Hi Sarah, I'm looking for a 2 bedroom in Dubai Marina, budget up to 2 million, cash. Can we view this weekend?", createdAt: at(-2) },
      { direction: "inbound", type: "voice", mediaUrl: "/seed/voice-ahmed.ogg", reviewed: false, createdAt: at(-1),
        transcription: "Also if there's anything with a marina view that would be perfect, and I can move quickly as it's a cash purchase." },
    ],
  });
  await ensureConversation({
    clientId: priya.id, contactPhone: priya.phone, contactName: priya.name,
    classification: "hot_lead", urgency: 4, awaitingReply: true, lastMessageAt: at(-5),
    summary: "Tenant keen on Downtown 1BR around AED 120k, wants a viewing.",
    messages: [{ direction: "inbound", type: "text", body: "Is the Downtown 1 bedroom still available? When can I see it?", createdAt: at(-5) }],
  });
  await ensureConversation({
    clientId: james.id, contactPhone: james.phone, contactName: james.name,
    classification: "contract_stage", urgency: 3, awaitingReply: false, lastMessageAt: at(-26),
    summary: "Considering an offer on the Palm villa; mortgage pre-approved.",
    messages: [
      { direction: "inbound", type: "text", body: "Thanks for the viewing. Let me discuss with my wife and revert.", createdAt: at(-27) },
      { direction: "outbound", type: "text", body: "Of course, James. Take your time — I'll hold the unit info for you.", createdAt: at(-26) },
    ],
  });
  await ensureConversation({
    contactPhone: "+971525556677", contactName: "+971 52 555 6677",
    classification: "new_enquiry", urgency: 4, awaitingReply: true, lastMessageAt: at(-3),
    summary: "New enquiry about studios in JLT for investment.",
    messages: [{ direction: "inbound", type: "text", body: "Hello, do you have any studios in JLT for investment? Budget around 650k.", createdAt: at(-3) }],
  });
  await ensureConversation({
    clientId: chen.id, contactPhone: chen.phone, contactName: chen.name,
    classification: "viewing_request", urgency: 5, awaitingReply: true, lastMessageAt: at(-1),
    summary: "Tenant wants to view a 2BR in JVC this weekend, budget ~90k.",
    messages: [{ direction: "inbound", type: "text", body: "Hi! Can I see the JVC 2 bedroom on Saturday? Looking to move in soon.", createdAt: at(-1) }],
  });
  await ensureConversation({
    clientId: mohammed.id, contactPhone: mohammed.phone, contactName: mohammed.name,
    classification: "price_negotiation", urgency: 4, awaitingReply: true, lastMessageAt: at(-7),
    summary: "Buyer asking whether the Business Bay 1BR price is negotiable.",
    messages: [{ direction: "inbound", type: "text", body: "Is there any flexibility on the Business Bay apartment price? Can do mortgage.", createdAt: at(-7) }],
  });
  await ensureConversation({
    clientId: sophie.id, contactPhone: sophie.phone, contactName: sophie.name,
    classification: "document_request", urgency: 3, awaitingReply: true, lastMessageAt: at(-9),
    summary: "Tenant ready to proceed on Marina 1BR; needs the documents list.",
    messages: [{ direction: "inbound", type: "text", body: "Great, I'd like to go ahead with the Marina apartment. What documents do you need from me?", createdAt: at(-9) }],
  });
  await ensureConversation({
    contactPhone: "+971500001234", contactName: "Unknown",
    classification: "spam", urgency: 1, awaitingReply: false, lastMessageAt: at(-30),
    summary: "Promotional spam — low priority.",
    messages: [{ direction: "inbound", type: "text", body: "🎉 Congratulations! You have won a free crypto giveaway, click here to claim.", createdAt: at(-30) }],
  });

  // --- Deals -------------------------------------------------------------
  await ensureDeal({ type: "sale", stage: "viewing_booked", clientId: ahmed.id, propertyId: marina.id, amount: 1_950_000, notes: "Cash buyer, ready to move fast." });
  await ensureDeal({ type: "sale", stage: "offer_submitted", clientId: james.id, propertyId: palm.id, amount: 8_300_000, notes: "Offer submitted, awaiting seller response." });
  await ensureDeal({ type: "sale", stage: "new_enquiry", clientId: olga.id, propertyId: jlt.id, amount: 650_000 });
  await ensureDeal({ type: "sale", stage: "qualified", clientId: mohammed.id, propertyId: bizbay.id, amount: 1_250_000 });
  await ensureDeal({ type: "sale", stage: "properties_sent", clientId: raj.id, propertyId: downtown2.id, amount: 2_800_000 });
  await ensureDeal({ type: "rental", stage: "documents_requested", clientId: priya.id, propertyId: downtown.id, amount: 115_000, notes: "Need passport + visa copies to prepare Ejari." });
  await ensureDeal({ type: "rental", stage: "viewing_completed", clientId: chen.id, amount: 88_000 });
  await ensureDeal({ type: "rental", stage: "offer_accepted", clientId: sophie.id, propertyId: marina1.id, amount: 105_000 });

  // --- Events ------------------------------------------------------------
  await ensureEvent({ type: "viewing", title: "Marina 2BR viewing — Ahmed Khan", startsAt: today(16, 0), endsAt: today(16, 30), location: "Marina Gate, Dubai Marina", clientId: ahmed.id, propertyId: marina.id });
  await ensureEvent({ type: "office_meeting", title: "Listing agreement — Fatima Al Sayed", startsAt: today(11, 0), endsAt: today(12, 0), location: "Office", clientId: fatima.id });
  await ensureEvent({ type: "viewing", title: "JVC 2BR viewing — Chen Wei", startsAt: today(14, 0), endsAt: today(14, 30), location: "Belgravia, JVC", clientId: chen.id });
  await ensureEvent({ type: "trustee_office_meeting", title: "Transfer — Palm villa", startsAt: daysFromNow(2, 10), endsAt: daysFromNow(2, 11), location: "DLD Trustee Office", clientId: james.id, propertyId: palm.id });
  await ensureEvent({ type: "viewing", title: "Business Bay 1BR viewing — Mohammed Hassan", startsAt: daysFromNow(1, 15), endsAt: daysFromNow(1, 16), location: "Executive Towers", clientId: mohammed.id, propertyId: bizbay.id });
  await ensureEvent({ type: "contract_signing", title: "Tenancy signing — Sophie Martin", startsAt: daysFromNow(3, 12), endsAt: daysFromNow(3, 13), location: "Office", clientId: sophie.id, propertyId: marina1.id });
  await ensureEvent({ type: "follow_up", title: "Follow up — Raj Patel (Downtown 2BR)", startsAt: daysFromNow(1, 9), endsAt: daysFromNow(1, 9, ), clientId: raj.id });

  // --- Documents ---------------------------------------------------------
  await ensureDocument({ category: "client", type: "passport", name: "James Wilson — Passport", fileUrl: "/seed/james-passport.pdf", expiresAt: daysFromNow(20), clientId: james.id });
  await ensureDocument({ category: "property", type: "title_deed", name: "Palm Villa — Title Deed", fileUrl: "/seed/palm-title-deed.pdf", propertyId: palm.id });
  await ensureDocument({ category: "client", type: "emirates_id", name: "Sophie Martin — Emirates ID", fileUrl: "/seed/sophie-eid.pdf", expiresAt: daysFromNow(15), clientId: sophie.id });
  await ensureDocument({ category: "transaction", type: "form_f", name: "Form F — Palm villa (James Wilson)", fileUrl: "/seed/form-f-palm.pdf", clientId: james.id });

  // --- Suggested actions -------------------------------------------------
  await ensureAction({ type: "send_brochure", label: "Send Ahmed the Marina 2BR info pack", reason: "He asked to view this weekend and matches this listing 92%.", clientId: ahmed.id, conversationId: convAhmed.id });
  await ensureAction({ type: "book_viewing", label: "Offer Priya viewing slots for the Downtown 1BR", reason: "She asked when she can see it and is awaiting a reply.", clientId: priya.id });
  await ensureAction({ type: "request_passport", label: "Request passport & visa from Priya", reason: "Needed to prepare Ejari for the rental deal.", clientId: priya.id });
  await ensureAction({ type: "follow_up", label: "Follow up with James on the Palm offer", reason: "Offer submitted 27h ago with no response yet.", clientId: james.id });
  await ensureAction({ type: "send_brochure", label: "Send Raj the Downtown 2BR comparison", reason: "Hot cash buyer matching the Downtown 2BR.", clientId: raj.id });
  await ensureAction({ type: "book_viewing", label: "Confirm Chen's JVC viewing for Saturday", reason: "Hot tenant lead awaiting confirmation.", clientId: chen.id });

  // --- Agents & investors (tagged contacts) ------------------------------
  await ensureClient({
    name: "Khalid Rahman", phone: "+971551112200", email: "khalid@betterhomes.example",
    category: "agent", agencyName: "Better Homes", area: "Dubai Marina",
    notes: "Co-broke partner — shares Marina & JLT stock.",
  });
  await ensureClient({
    name: "Lena Fischer", phone: "+971551113300", email: "lena@allsopp.example",
    category: "agent", agencyName: "Allsopp & Allsopp", area: "Downtown Dubai",
    notes: "Good for Downtown & Business Bay listings.",
  });
  await ensureClient({
    name: "Daniel Roberts", phone: "+971552224400", email: "d.roberts@example.com",
    category: "investor", nationality: "British", area: "Business Bay",
    budgetMin: 800_000, budgetMax: 1_500_000, propertyType: "Apartment",
    notes: "ROI-focused; off-plan and high-yield studios. Target 7%+ gross.",
  });
  await ensureClient({
    name: "Aisha Noor", phone: "+971552225500", email: "aisha.noor@example.com",
    category: "investor", nationality: "Emirati", area: "Jumeirah Lake Towers",
    budgetMin: 500_000, budgetMax: 900_000, propertyType: "Apartment",
    notes: "Building a rental portfolio in JLT & JVC.",
  });

  // --- Owners database ---------------------------------------------------
  const owners = [
    { name: "Yusuf Demir", phone: "+971561110001", email: "yusuf.d@example.com", area: "Dubai Marina", building: "Marina Gate", unit: "1204", notes: "Open to selling at the right price." },
    { name: "Maria Santos", phone: "+971561110002", area: "Dubai Marina", building: "Marina Gate", unit: "2810" },
    { name: "Arjun Mehta", phone: "+971561110003", email: "arjun.m@example.com", area: "Downtown Dubai", building: "The Address", unit: "508", notes: "Considering rental." },
    { name: "Sara Khalifa", phone: "+971561110004", area: "Downtown Dubai", building: "Burj Views", unit: "1102" },
    { name: "Tom Becker", phone: "+971561110005", area: "Business Bay", building: "Executive Towers", unit: "B-2207" },
    { name: "Ananya Rao", phone: "+971561110006", email: "ananya.r@example.com", area: "Jumeirah Lake Towers", building: "Lake Terrace", unit: "3304", notes: "Owns two units." },
    { name: "Omar Farouk", phone: "+971561110007", area: "Jumeirah Lake Towers", building: "Lake Terrace", unit: "1809" },
    { name: "Helen Park", phone: "+971561110008", area: "Palm Jumeirah", building: "Garden Homes", unit: "Frond M-12" },
    { name: "Viktor Ivanov", phone: "+971561110009", area: "Business Bay", building: "Executive Towers", unit: "M-1503", notes: "Cash buyer for more units too." },
    { name: "Grace Mwangi", phone: "+971561110010", area: "Jumeirah Village Circle", building: "Belgravia", unit: "504" },
  ];
  for (const o of owners) await ensureOwner(o);

  // --- Storage: a brochure template + media ------------------------------
  await ensureTemplate({
    name: "Standard property brochure",
    kind: "brochure",
    body:
      "Presenting {{property.title}} in {{property.area}}.\n\n" +
      "Priced at {{property.price}} — {{property.bedrooms}} bed, {{property.bathrooms}} bath, {{property.size}}.\n\n" +
      "{{property.description}}\n\n" +
      "For viewings contact {{agent.name}} on {{agent.phone}}.",
  });
  await ensureTemplate({
    name: "New listing alert",
    kind: "custom",
    body:
      "New to market: {{property.title}} ({{property.area}}).\n" +
      "{{property.bedrooms}}-bed at {{property.price}}. Interested? Reply and I'll send full details. — {{agent.name}}",
  });
  await ensureMedia({
    type: "floorplan", name: "Marina Gate 2BR — floorplan",
    externalUrl: "https://example.com/floorplans/marina-gate-2br.pdf",
    propertyId: marina.id,
  });
  await ensureMedia({
    type: "video", name: "Marina 2BR — walkthrough",
    externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    propertyId: marina.id,
  });
  await ensureMedia({
    type: "video", name: "Palm villa — cinematic tour",
    externalUrl: "https://vimeo.com/76979871",
    propertyId: palm.id,
  });

  console.log(`Seeded/updated demo data for ${agent.email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
