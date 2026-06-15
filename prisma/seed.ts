import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** A Date offset from now by the given hours (and optional minutes). */
function at(hoursFromNow: number, minutes = 0) {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow, minutes, 0, 0);
  return d;
}

/** A Date today at a fixed wall-clock time. */
function today(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  // Idempotent: ensure the agent + settings exist, then only create sample data
  // on a fresh database. Safe to run on every deploy/restart without wiping.
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
      quietHoursDays: [5], // Friday
      quietHoursMessage:
        "Thank you for your message. I've received your enquiry and will respond as soon as possible.",
      brokerNumber: "BRN-12345",
    },
  });

  // Already seeded? Leave existing data untouched.
  const existingClients = await prisma.client.count({ where: { agentId } });
  if (existingClients > 0) {
    console.log(`Agent ${agent.email} already set up — skipping sample data.`);
    return;
  }

  // --- Properties --------------------------------------------------------
  const marina = await prisma.property.create({
    data: {
      agentId,
      listingId: "PF-1001",
      title: "Stunning 2BR with full Marina views",
      price: 1_950_000,
      bedrooms: 2,
      bathrooms: 2,
      sizeSqft: 1180,
      propertyType: "Apartment",
      area: "Dubai Marina",
      community: "Marina Gate",
      description:
        "Bright, fully upgraded 2-bedroom apartment with floor-to-ceiling windows and full marina views. Ready to move in.",
      images: ["/seed/marina-1.jpg", "/seed/marina-2.jpg"],
      floorPlans: ["/seed/marina-floorplan.pdf"],
      brochureUrl: "/seed/marina-brochure.pdf",
      paymentPlan: "Cash or mortgage. 60/40 available on selected units.",
      listingUrl: "https://www.propertyfinder.ae/en/plp/buy/pf-1001",
      permitNumber: "DLD-7788",
      source: "property_finder",
      status: "active",
    },
  });

  const downtown = await prisma.property.create({
    data: {
      agentId,
      listingId: "BY-2002",
      title: "Cosy 1BR in the heart of Downtown",
      price: 115_000, // annual rent
      bedrooms: 1,
      bathrooms: 1,
      sizeSqft: 720,
      propertyType: "Apartment",
      area: "Downtown Dubai",
      community: "Burj Views",
      description:
        "Well-maintained 1-bedroom with Burj Khalifa glimpses, walking distance to Dubai Mall. Available now.",
      images: ["/seed/downtown-1.jpg"],
      floorPlans: [],
      listingUrl: "https://www.bayut.com/property/details-2002.html",
      permitNumber: "DLD-5566",
      source: "bayut",
      status: "active",
    },
  });

  const palm = await prisma.property.create({
    data: {
      agentId,
      listingId: "PF-3003",
      title: "Signature 3BR villa on Palm Jumeirah",
      price: 8_500_000,
      bedrooms: 3,
      bathrooms: 4,
      sizeSqft: 3400,
      propertyType: "Villa",
      area: "Palm Jumeirah",
      community: "Garden Homes",
      description:
        "Beachfront living with private garden and direct beach access.",
      images: ["/seed/palm-1.jpg"],
      floorPlans: [],
      source: "property_finder",
      status: "active",
    },
  });

  // An expired listing — exercises the "detect expired listings" flow later.
  await prisma.property.create({
    data: {
      agentId,
      listingId: "BY-4004",
      title: "Spacious 2BR in JVC — great value",
      price: 88_000, // annual rent
      bedrooms: 2,
      bathrooms: 2,
      sizeSqft: 1100,
      propertyType: "Apartment",
      area: "Jumeirah Village Circle",
      community: "Belgravia",
      images: [],
      source: "bayut",
      status: "expired",
      expiresAt: daysFromNow(-3),
    },
  });

  // --- Clients -----------------------------------------------------------
  const ahmed = await prisma.client.create({
    data: {
      agentId,
      name: "Ahmed Khan",
      phone: "+971521112233",
      email: "ahmed.khan@example.com",
      nationality: "Pakistani",
      clientType: "buyer",
      budgetMin: 1_700_000,
      budgetMax: 2_000_000,
      area: "Dubai Marina",
      bedrooms: 2,
      propertyType: "Apartment",
      paymentMethod: "cash",
      timeline: "This month",
      status: "Hot lead",
      nextAction: "Send Marina listings and offer viewing slots",
    },
  });

  const priya = await prisma.client.create({
    data: {
      agentId,
      name: "Priya Sharma",
      phone: "+971522223344",
      email: "priya.s@example.com",
      nationality: "Indian",
      clientType: "tenant",
      budgetMin: 100_000,
      budgetMax: 120_000,
      area: "Downtown Dubai",
      bedrooms: 1,
      propertyType: "Apartment",
      timeline: "Next 2 weeks",
      status: "Qualified",
      nextAction: "Confirm viewing for Downtown 1BR",
    },
  });

  const james = await prisma.client.create({
    data: {
      agentId,
      name: "James Wilson",
      phone: "+971523334455",
      email: "j.wilson@example.com",
      nationality: "British",
      clientType: "buyer",
      budgetMin: 7_500_000,
      budgetMax: 9_000_000,
      area: "Palm Jumeirah",
      bedrooms: 3,
      propertyType: "Villa",
      paymentMethod: "mortgage",
      timeline: "Next quarter",
      status: "Viewing completed",
      nextAction: "Follow up on offer decision",
    },
  });

  const fatima = await prisma.client.create({
    data: {
      agentId,
      name: "Fatima Al Sayed",
      phone: "+971524445566",
      nationality: "Emirati",
      clientType: "landlord",
      status: "Existing client",
      notes: "Owns 2 units in JVC, looking for tenants.",
    },
  });

  // --- Conversations & messages -----------------------------------------
  // Ahmed: HOT, urgent viewing request + voice note awaiting review.
  const convAhmed = await prisma.conversation.create({
    data: {
      agentId,
      clientId: ahmed.id,
      contactPhone: ahmed.phone,
      contactName: ahmed.name,
      classification: "viewing_request",
      urgency: 5,
      summary:
        "Cash buyer wants a 2BR in Dubai Marina under AED 2M, ready to view this weekend.",
      awaitingReply: true,
      lastMessageAt: at(-1),
      messages: {
        create: [
          {
            agentId,
            direction: "inbound",
            type: "text",
            body: "Hi Sarah, I'm looking for a 2 bedroom in Dubai Marina, budget up to 2 million, cash. Can we view this weekend?",
            createdAt: at(-2),
          },
          {
            agentId,
            direction: "inbound",
            type: "voice",
            mediaUrl: "/seed/voice-ahmed.ogg",
            transcription:
              "Also if there's anything with a marina view that would be perfect, and I can move quickly as it's a cash purchase.",
            reviewed: false,
            createdAt: at(-1),
          },
        ],
      },
    },
  });

  // Priya: pending reply, hot-ish, viewing request.
  await prisma.conversation.create({
    data: {
      agentId,
      clientId: priya.id,
      contactPhone: priya.phone,
      contactName: priya.name,
      classification: "hot_lead",
      urgency: 4,
      summary: "Tenant keen on Downtown 1BR around AED 120k, wants a viewing.",
      awaitingReply: true,
      lastMessageAt: at(-5),
      messages: {
        create: [
          {
            agentId,
            direction: "inbound",
            type: "text",
            body: "Is the Downtown 1 bedroom still available? When can I see it?",
            createdAt: at(-5),
          },
        ],
      },
    },
  });

  // James: contract stage, lower urgency, replied already.
  await prisma.conversation.create({
    data: {
      agentId,
      clientId: james.id,
      contactPhone: james.phone,
      contactName: james.name,
      classification: "contract_stage",
      urgency: 3,
      summary: "Considering an offer on the Palm villa; mortgage pre-approved.",
      awaitingReply: false,
      lastMessageAt: at(-26),
      messages: {
        create: [
          {
            agentId,
            direction: "inbound",
            type: "text",
            body: "Thanks for the viewing. Let me discuss with my wife and revert.",
            createdAt: at(-27),
          },
          {
            agentId,
            direction: "outbound",
            type: "text",
            body: "Of course, James. Take your time — I'll hold the unit info for you.",
            createdAt: at(-26),
          },
        ],
      },
    },
  });

  // An unknown new enquiry (no client yet) — to be auto-populated later.
  await prisma.conversation.create({
    data: {
      agentId,
      contactPhone: "+971525556677",
      contactName: "+971 52 555 6677",
      classification: "new_enquiry",
      urgency: 4,
      summary: "New enquiry about studios in JLT for investment.",
      awaitingReply: true,
      lastMessageAt: at(-3),
      messages: {
        create: [
          {
            agentId,
            direction: "inbound",
            type: "text",
            body: "Hello, do you have any studios in JLT for investment? Budget around 650k.",
            createdAt: at(-3),
          },
        ],
      },
    },
  });

  // --- Events (calendar) -------------------------------------------------
  await prisma.event.create({
    data: {
      agentId,
      type: "viewing",
      title: "Marina 2BR viewing — Ahmed Khan",
      startsAt: today(16, 0),
      endsAt: today(16, 30),
      location: "Marina Gate, Dubai Marina",
      clientId: ahmed.id,
      propertyId: marina.id,
    },
  });

  await prisma.event.create({
    data: {
      agentId,
      type: "office_meeting",
      title: "Listing agreement — Fatima Al Sayed",
      startsAt: today(11, 0),
      endsAt: today(12, 0),
      location: "Office",
      clientId: fatima.id,
    },
  });

  await prisma.event.create({
    data: {
      agentId,
      type: "trustee_office_meeting",
      title: "Transfer — Palm villa",
      startsAt: daysFromNow(2),
      endsAt: daysFromNow(2),
      location: "Dubai Land Department Trustee Office",
      clientId: james.id,
      propertyId: palm.id,
    },
  });

  // --- Deals -------------------------------------------------------------
  await prisma.deal.create({
    data: {
      agentId,
      type: "sale",
      stage: "viewing_booked",
      clientId: ahmed.id,
      propertyId: marina.id,
      amount: 1_950_000,
      notes: "Cash buyer, ready to move fast.",
    },
  });

  await prisma.deal.create({
    data: {
      agentId,
      type: "sale",
      stage: "offer_submitted",
      clientId: james.id,
      propertyId: palm.id,
      amount: 8_300_000,
      notes: "Offer submitted, awaiting seller response.",
    },
  });

  await prisma.deal.create({
    data: {
      agentId,
      type: "rental",
      stage: "documents_requested",
      clientId: priya.id,
      propertyId: downtown.id,
      amount: 115_000,
      notes: "Need passport + visa copies to prepare Ejari.",
    },
  });

  // --- Documents ---------------------------------------------------------
  await prisma.document.create({
    data: {
      agentId,
      category: "client",
      type: "passport",
      name: "James Wilson — Passport",
      fileUrl: "/seed/james-passport.pdf",
      expiresAt: daysFromNow(20), // expiring soon
      clientId: james.id,
    },
  });

  await prisma.document.create({
    data: {
      agentId,
      category: "property",
      type: "title_deed",
      name: "Palm Villa — Title Deed",
      fileUrl: "/seed/palm-title-deed.pdf",
      propertyId: palm.id,
    },
  });

  // --- AI suggested actions ---------------------------------------------
  await prisma.suggestedAction.createMany({
    data: [
      {
        agentId,
        type: "send_brochure",
        label: "Send Ahmed the Marina 2BR info pack",
        reason: "He asked to view this weekend and matches this listing 92%.",
        clientId: ahmed.id,
        conversationId: convAhmed.id,
      },
      {
        agentId,
        type: "book_viewing",
        label: "Offer Priya viewing slots for the Downtown 1BR",
        reason: "She asked when she can see it and is awaiting a reply.",
        clientId: priya.id,
      },
      {
        agentId,
        type: "request_passport",
        label: "Request passport & visa from Priya",
        reason: "Needed to prepare Ejari for the rental deal.",
        clientId: priya.id,
      },
      {
        agentId,
        type: "follow_up",
        label: "Follow up with James on the Palm offer",
        reason: "Offer submitted 27h ago with no response yet.",
        clientId: james.id,
      },
    ],
  });

  console.log(`Seeded agent ${agent.name} (${agent.email}) with sample data.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
