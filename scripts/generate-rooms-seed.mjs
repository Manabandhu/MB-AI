// scripts/generate-rooms-seed.mjs
import fs from 'node:fs';
import path from 'node:path';

const OWNERS = [
  '59ced9fd-0fa7-45d0-97ec-1f9963df2a06',
  '09738cc8-7e22-49e4-9c2b-be1040fe6438',
  'b2e63b49-91df-49e0-bf8f-f32822f883a5',
  '9d272069-8055-4cc7-b51b-05c0ac0ffbf8',
  'b0083327-cca5-46c5-b6b1-304c698ea3c1',
];

const AMENITY_SETS = [
  ['pure_veg', 'private_bath', 'wifi_high_speed', 'in_unit_laundry', 'free_parking', 'near_indian_grocery'],
  ['veg_friendly', 'study_desk', 'wifi_high_speed', 'in_unit_laundry', 'campus_shuttle'],
  ['private_bath', 'furnished_bed', 'study_desk', 'wifi_high_speed', 'free_parking', 'patel_bros_nearby'],
  ['veg_friendly', 'furnished_bed', 'wifi_high_speed', 'no_smoking', 'quiet_hours'],
  ['pure_veg', 'private_bath', 'furnished_bed', 'free_parking', 'in_unit_laundry', 'quiet_hours'],
  ['private_bath', 'study_desk', 'wifi_high_speed', 'campus_shuttle', 'near_indian_grocery'],
];

const ROOM_TYPES = [
  'Private Room',
  'Private Room with Attached Bath',
  'Master Bedroom',
  'Shared 2B2B Room',
  '1BHK Studio',
  'Private Room in 3B3B Townhouse',
];

const LEASE_TERMS = ['FLEXIBLE', 'SIX_MONTHS', 'ONE_YEAR', 'MONTH_TO_MONTH'];
const DIETS = ['PURE_VEG', 'VEG_PREFERRED', 'ANY', 'ANY'];
const GENDERS = ['ANY', 'MALE_ONLY', 'FEMALE_ONLY', 'ANY'];
const BATHS = ['PRIVATE_ATTACHED', 'PRIVATE_DEDICATED', 'SHARED'];

