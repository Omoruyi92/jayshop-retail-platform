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
  {
    name: "Jays Shop – ",
    venue: "Gate 8 Rogers Centre",
    addressLines: ["1 Blue Jays Way, Toronto, ON"],
    hours: "Varies by game time",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "CF Toronto Eaton Centre",
    addressLines: ["220 Yonge St, Toronto, ON"],
    hours: "Mon-Sat: 10:00 a.m.–9:00 p.m. / Sun: 11:00 a.m.–7:00 p.m.",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "Yorkdale Shopping Centre",
    addressLines: ["3401 Dufferin St, Toronto, ON"],
    hours: "Mon-Sat: 10:00 a.m.–9:00 p.m. / Sun: 11:00 a.m.–7:00 p.m.",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "Square One Shopping Centre",
    addressLines: ["100 City Centre Dr, Mississauga, ON"],
    hours: "Mon-Sat: 10:00 a.m.–9:00 p.m. / Sun: 11:00 a.m.–7:00 p.m.",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "Scarborough Town Centre",
    addressLines: ["300 Borough Dr, Scarborough, ON"],
    hours: "Mon-Sat: 10:00 a.m.–9:00 p.m. / Sun: 11:00 a.m.–7:00 p.m.",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "Vaughan Mills",
    addressLines: ["1 Bass Pro Mills Dr, Vaughan, ON"],
    hours: "Mon-Sat: 10:00 a.m.–9:00 p.m. / Sun: 11:00 a.m.–7:00 p.m.",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "Sherway Gardens",
    addressLines: ["25 The West Mall, Etobicoke, ON"],
    hours: "Mon-Sat: 10:00 a.m.–9:00 p.m. / Sun: 11:00 a.m.–7:00 p.m.",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "TD Comfort Clubhouse",
    addressLines: ["Rogers Centre, 200 Level, Toronto, ON"],
    hours: "Open during games",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "Spring Training",
    addressLines: ["TD Ballpark, 373 Douglas Ave, Dunedin, FL"],
    hours: "Varies during spring training",
    verified: false
  },
  {
    name: "Jays Shop – ",
    venue: "Pop-Up Store",
    addressLines: ["Union Station, Toronto, ON"],
    hours: "Mon-Fri: 7:00 a.m.–7:00 p.m.",
    verified: false
  }
];
