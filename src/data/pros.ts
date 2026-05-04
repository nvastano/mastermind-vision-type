import type { Pro } from '../app/App';

const FIRST_NAMES = [
  'James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Barbara',
  'David','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen',
  'Christopher','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra',
  'Donald','Ashley','Steven','Dorothy','Paul','Kimberly','Andrew','Emily','Kenneth','Donna',
  'Joshua','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Timothy','Deborah',
  'Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia',
  'Jacob','Kathleen','Gary','Amy','Nicholas','Angela','Eric','Shirley','Jonathan','Anna',
  'Stephen','Brenda','Larry','Pamela','Justin','Emma','Scott','Nicole','Brandon','Helen',
  'Benjamin','Samantha','Samuel','Katherine','Raymond','Christine','Gregory','Debra','Frank','Rachel',
  'Alexander','Carolyn','Patrick','Janet','Jack','Catherine','Dennis','Maria','Jerry','Heather',
  'Tyler','Diane','Aaron','Julie','Jose','Joyce','Adam','Victoria','Henry','Kelly',
  'Nathan','Christina','Douglas','Ruth','Zachary','Joan','Peter','Virginia','Kyle','Judith',
  'Walter','Evelyn','Ethan','Hannah','Jeremy','Andrea','Harold','Megan','Terry','Cheryl',
  'Sean','Jacqueline','Austin','Madison','Carl','Teresa','Arthur','Gloria','Lawrence','Sara',
  'Dylan','Janice','Roger','Ann','Joe','Julia','Juan','Grace','Albert','Judy',
  'Wayne','Theresa','Jesse','Beverly','Roy','Denise','Billy','Marilyn','Logan','Amber',
  'Jordan','Danielle','Christian','Rose','Willie','Brittany','Alan','Diana','Keith','Natalie',
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
  'Turner','Phillips','Evans','Torres','Parker','Collins','Edwards','Stewart','Morris','Murphy',
  'Cook','Rogers','Morgan','Peterson','Cooper','Reed','Bailey','Bell','Gomez','Kelly',
  'Howard','Ward','Cox','Diaz','Richardson','Wood','Watson','Brooks','Bennett','Gray',
  'James','Reyes','Cruz','Hughes','Price','Myers','Long','Foster','Sanders','Ross',
  'Morales','Powell','Sullivan','Russell','Ortiz','Jenkins','Gutierrez','Perry','Butler','Barnes',
  'Fisher','Henderson','Coleman','Simmons','Patterson','Jordan','Reynolds','Hamilton','Graham','Kim',
  'Gonzales','Alexander','Ramos','Wallace','Griffin','West','Cole','Hayes','Chavez','Gibson',
];

const DOMAINS = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'me.com','comcast.net','aol.com','msn.com','live.com',
];

const AREA_CODES = [
  '615','629','901','731', // Tennessee
  '214','972','469','817','682', // Dallas-Fort Worth
  '312','773','847','630','708', // Chicago
  '404','770','678','470', // Atlanta
  '602','480','623','520', // Phoenix
  '713','832','281','346', // Houston
  '615','865','423', // More TN
  '317','219','812', // Indiana
  '513','614','216','937', // Ohio
  '704','919','336','910', // North Carolina
  '502','859', // Kentucky
  '205','256','334', // Alabama
  '901','615','865', // More Tennessee
  '816','314','417', // Missouri
  '901','731','423','865', // More TN/SE
];

function pad(n: number, len = 3) {
  return String(n).padStart(len, '0');
}

function generatePhone(seed: number): string {
  const area = AREA_CODES[seed % AREA_CODES.length];
  const exchange = 200 + (seed * 7) % 800;
  const line = (seed * 13 + 1000) % 9000 + 1000;
  return `(${area}) ${exchange}-${line}`;
}

function generateEmail(first: string, last: string, seed: number): string {
  const domain = DOMAINS[seed % DOMAINS.length];
  const formats = [
    `${first.toLowerCase()}.${last.toLowerCase()}`,
    `${first.toLowerCase()}${last.toLowerCase()}`,
    `${first[0].toLowerCase()}${last.toLowerCase()}`,
    `${first.toLowerCase()}${last.toLowerCase()}${(seed % 99) + 1}`,
  ];
  return `${formats[seed % formats.length]}@${domain}`;
}

// Generate 300 unique pros
const seen = new Set<string>();

export const SEED_PROS: Pro[] = Array.from({ length: 300 }, (_, i) => {
  // Deterministic but varied — step through names with a stride to avoid repeats
  const firstIdx = (i * 7) % FIRST_NAMES.length;
  const lastIdx  = (i * 11 + 3) % LAST_NAMES.length;

  let first = FIRST_NAMES[firstIdx];
  let last  = LAST_NAMES[lastIdx];

  // Ensure unique full name by appending index if needed
  let fullName = `${first} ${last}`;
  if (seen.has(fullName)) {
    last = LAST_NAMES[(lastIdx + i) % LAST_NAMES.length];
    fullName = `${first} ${last}`;
  }
  seen.add(fullName);

  return {
    id: `pro-${pad(i + 1, 4)}`,
    name: fullName,
    email: generateEmail(first, last, i),
    phone: generatePhone(i),
  };
});
