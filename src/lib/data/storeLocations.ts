export interface StoreLocation {
  name: string;
  venue?: string;
  addressLines: string[];
  phone?: string;
  hours: string[] | string;
  note?: string;
  verified: boolean;
}

export const storeLocations: StoreLocation[] = [
  {
    name: "Jays Shop – ",
    venue: "Gate 1 Rogers Centre",
    addressLines: ["1 Blue Jays Way, Toronto, ON"],
    phone: "(416) 341-1819",
    hours: [
      "7:07 p.m. Games: 12:00 p.m.–8:00 p.m.",
      "3:07 p.m. Games: 11:00 a.m.–7:00 p.m.",
      "1:37 p.m. or Earlier Games: 10:00 a.m.–6:00 p.m."
    ],
    note: "Jays Shop at Gate 1 is closed on non-event days.",
    verified: true
  },
  {
    name: "Jays Shop – ",
    venue: "Gate 5 Rogers Centre",
    addressLines: ["1 Blue Jays Way, Toronto, ON"],
    phone: "(416) 341-2904",
    hours: "Monday to Sunday 10:00 a.m. – 5:00 p.m.",
    note: "Jays Shop at Gate 5 closes approximately 1 hour prior to gates on game days. Store hours are subject to change on both event days and non-event days.",
    verified: true
  },
];
