// All site copy. Edit text here; layout code reads from this file.
// Prices live in config/pricing.ts, other TBC values in config/site.ts.
import { site } from "@/config/site";

export const copy = {
  meta: {
    title: "Authority — Members Club for Nepal's Fashion, Hospitality & Luxury",
    description:
      "Authority is Nepal's members club for fashion, hospitality and luxury, with articles by field and a monthly magazine. Kathmandu, Chitwan and Pokhara.",
  },

  brand: {
    wordmark: "AUTHORITY",
    tagline: "by the tastemaker, for the tastemaker",
  },

  nav: {
    articles: "Articles",
    membership: "Membership",
    about: "About",
    faq: "FAQ",
    contact: "Contact",
    dashboard: "My field",
    admin: "Admin",
    signIn: "Sign in",
    signOut: "Sign out",
    menu: "Menu",
  },

  signIn: {
    google: "Sign in with Google",
    heading: "Sign in to Authority",
    body: "Use your Google account. New members are asked a few short questions after signing in.",
    errors: {
      suspended: "This account is suspended. Please contact us if you think this is a mistake.",
      rate: "Too many sign-in attempts. Please wait a few minutes and try again.",
      unverified: "Your Google email is not verified. Please verify it with Google and try again.",
      default: "Sign-in failed. Please try again.",
    } as Record<string, string>,
  },

  home: {
    whatIs: {
      eyebrow: "What is Authority",
      heading: "A club for the people who set the taste",
      body: [
        "Authority is a members club for Nepal's fashion, hospitality and luxury world.",
        "Members receive articles chosen for their own field and a monthly magazine, and meet the people shaping it.",
      ],
    },
    whatItDoes: {
      eyebrow: "What it does",
      heading: "Articles by field, doors that are usually closed",
      items: [
        { title: "Articles by field", body: "Reporting and features for your industry, not everyone else's." },
        { title: "Partner venues", body: "Offers and discounts from founding partner venues in your field." },
        { title: "Conversation", body: "Pro members comment, post and meet others in their field." },
      ],
    },
    audience: {
      eyebrow: "Who it is for",
      heading: "Three worlds, one table",
      cards: [
        { title: "Gaas", subtitle: "Taste", image: "Image: Gaas", body: "Chefs, restaurateurs, bar owners and producers." },
        { title: "Baas", subtitle: "Stay", image: "Image: Baas", body: "Hotels, lodges, homestays and travel." },
        { title: "Kapas", subtitle: "Clothes", image: "Image: Kapas", body: "Designers, ateliers, weavers and stylists." },
      ],
      extra: [
        { title: "Creators", body: "Writers, photographers and filmmakers telling these stories." },
        { title: "Students", body: "The next generation of the industry, welcome from day one." },
      ],
    },
    articles: {
      eyebrow: "From the articles",
      heading: "Read by field",
      all: "All articles",
    },
    join: {
      heading: "Join Authority",
      body: "Sign in with Google, tell us your field, and choose a membership.",
    },
  },

  articles: {
    heading: "Articles",
    intro: "Previews of every article. Members read the full piece for their own field.",
    filterLabel: "Field",
    allFields: "All fields",
    searchLabel: "Search by title",
    searchPlaceholder: "Search titles",
    searchButton: "Search",
    empty: "No articles match. Try another field or search.",
    by: "By",
    share: "Share",
    copyLink: "Copy link",
    copied: "Link copied",
    lockedHeading: "Members only",
    lockedSignedOut: "Sign in to join for free and read the full article if it's in your field.",
    lockedOnboarding: "Finish setting up your account to read articles from your field.",
    lockedOtherField: "This article is for members in another field. Your membership covers your own field.",
    onboardingCta: "Finish setup",
    signInCta: "Sign in to join free",
  },

  comments: {
    heading: "Comments",
    label: "Add a comment",
    submit: "Post comment",
    empty: "No comments yet.",
    proOnly: "Pro members in this field can read and post comments.",
    removed: "[removed by a moderator]",
  },

  membership: {
    heading: "Membership",
    intro: "Every membership covers your own field. Basic is free. Pro is paid by eSewa, Khalti or bank transfer and verified by our team.",
    free: "Free",
    freeNote: "Starts as soon as you sign in and choose your field.",
    monthly: "per month",
    yearly: "per year",
    yearlySaving: (full: string) => `20% off ${full}`,
    signInToJoin: "Sign in to join",
    choosePro: "Get Pro",
    payWith: "Pro payments:",
  },

  onboarding: {
    heading: "Welcome to Authority",
    intro: "A few short questions so we can set up your field. Required fields are marked *.",
    steps: ["Your field", "About you", "Perks", "Founding spot", "Build with us"],
    field: "Choose your field",
    fieldHint: "Your field decides which articles, offers and member discussions you see.",
    name: "Name",
    city: "City",
    contact: "Email or WhatsApp",
    contactHint: "For invites and receipts. WhatsApp numbers can be local (98XXXXXXXX) or with +977.",
    perks: "Which perks matter most?",
    perksHint: "Choose as many as you like.",
    deposit: "Would you put down a small deposit for a founding spot?",
    depositHint: "This is only a signal. Nothing is charged.",
    helpBuild: "Are you experienced in this field and would you like to help build Authority?",
    contribution: "What could you contribute?",
    contributionHint: "Writing, photography, venues, brand connections, styling, other.",
    optional: "optional",
    back: "Back",
    next: "Next",
    submit: "Finish",
    submitting: "Saving…",
  },

  dashboard: {
    pendingHeading: "Pro payment pending",
    pendingBody: "We've received your payment details. Pro starts as soon as our team verifies it.",
    rejectedHeading: "Pro payment not verified",
    rejectedBody: "We couldn't verify your last payment. Please check the note and submit again.",
    expiredHeading: "Your Pro membership has ended",
    expiredBody: "You're on Basic now. Renew Pro to comment, post and see the member directory again.",
    renewHeading: (days: number) => `Your Pro membership ends in ${days} day${days === 1 ? "" : "s"}`,
    renewBody: "Renew now so you don't lose Pro features.",
    renewCta: "Renew Pro",
    upgradeHeading: "Upgrade to Pro",
    upgradeBody: "Comment on articles, post in your field's discussion feed and see the member directory.",
    upgradeCta: "Upgrade to Pro",
    articles: "Latest in your field",
    noArticles: "No articles in your field yet.",
    venues: "Partner venues",
    noOffers: "Offers from partner venues are coming soon.",
    valid: "Valid",
    until: "until",
    from: "from",
    plan: "Plan",
    expires: "Expires",
    discussion: "Discussion",
    directory: "Directory",
    home: "Field home",
    membership: "Membership",
  },

  join: {
    heading: "Membership",
    current: "Current membership",
    basicCurrent: "Basic (free): articles, field home and offers for your field.",
    upgradePro: "Upgrade to Pro",
    renewPro: "Renew Pro",
    chooseCycle: "Billing period",
    chooseMethod: "Payment method",
    amount: "Amount to pay",
    instructions: "How to pay",
    reference: "Payment reference / transaction ID",
    referenceHint: "From your eSewa, Khalti or bank receipt.",
    screenshot: "Payment screenshot",
    screenshotHint: "JPG, PNG, WebP or PDF, up to 2 MB. Optional if you give a reference.",
    submit: "Submit payment for verification",
    submitting: "Submitting…",
    success: "Thank you. Your payment is now pending verification.",
    pendingBlock: "You already have a payment waiting for verification. We'll update your account once it's checked.",
    history: "Payment history",
    note: "Note from Authority",
  },

  discussion: {
    heading: "Discussion",
    intro: "Share your point of view with members in your field. Only Pro members in your field can see this feed.",
    label: "Share your point of view",
    submit: "Post",
    reply: "Reply",
    replyLabel: "Write a reply",
    report: "Report",
    reportReason: "Why are you reporting this?",
    reportSubmit: "Send report",
    reported: "Thanks. Our team will review it.",
    block: "Block",
    unblock: "Unblock",
    blockConfirm: "You won't see this member's posts or comments.",
    empty: "No posts yet. Start the conversation.",
    removed: "[removed by a moderator]",
  },

  directory: {
    heading: "Member directory",
    intro: "Members in your field.",
    empty: "No other members in your field yet.",
  },

  about: {
    heading: "About Authority",
    body: [
      "Authority is an article publisher for Nepal's fashion, hospitality and luxury world. Its members club gives members articles by field: the reporting that matters to their industry.",
      "Members also receive a monthly magazine, offers from partner venues, and, on Pro, a place to talk with others in their field.",
      "We start in Kathmandu, Chitwan and Pokhara.",
    ],
  },

  faq: {
    heading: "FAQ",
    items: [
      { q: "How much does membership cost?", a: "Basic is free. Pro is NPR 1,000 a month or NPR 9,600 a year (20% off NPR 12,000)." },
      { q: "Who can join?", a: "TBC. People working in fashion, food, hospitality, travel and luxury, plus creators and students." },
      { q: "How do I pay for Pro?", a: "TBC. By eSewa, Khalti or bank transfer. Our team verifies each payment before Pro starts." },
      { q: "When does Authority launch?", a: `TBC. Launch date: ${site.launchDate}.` },
      { q: "Which cities?", a: "Kathmandu, Chitwan and Pokhara to begin with. TBC." },
      { q: "Can I change my field?", a: "TBC. Contact us and our team can move you to another field." },
    ],
  },

  contact: {
    heading: "Contact",
    body: "For membership, partnerships and press, email us or message us on Instagram.",
  },

  privacy: {
    heading: "Privacy note",
    body: [
      "When you sign in with Google we receive your name, email address and profile picture.",
      "During onboarding we collect your field, name, city, email or WhatsApp number, and your answers about perks, a founding deposit and helping build Authority. We use these to run your membership, send invites and receipts, and understand what members want.",
      "When you pay, we store the package, amount, payment method, reference and any screenshot you upload, so our team can verify the payment.",
      "Comments and posts you write are visible only to Pro members in your field and to our moderators.",
      "We do not sell your data. To see, correct or delete your data, contact us. TBC: full privacy policy.",
    ],
  },

  footer: {
    rights: `© ${new Date().getFullYear()} Authority`,
    privacy: "Privacy note",
  },

  admin: {
    nav: {
      dashboard: "Dashboard",
      payments: "Payments",
      articles: "Articles",
      offers: "Offers",
      members: "Members",
      moderation: "Moderation",
    },
  },

  errors: {
    generic: "Something went wrong. Please try again.",
    rate: "Too many requests. Please wait a moment and try again.",
    forbidden: "You don't have access to this.",
  },
};
