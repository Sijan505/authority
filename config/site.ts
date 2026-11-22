// Site-wide settings. Every value marked TBC needs a real answer before launch.

export const site = {
  name: "Authority",
  instagramHandle: "@authoritymag",
  instagramUrl: "https://instagram.com/authoritymag",

  contactEmail: "satishacharya741@gmail.com",

  // TBC: launch date
  launchDate: "TBC",
};

export const cities = ["Kathmandu", "Chitwan", "Pokhara", "Other"] as const;

export const perks = ["Discounts", "Room upgrades", "Events", "Meeting people", "The magazine"] as const;

export const depositOptions = ["Yes", "Maybe", "No"] as const;

export const helpOptions = ["Yes, I'd like to help", "Maybe, tell me more", "No, just as a member"] as const;

/** Days before expiry when the dashboard starts showing a renewal reminder. */
export const RENEWAL_REMINDER_DAYS = 7;

// The public interest form (components/Inquiry.tsx), following the landing-page
// workplan. The server validates answers against these lists, so edit them here only.
// It reuses cities, perks, depositOptions and helpOptions from above.
export const inquiryFields = ["Fashion", "Food", "Hospitality", "Travel", "Creative", "Student", "Other"] as const;

// TBC: price bands to test, per year.
export const priceBands = ["Under Rs 5,000", "Rs 5,000 – 10,000", "Rs 10,000 – 25,000", "Over Rs 25,000", "Not sure yet"] as const;

export const contributionOptions = ["Writing", "Photography", "Venues", "Brand connections", "Styling", "Other"] as const;

/** Where a sign-up came from, read from ?utm_source= / ?ref= or the referring site. */
export const inquirySources = ["Instagram", "TikTok", "Facebook", "Referral", "Search", "Direct", "Other"] as const;

/**
 * The first event. Set reserved to a real number to show the seat counter
 * ("25 of 40 seats reserved"); while it is null the page says reservations open soon.
 */
export const issueDrop = {
  seats: 40, // TBC
  reserved: null as number | null,
  venue: "A partner venue in Kathmandu", // TBC: name the venue once confirmed
};

/** Founding partners. Empty slots show as "coming soon" up to partnerSlots. */
export const partners: { name: string; kind: string; href?: string }[] = [];
export const partnerSlots = 6;

/** TBC: success target for the interest test, set before launch (shown in admin). */
export const successTarget = { signups: 200, willingToPayShare: 0.25, deposits: 20 };