// Helper to jitter coordinates slightly
function jitter(val, scale = 0.02) {
  return +(val + (Math.random() - 0.5) * scale).toFixed(6);
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 1. Dallas Metropolitan (50 records)
const dallasLocations = [
  { city: 'Irving', area: 'Las Colinas · MacArthur Blvd', lat: 32.8968, lng: -96.9427, county: 'Dallas County', landmarks: 'Walk to Toyota Music Factory, DART Orange Line, Patel Brothers 5m' },
  { city: 'Irving', area: 'Valley Ranch · Cimarron Trail', lat: 32.9350, lng: -96.9600, county: 'Dallas County', landmarks: 'Canal walk, India Bazaar 3 mins, close to 635 & PGBT' },
  { city: 'Plano', area: 'Legacy West · Windrose Ave', lat: 33.0780, lng: -96.8240, county: 'Collin County', landmarks: 'Walk to Toyota HQ, JPMorgan, Liberty Mutual, luxury shops' },
  { city: 'Plano', area: 'Granite Park & Parkwood Blvd', lat: 33.0850, lng: -96.8200, county: 'Collin County', landmarks: 'Close to Preston Rd, Patel Brothers, Swadeshi Plaza' },
  { city: 'Plano', area: 'West Plano · Coit & Spring Creek', lat: 33.0560, lng: -96.7690, county: 'Collin County', landmarks: 'Prime Desi corridor, Spices of India, peaceful family area' },
  { city: 'Frisco', area: 'The Star & Dallas Cowboys Way', lat: 33.1110, lng: -96.8280, county: 'Collin County', landmarks: 'Modern high-end community, Ford Center, Warren Pkwy tech hub' },
  { city: 'Frisco', area: 'Stonebriar & Preston Rd', lat: 33.1000, lng: -96.8080, county: 'Collin County', landmarks: 'Near Stonebriar Centre, India Bazaar Frisco, SRT tollway' },
  { city: 'Frisco', area: 'Main St & Teel Pkwy', lat: 33.1500, lng: -96.8500, county: 'Collin County', landmarks: 'New luxury apartments, PGA Parkway, peaceful community' },
  { city: 'Richardson', area: 'UT Dallas Campus · Waterview Pkwy', lat: 32.9857, lng: -96.7502, county: 'Dallas County', landmarks: 'Walk to UTD Student Union, Comet Cruiser shuttle stop right outside' },
  { city: 'Richardson', area: 'CityLine & Telecom Corridor', lat: 32.9980, lng: -96.7050, county: 'Dallas County', landmarks: 'CityLine DART station, State Farm & Raytheon campus' },
  { city: 'Dallas', area: 'Downtown & Arts District', lat: 32.7876, lng: -96.8000, county: 'Dallas County', landmarks: 'Klyde Warren Park, DART rail, AT&T HQ walking distance' },
  { city: 'Dallas', area: 'Uptown & McKinney Ave', lat: 32.7990, lng: -96.8020, county: 'Dallas County', landmarks: 'Trolley route, Katy Trail, premier walkable dining & tech' },
  { city: 'Dallas', area: 'Medical District & Stemmons', lat: 32.8150, lng: -96.8370, county: 'Dallas County', landmarks: 'UT Southwestern, Parkland Hospital, DART Medical Center station' },
  { city: 'Dallas', area: 'North Dallas · Preston Hollow', lat: 32.8870, lng: -96.8010, county: 'Dallas County', landmarks: 'Safe upscale gated community, central access to 75 and tollway' },
  { city: 'Carrollton', area: 'Old Denton Rd & Trinity Mills', lat: 32.9538, lng: -96.8903, county: 'Denton County', landmarks: 'Asian & Indian food hub, H-Mart plaza, Carrollton DART' },
  { city: 'McKinney', area: 'Craig Ranch & Custer Rd', lat: 33.1400, lng: -96.7300, county: 'Collin County', landmarks: 'Quiet single family home, community pool, cricket grounds' },
  { city: 'Fort Worth', area: 'Downtown & Sundance Square', lat: 32.7555, lng: -97.3308, county: 'Tarrant County', landmarks: 'Trinity Trails, commuter rail TEXRail to DFW Airport' },
  { city: 'Arlington', area: 'UT Arlington Campus & Cooper St', lat: 32.7299, lng: -97.1147, county: 'Tarrant County', landmarks: 'Walk to UTA engineering building, Maverick shuttle, Desi grocery' },
  { city: 'Coppell', area: 'MacArthur & Sandy Lake Rd', lat: 32.9710, lng: -96.9800, county: 'Dallas County', landmarks: 'Award winning school zone, 10 mins to DFW Airport' },
  { city: 'Garland', area: 'Firewheel Town Center', lat: 32.9520, lng: -96.6120, county: 'Dallas County', landmarks: 'Near George Bush Turnpike, outdoor shopping mall, quiet neighborhood' },
];

// 2. Ohio (50 records)
const ohioLocations = [
  { city: 'Columbus', area: 'Dublin · Tuttle Crossing & Avery Rd', lat: 40.0992, lng: -83.1141, county: 'Franklin County', landmarks: 'Massive Indian community, Patel Brothers, Swagat, Cardinal Health HQ' },
  { city: 'Columbus', area: 'Dublin · Bridge Park', lat: 40.1080, lng: -83.1100, county: 'Franklin County', landmarks: 'Scioto River pedestrian bridge, rooftop restaurants, high-speed fiber' },
  { city: 'Columbus', area: 'Polaris & Gemini Pkwy', lat: 40.1500, lng: -82.9800, county: 'Delaware County', landmarks: 'Near JPMorgan Chase Polaris corporate center, Polaris Fashion Place' },
  { city: 'Columbus', area: 'Ohio State University (OSU) Campus', lat: 40.0000, lng: -83.0150, county: 'Franklin County', landmarks: 'Walk to High Street, CABS campus bus loop, OSU Medical Center' },
  { city: 'Columbus', area: 'Short North Arts District', lat: 39.9800, lng: -83.0040, county: 'Franklin County', landmarks: 'Trendy cafes, art galleries, 5 mins to Downtown Columbus' },
  { city: 'Columbus', area: 'Upper Arlington & Lane Ave', lat: 40.0150, lng: -83.0600, county: 'Franklin County', landmarks: 'Peaceful quiet neighborhood, minutes from OSU west campus' },
  { city: 'Columbus', area: 'Hilliard & Cemetery Rd', lat: 40.0330, lng: -83.1400, county: 'Franklin County', landmarks: 'Spacious suburban townhouse, close to I-270 and Indian groceries' },
  { city: 'Columbus', area: 'Easton Town Center', lat: 40.0500, lng: -82.9180, county: 'Franklin County', landmarks: 'Premier shopping district, Abbott & Alliance Data corporate corridor' },
  { city: 'Cleveland', area: 'University Circle · Case Western', lat: 41.5043, lng: -81.6084, county: 'Cuyahoga County', landmarks: 'Walk to Case Western Reserve University, Cleveland Clinic main campus' },
  { city: 'Cleveland', area: 'Downtown Cleveland & Warehouse District', lat: 41.5000, lng: -81.6950, county: 'Cuyahoga County', landmarks: 'Lake Erie views, RTA health line, walkable to financial center' },
  { city: 'Cleveland', area: 'Beachwood & Chagrin Blvd', lat: 41.4630, lng: -81.5080, county: 'Cuyahoga County', landmarks: 'High-end suburb, Patel Brothers nearby, safe residential community' },
  { city: 'Cleveland', area: 'Westlake & Crocker Park', lat: 41.4550, lng: -81.9300, county: 'Cuyahoga County', landmarks: 'Open-air lifestyle center, lakefront parks, easy I-90 access' },
  { city: 'Cincinnati', area: 'Mason & Kings Mills', lat: 39.3601, lng: -84.3099, county: 'Warren County', landmarks: 'Top Indian diaspora hub in OH, Procter & Gamble Mason Business Center, Cincy Temple' },
  { city: 'Cincinnati', area: 'Blue Ash & Reed Hartman Hwy', lat: 39.2323, lng: -84.3783, county: 'Hamilton County', landmarks: 'Summit Park, corporate tech offices, Indian dining corridor' },
  { city: 'Cincinnati', area: 'Downtown Cincinnati & The Banks', lat: 39.1000, lng: -84.5120, county: 'Hamilton County', landmarks: 'Ohio River views, streetcar line, walkable to P&G Downtown HQ' },
  { city: 'Cincinnati', area: 'Clifton · University of Cincinnati (UC)', lat: 39.1320, lng: -84.5150, county: 'Hamilton County', landmarks: 'Walk to UC main campus, Ludlow Avenue cafes, UC shuttle' },
  { city: 'Dayton', area: 'Beavercreek & Wright State Univ', lat: 39.7750, lng: -84.0600, county: 'Greene County', landmarks: 'Wright-Patterson AFB contractor hub, WSU shuttle, Indian stores' },
  { city: 'Akron', area: 'Fairlawn & West Market St', lat: 41.1270, lng: -81.6150, county: 'Summit County', landmarks: 'Peaceful shopping corridor, University of Akron accessible' },
  { city: 'Toledo', area: 'Perrysburg & Levis Commons', lat: 41.5300, lng: -83.6300, county: 'Wood County', landmarks: 'Safe master-planned community, Owens Illinois & First Solar' },
];

// 3. Other Major Cities (200 records)
const otherCities = [
  // Austin, TX (40)
  { city: 'Austin', state: 'TX', area: 'Domain Northside · Walk to Apple', lat: 30.4014, lng: -97.7247, county: 'Travis County', landmarks: 'Walk to Apple Riata, Domain shops, IBM campus' },
  { city: 'Austin', state: 'TX', area: 'West Campus · 5 mins to UT Austin', lat: 30.2884, lng: -97.7425, county: 'Travis County', landmarks: 'UT Austin shuttle, Target West Campus, Guadalupe strip' },
  { city: 'Austin', state: 'TX', area: 'Round Rock · Brushy Creek', lat: 30.5083, lng: -97.6789, county: 'Williamson County', landmarks: 'Near Dell World HQ, Patel Brothers Round Rock, Man Pasand' },
  { city: 'Austin', state: 'TX', area: 'Cedar Park · Lakeline Station', lat: 30.5052, lng: -97.8203, county: 'Williamson County', landmarks: 'MetroRail Red Line, HEB Plus, H-Mart, peaceful neighborhood' },
  { city: 'Austin', state: 'TX', area: 'Downtown / Seaholm District', lat: 30.2672, lng: -97.7501, county: 'Travis County', landmarks: 'Walk to Google Austin, Lady Bird Lake trails, Trader Joes' },
  { city: 'Austin', state: 'TX', area: 'South Congress & Riverside', lat: 30.2450, lng: -97.7500, county: 'Travis County', landmarks: 'Minutes to Downtown, vibrant food trucks, bus line 801' },
  { city: 'Austin', state: 'TX', area: 'Mueller Community', lat: 30.2980, lng: -97.7050, county: 'Travis County', landmarks: 'Lake Park, Dell Childrens, sustainable master planned community' },

  // Houston, TX (30)
  { city: 'Houston', state: 'TX', area: 'Sugar Land · First Colony', lat: 29.5984, lng: -95.6225, county: 'Fort Bend County', landmarks: 'Largest Indian diaspora in TX, BAPS Shri Swaminarayan Mandir, Sweetwater' },
  { city: 'Houston', state: 'TX', area: 'Katy · Cinco Ranch', lat: 29.7858, lng: -95.8245, county: 'Fort Bend County', landmarks: 'Cinco Ranch trails, energy corridor access, Asian Town Katy' },
  { city: 'Houston', state: 'TX', area: 'Texas Medical Center (TMC)', lat: 29.7100, lng: -95.3980, county: 'Harris County', landmarks: 'Walk to MD Anderson, Baylor College of Medicine, METRORail' },
  { city: 'Houston', state: 'TX', area: 'Galleria / Uptown', lat: 29.7480, lng: -95.4600, county: 'Harris County', landmarks: 'Luxury highrises, Memorial Park, Indian restaurants on Hillcroft' },
  { city: 'Houston', state: 'TX', area: 'Energy Corridor & Memorial', lat: 29.7820, lng: -95.6350, county: 'Harris County', landmarks: 'BP, Shell, ConocoPhillips corporate campuses, Terry Hershey Park' },

  // Bay Area, CA (30)
  { city: 'Sunnyvale', state: 'CA', area: 'Downtown Sunnyvale & Murphy Ave', lat: 37.3688, lng: -122.0363, county: 'Santa Clara County', landmarks: 'Caltrain station, Apple/LinkedIn shuttle stops, Madras Cafe' },
  { city: 'San Jose', state: 'CA', area: 'North San Jose · Brokaw Rd', lat: 37.3800, lng: -121.9000, county: 'Santa Clara County', landmarks: 'VTA light rail, Cisco/PayPal campuses, Mitsuwa & Indian grocery' },
  { city: 'Santa Clara', state: 'CA', area: 'Near Levi Stadium & Great America', lat: 37.3541, lng: -121.9552, county: 'Santa Clara County', landmarks: 'Nvidia HQ, Applied Materials, Santa Clara University shuttle' },
  { city: 'Fremont', state: 'CA', area: 'Warm Springs & Mission San Jose', lat: 37.5485, lng: -121.9886, county: 'Alameda County', landmarks: 'Warm Springs BART, Tesla factory, huge Telugu community, Little India' },
  { city: 'Cupertino', state: 'CA', area: 'De Anza Blvd · Near Apple Park', lat: 37.3230, lng: -122.0322, county: 'Santa Clara County', landmarks: 'Apple Infinite Loop, De Anza College, high-speed fiber' },
  { city: 'Mountain View', state: 'CA', area: 'Castro St & San Antonio Center', lat: 37.3861, lng: -122.0839, county: 'Santa Clara County', landmarks: 'Walk to Googleplex shuttle, Caltrain, Mountain View downtown' },

  // Seattle, WA (25)
  { city: 'Bellevue', state: 'WA', area: 'Downtown Bellevue & Crossroads', lat: 47.6101, lng: -122.2015, county: 'King County', landmarks: 'Crossroads Mall (Indian bazaar), Amazon Bellevue towers, light rail' },
  { city: 'Redmond', state: 'WA', area: 'Overlake · Near Microsoft Campus', lat: 47.6740, lng: -122.1215, county: 'King County', landmarks: 'Walk to Microsoft Studios, B-Line rapid ride, Mayuri Foods' },
  { city: 'Seattle', state: 'WA', area: 'South Lake Union · Amazon Campus', lat: 47.6200, lng: -122.3380, county: 'King County', landmarks: 'Walk to Amazon Doppler, SLU streetcar, Lake Union parks' },
  { city: 'Kirkland', state: 'WA', area: 'Totem Lake & Downtown Kirkland', lat: 47.6769, lng: -122.2060, county: 'King County', landmarks: 'Google Kirkland campus, Lake Washington beaches, Evergreen Hospital' },

  // New York / New Jersey (25)
  { city: 'Jersey City', state: 'NJ', area: 'Journal Square · PATH Station', lat: 40.7282, lng: -74.0776, county: 'Hudson County', landmarks: '12 min PATH to Manhattan WTC / 33rd St, India Square Newark Ave' },
  { city: 'Jersey City', state: 'NJ', area: 'Newport & Exchange Place', lat: 40.7270, lng: -74.0350, county: 'Hudson County', landmarks: 'Hudson River waterfront, direct PATH, luxury doorman highrise' },
  { city: 'Edison', state: 'NJ', area: 'Oak Tree Road & Metropark', lat: 40.5187, lng: -74.3649, county: 'Middlesex County', landmarks: 'World famous Oak Tree Rd shopping, Metropark Amtrak/NJ Transit train' },
  { city: 'New York', state: 'NY', area: 'Manhattan Midtown & Flatiron', lat: 40.7580, lng: -73.9855, county: 'New York County', landmarks: 'Central subway access, Times Square, Bryant Park, tech hubs' },

  // Chicago, IL (20)
  { city: 'Naperville', state: 'IL', area: 'Downtown Naperville & Route 59', lat: 41.7508, lng: -88.1535, county: 'DuPage County', landmarks: 'Metra train to Chicago Loop, Patel Brothers Naperville, riverwalk' },
  { city: 'Schaumburg', state: 'IL', area: 'Woodfield Mall Corridor', lat: 42.0334, lng: -88.0834, county: 'Cook County', landmarks: 'Motorola Solutions corridor, Swagat Plaza, I-90 express access' },
  { city: 'Chicago', state: 'IL', area: 'West Loop & Fulton Market', lat: 41.8819, lng: -87.6400, county: 'Cook County', landmarks: 'Google Chicago office, Morgan CTA station, restaurant row' },
  { city: 'Chicago', state: 'IL', area: 'University Village · UIC Campus', lat: 41.8680, lng: -87.6520, county: 'Cook County', landmarks: 'Walk to UIC engineering & medical campus, Blue Line CTA' },

  // Atlanta, GA (15)
  { city: 'Alpharetta', state: 'GA', area: 'Avalon & Windward Pkwy', lat: 34.0754, lng: -84.2941, county: 'Fulton County', landmarks: 'Tech corridor, Patel Brothers Alpharetta, greenway trails' },
  { city: 'Atlanta', state: 'GA', area: 'Midtown · Georgia Tech Tech Square', lat: 33.7756, lng: -84.3963, county: 'Fulton County', landmarks: 'Walk to GA Tech campus, MARTA Midtown station, NCR & Google' },
  { city: 'Duluth', state: 'GA', area: 'Gwinnett Place & Pleasant Hill', lat: 34.0029, lng: -84.1446, county: 'Gwinnett County', landmarks: 'Huge Indian cultural hub, Sai Baba Temple, Asian food plazas' },

  // North Carolina (15)
  { city: 'Morrisville', state: 'NC', area: 'Research Triangle Park (RTP) · Davis Dr', lat: 35.8235, lng: -78.8256, county: 'Wake County', landmarks: 'Top Indian hub in NC, Cisco/Lenovo/Credit Suisse, Patel Brothers' },
  { city: 'Cary', state: 'NC', area: 'Preston & High House Rd', lat: 35.7915, lng: -78.7811, county: 'Wake County', landmarks: 'SAS Institute, Sri Venkateswara Temple, peaceful leafy suburb' },
  { city: 'Charlotte', state: 'NC', area: 'Ballantyne Corporate Park', lat: 35.0534, lng: -80.8522, county: 'Mecklenburg County', landmarks: 'South Charlotte business hub, premier gated apartments, Swadeshi' },
];

function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function generateRecords() {
  const records = [];

  // Group 1: 50 Dallas Metropolitan
  for (let i = 0; i < 50; i++) {
    const loc = dallasLocations[i % dallasLocations.length];
    const roomType = randChoice(ROOM_TYPES);
    const rent = randInt(550, 1150);
    const diet = randChoice(DIETS);
    const gender = randChoice(GENDERS);
    const bath = randChoice(BATHS);
    const lease = randChoice(LEASE_TERMS);
    const amenities = randChoice(AMENITY_SETS);
    const isStudio = roomType.includes('Studio');

    const title = `${roomType} in ${loc.city} (${loc.area.split('·')[0].trim()}) - $${rent}/mo`;
    const desc = `${isStudio ? 'Modern private studio unit' : 'Spacious furnished room'} in ${loc.city}, TX. ${loc.landmarks}. Ideal for students or working professionals. Kitchen has vegetarian cookware, fast Wi-Fi, in-unit laundry, and covered parking available. Flexible move-in.`;

    records.push({
      title,
      desc,
      price: rent,
      roomType,
      broadLocation: `${loc.area}, ${loc.city}, TX`,
      exactAddress: `${randInt(100, 9999)} ${loc.area.split('·')[0].trim()}, ${loc.city}, TX`,
      lat: jitter(loc.lat),
      lng: jitter(loc.lng),
      diet,
      gender,
      bath,
      utilitiesIncluded: Math.random() > 0.4,
      estUtilityMonthly: randInt(40, 90),
      securityDeposit: randInt(250, 600),
      leaseTerm: lease,
      isVerifiedHost: true,
      universityShuttle: loc.landmarks.includes('UT') || loc.landmarks.includes('shuttle'),
      amenities,
      stateCode: 'TX',
      county: loc.county,
    });
  }

  // Group 2: 50 Ohio
  for (let i = 0; i < 50; i++) {
    const loc = ohioLocations[i % ohioLocations.length];
    const roomType = randChoice(ROOM_TYPES);
    const rent = randInt(480, 950);
    const diet = randChoice(DIETS);
    const gender = randChoice(GENDERS);
    const bath = randChoice(BATHS);
    const lease = randChoice(LEASE_TERMS);
    const amenities = randChoice(AMENITY_SETS);
    const isStudio = roomType.includes('Studio');

    const title = `${roomType} in ${loc.city} (${loc.area.split('·')[0].trim()}) - $${rent}/mo`;
    const desc = `${isStudio ? 'Clean sunny studio apartment' : 'Comfortable private bedroom'} in ${loc.city}, OH. ${loc.landmarks}. Living with friendly Telugu/Desi professionals/students. Central heating, high-speed fiber internet, snow removal, and dedicated parking spot included.`;

    records.push({
      title,
      desc,
      price: rent,
      roomType,
      broadLocation: `${loc.area}, ${loc.city}, OH`,
      exactAddress: `${randInt(100, 9999)} ${loc.area.split('·')[0].trim()}, ${loc.city}, OH`,
      lat: jitter(loc.lat),
      lng: jitter(loc.lng),
      diet,
      gender,
      bath,
      utilitiesIncluded: Math.random() > 0.45,
      estUtilityMonthly: randInt(45, 95),
      securityDeposit: randInt(200, 500),
      leaseTerm: lease,
      isVerifiedHost: true,
      universityShuttle: loc.landmarks.includes('OSU') || loc.landmarks.includes('Case') || loc.landmarks.includes('UC'),
      amenities,
      stateCode: 'OH',
      county: loc.county,
    });
  }

  // Group 3: 200 Other Cities
  for (let i = 0; i < 200; i++) {
    const loc = otherCities[i % otherCities.length];
    const roomType = randChoice(ROOM_TYPES);
    let rentMin = 600;
    let rentMax = 1200;
    if (loc.state === 'CA' || loc.state === 'NY') {
      rentMin = 950;
      rentMax = 1650;
    } else if (loc.state === 'WA') {
      rentMin = 800;
      rentMax = 1400;
    }
    const rent = randInt(rentMin, rentMax);
    const diet = randChoice(DIETS);
    const gender = randChoice(GENDERS);
    const bath = randChoice(BATHS);
    const lease = randChoice(LEASE_TERMS);
    const amenities = randChoice(AMENITY_SETS);
    const isStudio = roomType.includes('Studio');

    const title = `${roomType} in ${loc.city}, ${loc.state} (${loc.area.split('·')[0].trim()}) - $${rent}/mo`;
    const desc = `${isStudio ? 'Prime renovated apartment' : 'Private bedroom with walk-in closet'} in ${loc.city}, ${loc.state}. ${loc.landmarks}. Quiet study atmosphere, close to Indian grocery stores and tech shuttle stops. Washer/dryer in unit and high-speed Wi-Fi.`;

    records.push({
      title,
      desc,
      price: rent,
      roomType,
      broadLocation: `${loc.area}, ${loc.city}, ${loc.state}`,
      exactAddress: `${randInt(100, 9999)} ${loc.area.split('·')[0].trim()}, ${loc.city}, ${loc.state}`,
      lat: jitter(loc.lat),
      lng: jitter(loc.lng),
      diet,
      gender,
      bath,
      utilitiesIncluded: Math.random() > 0.5,
      estUtilityMonthly: randInt(50, 110),
      securityDeposit: randInt(300, 750),
      leaseTerm: lease,
      isVerifiedHost: true,
      universityShuttle: loc.landmarks.includes('UT') || loc.landmarks.includes('campus') || loc.landmarks.includes('shuttle'),
      amenities,
      stateCode: loc.state,
      county: loc.county,
    });
  }

  return records;
}

const records = generateRecords();
console.log(`Generated ${records.length} records.`);

// Group into batches of 25 for executing
const batchSize = 25;
const batches = [];
for (let i = 0; i < records.length; i += batchSize) {
  batches.push(records.slice(i, i + batchSize));
}

const outDir = path.resolve('scratch/sql_batches');
fs.mkdirSync(outDir, { recursive: true });

batches.forEach((batch, batchIdx) => {
  const values = batch.map((r, idx) => {
    const owner = OWNERS[(batchIdx * batchSize + idx) % OWNERS.length];
    const amArray = `ARRAY[${r.amenities.map(a => `'${a}'`).join(',')}]::text[]`;
    return `(
      gen_random_uuid(),
      '${owner}',
      ${escapeSql(r.title)},
      ${escapeSql(r.desc)},
      ${r.price},
      ${escapeSql(r.roomType)},
      'active',
      ${escapeSql(r.broadLocation)},
      ${escapeSql(r.exactAddress)},
      ${r.lat},
      ${r.lng},
      '${r.diet}',
      '${r.gender}',
      '${r.bath}',
      ${r.utilitiesIncluded},
      ${r.estUtilityMonthly},
      ${r.securityDeposit},
      '${r.leaseTerm}',
      ${r.isVerifiedHost},
      ${r.universityShuttle},
      ${amArray},
      '${r.stateCode}',
      ${escapeSql(r.county)},
      now() - interval '${Math.floor(Math.random() * 25)} days',
      now()
    )`;
  }).join(',\n');

  const sql = `INSERT INTO room_listings (
    id, owner_id, title, description, price, room_type, status,
    broad_location, exact_address, latitude, longitude,
    dietary_preference, gender_preference, bathroom_type,
    utilities_included, est_utility_monthly, security_deposit,
    lease_term, is_verified_host, university_shuttle_accessible,
    amenity_codes, state_code, county, created_at, updated_at
  ) VALUES\n${values};`;

  fs.writeFileSync(path.join(outDir, `batch_${String(batchIdx).padStart(2, '0')}.sql`), sql, 'utf8');
});

console.log(`Saved ${batches.length} batch SQL files to scratch/sql_batches`);
