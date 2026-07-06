export interface AysPlayerRegistration {
  id: string;
  name: string;
  initials: string;
  dateOfBirth: string;
  idNumber?: string;
  program: string;
  division: string;
}

export const AYSO_ORG = {
  name: "AYSO 97",
  location: "Newport Beach, CA",
  season: "2026 Fall",
  program: "Fall Core",
} as const;

export const AYSO_PLAYERS: AysPlayerRegistration[] = [
  {
    id: "charles-lewis",
    name: "Charles Lewis",
    initials: "CL",
    dateOfBirth: "June 24, 2022",
    program: "2026 Fall Core",
    division: "05U - Boys",
  },
  {
    id: "david-lewis",
    name: "David Lewis",
    initials: "DL",
    dateOfBirth: "September 03, 2017",
    idNumber: "11477-877534",
    program: "2026 Fall Core",
    division: "10U - Boys",
  },
];
