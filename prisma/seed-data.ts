import type { Prisma } from "../src/generated/prisma/client";

// Fictional names and reserved .example domains; no real outreach targets.
// Revenue figures are estimated annual USD revenue, not valuations.
const companyRows: [string, string, string, string, string, number, string][] = [
  ["Ledgercrest Software", "ledgercrest", "SaaS", "Austin, TX", "8400000", 58, "Maya Ellison"],
  ["ShiftHarbor Technologies", "shiftharbor", "SaaS", "Raleigh, NC", "12600000", 91, "Daniel Mercer"],
  ["PermitNest Systems", "permitnest", "SaaS", "Madison, WI", "3900000", 29, "Priya Weston"],
  ["QuarryDesk Analytics", "quarrydesk", "SaaS", "Denver, CO", "6700000", 46, "Colin Sethi"],
  ["FleetCanvas Cloud", "fleetcanvas", "SaaS", "Columbus, OH", "18200000", 132, "Nina Calder"],
  ["Cedarline Mechanical", "cedarline-mechanical", "HVAC", "Charlotte, NC", "14700000", 82, "Owen Hartley"],
  ["SummitVale Climate Services", "summitvale-climate", "HVAC", "Boise, ID", "9200000", 54, "Elena Brooks"],
  ["BlueMesa Air Systems", "bluemesa-air", "HVAC", "Albuquerque, NM", "6800000", 38, "Rafael Benton"],
  ["NorthPine Commercial HVAC", "northpine-hvac", "HVAC", "Grand Rapids, MI", "21500000", 126, "Audrey Kimball"],
  ["Harborstone Building Comfort", "harborstone-comfort", "HVAC", "Norfolk, VA", "11300000", 67, "Marcus Leland"],
  ["Ironhaven Reliability", "ironhaven", "Industrial Services", "Pittsburgh, PA", "24600000", 148, "Grace Moreno"],
  ["RedOak Process Maintenance", "redoak-process", "Industrial Services", "Tulsa, OK", "17800000", 109, "Victor Langford"],
  ["Bridgewell Field Services", "bridgewell-field", "Industrial Services", "Birmingham, AL", "32400000", 214, "Simone Adler"],
  ["CopperRun Calibration", "copperrun", "Industrial Services", "Dayton, OH", "5900000", 43, "Ethan Farrow"],
  ["Stonebrook Plant Solutions", "stonebrook-plant", "Industrial Services", "Milwaukee, WI", "13600000", 87, "Leah Navarro"],
  ["Waypoint Grove Logistics", "waypoint-grove", "Logistics", "Memphis, TN", "38700000", 176, "Thomas Vale"],
  ["Clearspan Freight Partners", "clearspan-freight", "Logistics", "Kansas City, MO", "26400000", 96, "Aisha Bennett"],
  ["OrchardRoute Distribution", "orchardroute", "Logistics", "Sacramento, CA", "19200000", 122, "Eric Hollis"],
  ["SilverQuay Cold Chain", "silverquay", "Logistics", "Jacksonville, FL", "47300000", 238, "Camila Reed"],
  ["PrairieLink Fulfillment", "prairielink", "Logistics", "Omaha, NE", "15800000", 104, "Peter Ashford"],
  ["MapleBridge Revenue Services", "maplebridge-revenue", "Healthcare", "Nashville, TN", "16400000", 137, "Sonia Whitaker"],
  ["WillowPeak Clinical Staffing", "willowpeak-staffing", "Healthcare", "Phoenix, AZ", "28700000", 192, "Adrian Moss"],
  ["CareHaven Supply Partners", "carehaven-supply", "Healthcare", "Indianapolis, IN", "22100000", 78, "Naomi Fletcher"],
  ["Elmstone Practice Solutions", "elmstone-practice", "Healthcare", "Richmond, VA", "7400000", 61, "Julian Ortega"],
  ["Lakeshore Credentialing Group", "lakeshore-credentialing", "Healthcare", "Minneapolis, MN", "4600000", 42, "Tessa Rowan"],
  ["BastionTrail Security", "bastiontrail", "Cybersecurity", "Boston, MA", "11900000", 73, "Oliver Chen"],
  ["QuietShield Networks", "quietshield", "Cybersecurity", "Tampa, FL", "8600000", 57, "Amara Prescott"],
  ["EmberGate Risk Labs", "embergate", "Cybersecurity", "Salt Lake City, UT", "5300000", 34, "Felix Warren"],
  ["CobaltRidge Defense", "cobaltridge", "Cybersecurity", "Arlington, VA", "23400000", 141, "Diana Mehta"],
  ["SignalForge Assurance", "signalforge", "Cybersecurity", "Portland, OR", "9700000", 65, "Jonah Bellamy"],
];

