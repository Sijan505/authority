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
