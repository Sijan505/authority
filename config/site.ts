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

// Options for the "Request an invitation" inquiry (components/Inquiry.tsx). The server
// validates answers against these lists, so edit them here only.
export const inquiryWorlds = ["Gaas: food and dining", "Baas: hospitality and places", "Kapas: fashion and craft", "A bit of everything"] as const;

export const inquiryRoles = [
  "Founder or business owner",
  "Creative: designer, photographer, artist",
  "Chef or hospitality professional",
  "Maker or artisan",
  "Student or emerging talent",
  "Curious, and want to be in the room",
] as const;

export const inquiryCities = ["Kathmandu", "Chitwan", "Pokhara", "Elsewhere in Nepal", "Outside Nepal"] as const;

export const inquiryInterests = ["The Experiences", "The Network", "The Request Desk", "The Exchange", "The Journal", "The Founder Circle"] as const;