export const companies = companyRows.map(([name, slug, industry, location, estimatedRevenue, employeeCount, ceoName]) => ({
  slug, name, domain: `${slug}.example`, industry, location, estimatedRevenue,
  employeeCount, ceoName, website: `https://${slug}.example`,
}));

export const organizations = [
  {
    id: "demo-org-acme", name: "Acme Software",
    users: [
      { id: "demo-user-acme-jordan", name: "Jordan Blake", email: "jordan@acme-software.example" },
      { id: "demo-user-acme-priya", name: "Priya Shah", email: "priya@acme-software.example" },
    ],
  },
  {
    id: "demo-org-beta", name: "Beta Holdings",
    users: [
      { id: "demo-user-beta-morgan", name: "Morgan Ellis", email: "morgan@beta-holdings.example" },
      { id: "demo-user-beta-alex", name: "Alex Rivera", email: "alex@beta-holdings.example" },
    ],
  },
];

type SeedInteraction = Pick<Prisma.InteractionUncheckedCreateInput,
  "interactionType" | "rawNotes" | "aiSummary" | "relationshipStatus" |
  "sellerReadiness" | "sentiment" | "successionSignal" | "recommendedAction"
> & { key: string; organizationId: string; companySlug: string; userId: string; daysAgo: number; followUpInDays?: number };

// Hand-authored AI-style outputs for the demo. No API calls are made by seeding.
export const interactions: SeedInteraction[] = [
  {
    key: "acme-ledgercrest-intro", organizationId: "demo-org-acme", companySlug: "ledgercrest", userId: "demo-user-acme-jordan", daysAgo: 74,
    interactionType: "EMAIL", rawNotes: "Introduced Acme's long-term partnership approach to Maya Ellison after the regional software founders roundtable. Maya replied that Ledgercrest serves 240 accounting firms and asked whether we retain founder-led product teams. Sent a short overview; no financial information requested yet.",
    aiSummary: "Maya replied to the introduction and asked about product-team continuity. Early interest in Acme's partnership approach.",
    relationshipStatus: "CONTACTED", sellerReadiness: "EXPLORING", sentiment: "POSITIVE", successionSignal: "UNKNOWN",
    recommendedAction: "Arrange an introductory call focused on founder autonomy.",
  },
  {
    key: "acme-ledgercrest-warm", organizationId: "demo-org-acme", companySlug: "ledgercrest", userId: "demo-user-acme-priya", daysAgo: 12, followUpInDays: 5,
    interactionType: "CALL", rawNotes: "Thirty-minute call with Maya. She remembered Jordan's email and was open about wanting help scaling channel sales. Not running a sale process. Keeping the engineering team in Austin and remaining involved in product are non-negotiable. Agreed to introduce us to her COO next week after reviewing two partnership examples.",
    aiSummary: "Warm relationship: founder is exploring a growth partner and agreed to a COO introduction. Team location and ongoing product involvement matter.",
    relationshipStatus: "ENGAGED", sellerReadiness: "EXPLORING", sentiment: "POSITIVE", successionSignal: "UNKNOWN",
    recommendedAction: "Send two relevant partnership examples and confirm the COO introduction; avoid assuming a sale mandate.",
  },
  {
    key: "acme-cedarline-first", organizationId: "demo-org-acme", companySlug: "cedarline-mechanical", userId: "demo-user-acme-jordan", daysAgo: 101,
    interactionType: "CALL", rawNotes: "Reached Owen between service visits. Cedarline is rolling out dispatch software and hiring six technicians before summer demand. He said an ownership discussion could be worth having, but asked us to reconnect after the rollout rather than schedule anything now.",
    aiSummary: "Owner is open to a later conversation but dispatch rollout and hiring take priority.",
    relationshipStatus: "NURTURING", sellerReadiness: "NOT_READY", sentiment: "NEUTRAL", successionSignal: "UNKNOWN",
    recommendedAction: "Respect the requested pause and reconnect after the dispatch rollout.",
  },
  {
    key: "acme-cedarline-later", organizationId: "demo-org-acme", companySlug: "cedarline-mechanical", userId: "demo-user-acme-jordan", daysAgo: 19, followUpInDays: 60,
    interactionType: "EMAIL", rawNotes: "Owen replied to our check-in: rollout is complete, but the operations manager role is still vacant. 'Give me another couple of months so I can get the new manager settled. Email is best; please don't call the service line.' No indication that he has started a sale process.",
    aiSummary: "Follow up later: owner requested a two-month pause while hiring an operations manager. Prefers email, not the service line.",
    relationshipStatus: "NURTURING", sellerReadiness: "NOT_READY", sentiment: "NEUTRAL", successionSignal: "UNKNOWN",
    recommendedAction: "Email Owen after the requested pause; do not call the service line.",
  },
  {
    key: "acme-waypoint-first", organizationId: "demo-org-acme", companySlug: "waypoint-grove", userId: "demo-user-acme-priya", daysAgo: 41,
    interactionType: "EMAIL", rawNotes: "Sent Thomas Vale a personalized introduction mentioning Waypoint Grove's regional warehousing footprint. Email delivered without a bounce. No reply as of today's review; we have not spoken with Thomas or anyone on his team.",
    aiSummary: "Initial outreach sent; no response or direct conversation recorded.",
    relationshipStatus: "CONTACTED", sellerReadiness: "UNKNOWN", sentiment: "UNKNOWN", successionSignal: "UNKNOWN",
    recommendedAction: "Send one concise follow-up; do not interpret silence as rejection or interest.",
  },
  {
    key: "acme-waypoint-no-response", organizationId: "demo-org-acme", companySlug: "waypoint-grove", userId: "demo-user-acme-priya", daysAgo: 23, followUpInDays: 14,
    interactionType: "EMAIL", rawNotes: "Sent one follow-up to Thomas with a short overview of our logistics experience. Still no response. No meeting booked and no evidence of ownership interest. Pause outreach for a few weeks before deciding whether another touch is appropriate.",
    aiSummary: "No response after two emails. Seller readiness and sentiment remain unknown.",
    relationshipStatus: "CONTACTED", sellerReadiness: "UNKNOWN", sentiment: "UNKNOWN", successionSignal: "UNKNOWN",
    recommendedAction: "Review the account after a short pause; avoid escalating contact frequency.",
  },
  {
    key: "acme-maplebridge-intro", organizationId: "demo-org-acme", companySlug: "maplebridge-revenue", userId: "demo-user-acme-jordan", daysAgo: 35,
    interactionType: "CALL", rawNotes: "Sonia Whitaker took the introduction from our industry adviser. She is evaluating partners for the next stage and wants to reduce her day-to-day operating role over the next 18 months. No internal successor selected. Asked us to meet her finance director before sharing detailed figures.",
    aiSummary: "Founder is actively evaluating partners and planning an operational transition without a selected internal successor.",
    relationshipStatus: "ENGAGED", sellerReadiness: "EXPLORING", sentiment: "POSITIVE", successionSignal: "CONFIRMED",
    recommendedAction: "Arrange a meeting with Sonia and the finance director to clarify the transition plan.",
  },
  {
    key: "acme-maplebridge-interested", organizationId: "demo-org-acme", companySlug: "maplebridge-revenue", userId: "demo-user-acme-priya", daysAgo: 4, followUpInDays: 3,
    interactionType: "MEETING", rawNotes: "Met Sonia and finance director Ben at their office. Sonia explicitly wants to explore a majority sale and would stay for a 12-18 month handover. They requested our NDA and a preliminary diligence checklist. Employee retention and maintaining client service teams are key conditions. No valuation agreed and no financial documents received yet.",
    aiSummary: "Interested in exploring a majority sale with a founder handover. Requested an NDA and diligence checklist; employee retention is a priority.",
    relationshipStatus: "ENGAGED", sellerReadiness: "READY", sentiment: "POSITIVE", successionSignal: "CONFIRMED",
    recommendedAction: "Send the NDA and a scoped diligence checklist, explicitly addressing employee retention.",
  },
  {
    key: "acme-bastiontrail-outreach", organizationId: "demo-org-acme", companySlug: "bastiontrail", userId: "demo-user-acme-jordan", daysAgo: 67,
    interactionType: "EMAIL", rawNotes: "Sent Oliver Chen an introductory email about potential ownership partnerships. No prior relationship and no referral. Awaiting a response.",
    aiSummary: "Initial introduction sent; no prior relationship established.",
    relationshipStatus: "CONTACTED", sellerReadiness: "UNKNOWN", sentiment: "UNKNOWN", successionSignal: "UNKNOWN",
    recommendedAction: "Wait for a response before further outreach.",
  },
  {
    key: "acme-bastiontrail-dnc", organizationId: "demo-org-acme", companySlug: "bastiontrail", userId: "demo-user-acme-jordan", daysAgo: 63,
    interactionType: "EMAIL", rawNotes: "Oliver replied: 'We are not considering a sale. Please remove me from Acme's outreach list and do not contact our team again about this.' Acknowledged the request and marked the account do not contact. No further outreach authorized.",
    aiSummary: "Explicit do-not-contact request directed to Acme. Company is not considering a sale.",
    relationshipStatus: "DO_NOT_CONTACT", sellerReadiness: "NOT_READY", sentiment: "NEGATIVE", successionSignal: "UNKNOWN",
    recommendedAction: "Suppress all Acme outreach to this account. Do not schedule a follow-up.",
  },
  {
    key: "acme-ironhaven-wrong-time", organizationId: "demo-org-acme", companySlug: "ironhaven", userId: "demo-user-acme-priya", daysAgo: 218,
    interactionType: "CALL", rawNotes: "Grace Moreno said the timing was wrong: Ironhaven had just won a three-year plant maintenance contract and needed to mobilize a new field team. She did not reject a future partnership discussion. Asked us to reconnect once the first two quarterly service reviews were complete.",
    aiSummary: "Previously contacted; new contract mobilization made the timing unsuitable. Owner invited a later conversation after two service reviews.",
    relationshipStatus: "NURTURING", sellerReadiness: "NOT_READY", sentiment: "NEUTRAL", successionSignal: "UNKNOWN",
    recommendedAction: "Retain the mobilization context and reconnect after the requested milestones.",
  },
  {
    key: "acme-ironhaven-resurface", organizationId: "demo-org-acme", companySlug: "ironhaven", userId: "demo-user-acme-priya", daysAgo: 3, followUpInDays: 7,
    interactionType: "NOTE", rawNotes: "Ironhaven appeared in the industrial-services search again. Reviewed Grace's earlier call note rather than treating it as a new lead. More than six months have elapsed, but we have not confirmed whether both service reviews are complete. Next message should ask about the rollout and acknowledge her original timing request.",
    aiSummary: "Resurfaced lead has prior context. Requested waiting period has elapsed, but operational milestones still need confirmation.",
    relationshipStatus: "NURTURING", sellerReadiness: "UNKNOWN", sentiment: "UNKNOWN", successionSignal: "UNKNOWN",
    recommendedAction: "Send a contextual check-in about contract mobilization; do not imply Grace is ready to sell.",
  },
  {
    key: "beta-ledgercrest-intro", organizationId: "demo-org-beta", companySlug: "ledgercrest", userId: "demo-user-beta-morgan", daysAgo: 46,
    interactionType: "CALL", rawNotes: "Maya took our call through a mutual accountant. Explained Beta's acquisition criteria. She said our requirement for immediate full integration would not fit her plans to keep an independent product team. She was professional and did not ask us to remove her details.",
    aiSummary: "Beta's immediate integration model does not match the founder's goals. This is a fit issue, not a do-not-contact request.",
    relationshipStatus: "NOT_INTERESTED", sellerReadiness: "UNKNOWN", sentiment: "NEUTRAL", successionSignal: "UNKNOWN",
    recommendedAction: "Close the current Beta opportunity; reopen only if the proposed operating model materially changes.",
  },
  {
    key: "beta-cedarline-intro", organizationId: "demo-org-beta", companySlug: "cedarline-mechanical", userId: "demo-user-beta-alex", daysAgo: 28,
    interactionType: "EMAIL", rawNotes: "Introduced Beta to Owen through a commercial property manager. Owen replied that he might consider a conversation once his operations hire is in place. We have not had a live meeting or received any financial information.",
    aiSummary: "Referred introduction received a reply; operational hiring is delaying a discussion.",
    relationshipStatus: "NURTURING", sellerReadiness: "NOT_READY", sentiment: "NEUTRAL", successionSignal: "UNKNOWN",
    recommendedAction: "Wait for Owen's hiring milestone before asking for a meeting.",
  },
  {
    key: "beta-cedarline-followup", organizationId: "demo-org-beta", companySlug: "cedarline-mechanical", userId: "demo-user-beta-alex", daysAgo: 8, followUpInDays: 55,
    interactionType: "EMAIL", rawNotes: "Owen confirmed the operations-manager search is still active. Asked Beta to check back in roughly two months. Not ready to discuss terms or share books. Keep the referral source informed only that we are waiting, without sharing private details.",
    aiSummary: "Beta also has an explicit request to wait while the operations role is filled; no transaction readiness established.",
    relationshipStatus: "NURTURING", sellerReadiness: "NOT_READY", sentiment: "NEUTRAL", successionSignal: "UNKNOWN",
    recommendedAction: "Send a brief email after the requested pause; do not request financials yet.",
  },
  {
    key: "beta-silverquay-meeting", organizationId: "demo-org-beta", companySlug: "silverquay", userId: "demo-user-beta-morgan", daysAgo: 9, followUpInDays: 4,
    interactionType: "MEETING", rawNotes: "Camila Reed met us with her co-founder. They are exploring outside capital for a second refrigerated facility, with no decision between minority investment and a sale. Requested examples of how Beta handles facility financing. Both founders intend to remain involved; no retirement plans discussed.",
    aiSummary: "Positive exploratory discussion about financing a second facility. Transaction structure remains undecided; founders plan to stay involved.",
    relationshipStatus: "ENGAGED", sellerReadiness: "EXPLORING", sentiment: "POSITIVE", successionSignal: "NONE",
    recommendedAction: "Share relevant facility-financing examples and clarify preferred investment structure.",
  },
  {
    key: "beta-quietshield-email", organizationId: "demo-org-beta", companySlug: "quietshield", userId: "demo-user-beta-alex", daysAgo: 16,
    interactionType: "EMAIL", rawNotes: "Amara Prescott replied to our introduction: QuietShield signed an exclusivity agreement with another party and cannot discuss ownership options with Beta. She did not disclose the buyer or expected terms. Asked us not to pursue the discussion while exclusivity remains in place.",
    aiSummary: "Company is in an exclusive process with another party. Beta's current opportunity is closed; no terms disclosed.",
    relationshipStatus: "NOT_INTERESTED", sellerReadiness: "UNKNOWN", sentiment: "NEUTRAL", successionSignal: "UNKNOWN",
    recommendedAction: "Respect the exclusive process and stop current deal outreach.",
  },
];
