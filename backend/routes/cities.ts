import fs from 'fs';
import path from 'path';
import express from 'express';
import { courierGet, courierPost } from '../lib/courier';
import { logger } from '../lib/logger';

const router = express.Router();

// Helper to create slug from name
const toSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Load Pakistan cities from JSON file (works when running from dist: __dirname is dist/routes, so ../../data is backend/data)
const loadPakistanCities = (): Array<{ id: string; name: string; country: string }> => {
  try {
    const filePath = path.join(__dirname, '../../data/pakistan-cities.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error loading Pakistan cities:', error);
    return [];
  }
};

// Global cities (non-Pakistan)
const globalCities = [
  // United States
  { id: "new-york", name: "New York", country: "United States" },
  { id: "los-angeles", name: "Los Angeles", country: "United States" },
  { id: "chicago", name: "Chicago", country: "United States" },
  { id: "houston", name: "Houston", country: "United States" },
  { id: "phoenix", name: "Phoenix", country: "United States" },
  { id: "philadelphia", name: "Philadelphia", country: "United States" },
  { id: "san-antonio", name: "San Antonio", country: "United States" },
  { id: "san-diego", name: "San Diego", country: "United States" },
  { id: "dallas", name: "Dallas", country: "United States" },
  { id: "san-jose", name: "San Jose", country: "United States" },
  { id: "austin", name: "Austin", country: "United States" },
  { id: "jacksonville", name: "Jacksonville", country: "United States" },
  { id: "fort-worth", name: "Fort Worth", country: "United States" },
  { id: "columbus", name: "Columbus", country: "United States" },
  { id: "charlotte", name: "Charlotte", country: "United States" },
  { id: "san-francisco", name: "San Francisco", country: "United States" },
  { id: "indianapolis", name: "Indianapolis", country: "United States" },
  { id: "seattle", name: "Seattle", country: "United States" },
  { id: "denver", name: "Denver", country: "United States" },
  { id: "washington", name: "Washington", country: "United States" },
  { id: "boston", name: "Boston", country: "United States" },
  { id: "el-paso", name: "El Paso", country: "United States" },
  { id: "detroit", name: "Detroit", country: "United States" },
  { id: "nashville", name: "Nashville", country: "United States" },
  { id: "portland", name: "Portland", country: "United States" },
  { id: "memphis", name: "Memphis", country: "United States" },
  { id: "oklahoma-city", name: "Oklahoma City", country: "United States" },
  { id: "las-vegas", name: "Las Vegas", country: "United States" },
  { id: "louisville", name: "Louisville", country: "United States" },
  { id: "baltimore", name: "Baltimore", country: "United States" },
  { id: "milwaukee", name: "Milwaukee", country: "United States" },
  { id: "albuquerque", name: "Albuquerque", country: "United States" },
  { id: "tucson", name: "Tucson", country: "United States" },
  { id: "fresno", name: "Fresno", country: "United States" },
  { id: "mesa", name: "Mesa", country: "United States" },
  { id: "sacramento", name: "Sacramento", country: "United States" },
  { id: "atlanta", name: "Atlanta", country: "United States" },
  { id: "kansas-city", name: "Kansas City", country: "United States" },
  { id: "colorado-springs", name: "Colorado Springs", country: "United States" },
  { id: "miami", name: "Miami", country: "United States" },
  { id: "raleigh", name: "Raleigh", country: "United States" },
  { id: "omaha", name: "Omaha", country: "United States" },
  { id: "long-beach", name: "Long Beach", country: "United States" },
  { id: "virginia-beach", name: "Virginia Beach", country: "United States" },
  { id: "oakland", name: "Oakland", country: "United States" },
  { id: "minneapolis", name: "Minneapolis", country: "United States" },
  { id: "tulsa", name: "Tulsa", country: "United States" },
  { id: "arlington", name: "Arlington", country: "United States" },
  { id: "tampa", name: "Tampa", country: "United States" },
  { id: "new-orleans", name: "New Orleans", country: "United States" },
  { id: "wichita", name: "Wichita", country: "United States" },
  { id: "cleveland", name: "Cleveland", country: "United States" },
  { id: "bakersfield", name: "Bakersfield", country: "United States" },
  
  // United Kingdom
  { id: "london", name: "London", country: "United Kingdom" },
  { id: "birmingham", name: "Birmingham", country: "United Kingdom" },
  { id: "manchester", name: "Manchester", country: "United Kingdom" },
  { id: "glasgow", name: "Glasgow", country: "United Kingdom" },
  { id: "liverpool", name: "Liverpool", country: "United Kingdom" },
  { id: "leeds", name: "Leeds", country: "United Kingdom" },
  { id: "sheffield", name: "Sheffield", country: "United Kingdom" },
  { id: "edinburgh", name: "Edinburgh", country: "United Kingdom" },
  { id: "bristol", name: "Bristol", country: "United Kingdom" },
  { id: "cardiff", name: "Cardiff", country: "United Kingdom" },
  { id: "leicester", name: "Leicester", country: "United Kingdom" },
  { id: "coventry", name: "Coventry", country: "United Kingdom" },
  { id: "bradford", name: "Bradford", country: "United Kingdom" },
  { id: "belfast", name: "Belfast", country: "United Kingdom" },
  { id: "nottingham", name: "Nottingham", country: "United Kingdom" },
  { id: "kingston-upon-hull", name: "Kingston upon Hull", country: "United Kingdom" },
  { id: "newcastle-upon-tyne", name: "Newcastle upon Tyne", country: "United Kingdom" },
  { id: "stoke-on-trent", name: "Stoke-on-Trent", country: "United Kingdom" },
  { id: "southampton", name: "Southampton", country: "United Kingdom" },
  { id: "derby", name: "Derby", country: "United Kingdom" },
  { id: "portsmouth", name: "Portsmouth", country: "United Kingdom" },
  { id: "brighton", name: "Brighton", country: "United Kingdom" },
  { id: "plymouth", name: "Plymouth", country: "United Kingdom" },
  { id: "northampton", name: "Northampton", country: "United Kingdom" },
  { id: "reading", name: "Reading", country: "United Kingdom" },
  { id: "luton", name: "Luton", country: "United Kingdom" },
  { id: "wolverhampton", name: "Wolverhampton", country: "United Kingdom" },
  { id: "bolton", name: "Bolton", country: "United Kingdom" },
  { id: "bournemouth", name: "Bournemouth", country: "United Kingdom" },
  { id: "norwich", name: "Norwich", country: "United Kingdom" },
  { id: "swindon", name: "Swindon", country: "United Kingdom" },
  { id: "swansea", name: "Swansea", country: "United Kingdom" },
  { id: "southend-on-sea", name: "Southend-on-Sea", country: "United Kingdom" },
  { id: "middlesbrough", name: "Middlesbrough", country: "United Kingdom" },
  { id: "sunderland", name: "Sunderland", country: "United Kingdom" },
  { id: "huddersfield", name: "Huddersfield", country: "United Kingdom" },
  { id: "poole", name: "Poole", country: "United Kingdom" },
  { id: "york", name: "York", country: "United Kingdom" },
  { id: "warrington", name: "Warrington", country: "United Kingdom" },
  { id: "peterborough", name: "Peterborough", country: "United Kingdom" },
  { id: "stockport", name: "Stockport", country: "United Kingdom" },
  { id: "slough", name: "Slough", country: "United Kingdom" },
  { id: "gloucester", name: "Gloucester", country: "United Kingdom" },
  { id: "watford", name: "Watford", country: "United Kingdom" },
  { id: "rotherham", name: "Rotherham", country: "United Kingdom" },
  { id: "cambridge", name: "Cambridge", country: "United Kingdom" },
  { id: "west-bromwich", name: "West Bromwich", country: "United Kingdom" },
  { id: "ipswich", name: "Ipswich", country: "United Kingdom" },
  { id: "blackpool", name: "Blackpool", country: "United Kingdom" },
  { id: "oxford", name: "Oxford", country: "United Kingdom" },
  { id: "oldham", name: "Oldham", country: "United Kingdom" },
  { id: "exeter", name: "Exeter", country: "United Kingdom" },
  { id: "cheltenham", name: "Cheltenham", country: "United Kingdom" },
  
  // Canada
  { id: "toronto", name: "Toronto", country: "Canada" },
  { id: "montreal", name: "Montreal", country: "Canada" },
  { id: "vancouver", name: "Vancouver", country: "Canada" },
  { id: "calgary", name: "Calgary", country: "Canada" },
  { id: "edmonton", name: "Edmonton", country: "Canada" },
  { id: "ottawa", name: "Ottawa", country: "Canada" },
  { id: "winnipeg", name: "Winnipeg", country: "Canada" },
  { id: "quebec-city", name: "Quebec City", country: "Canada" },
  { id: "hamilton", name: "Hamilton", country: "Canada" },
  { id: "kitchener", name: "Kitchener", country: "Canada" },
  { id: "london-ca", name: "London", country: "Canada" },
  { id: "victoria", name: "Victoria", country: "Canada" },
  { id: "halifax", name: "Halifax", country: "Canada" },
  { id: "oshawa", name: "Oshawa", country: "Canada" },
  { id: "windsor", name: "Windsor", country: "Canada" },
  { id: "saskatoon", name: "Saskatoon", country: "Canada" },
  { id: "st-catharines", name: "St. Catharines", country: "Canada" },
  { id: "regina", name: "Regina", country: "Canada" },
  { id: "sherbrooke", name: "Sherbrooke", country: "Canada" },
  { id: "st-johns", name: "St. John's", country: "Canada" },
  { id: "barrie", name: "Barrie", country: "Canada" },
  { id: "kelowna", name: "Kelowna", country: "Canada" },
  { id: "abbotsford", name: "Abbotsford", country: "Canada" },
  { id: "kingston", name: "Kingston", country: "Canada" },
  { id: "sudbury", name: "Sudbury", country: "Canada" },
  { id: "trois-rivieres", name: "Trois-Rivières", country: "Canada" },
  { id: "guelph", name: "Guelph", country: "Canada" },
  { id: "cambridge-ca", name: "Cambridge", country: "Canada" },
  { id: "whitby", name: "Whitby", country: "Canada" },
  { id: "coquitlam", name: "Coquitlam", country: "Canada" },
  { id: "saanich", name: "Saanich", country: "Canada" },
  { id: "burlington", name: "Burlington", country: "Canada" },
  { id: "burnaby", name: "Burnaby", country: "Canada" },
  { id: "richmond", name: "Richmond", country: "Canada" },
  { id: "richmond-hill", name: "Richmond Hill", country: "Canada" },
  { id: "oakville", name: "Oakville", country: "Canada" },
  { id: "markham", name: "Markham", country: "Canada" },
  { id: "vaughan", name: "Vaughan", country: "Canada" },
  { id: "gatineau", name: "Gatineau", country: "Canada" },
  { id: "longueuil", name: "Longueuil", country: "Canada" },
  { id: "laval", name: "Laval", country: "Canada" },
  { id: "north-vancouver", name: "North Vancouver", country: "Canada" },
  { id: "west-vancouver", name: "West Vancouver", country: "Canada" },
  { id: "thunder-bay", name: "Thunder Bay", country: "Canada" },
  { id: "st-albert", name: "St. Albert", country: "Canada" },
  { id: "moncton", name: "Moncton", country: "Canada" },
  { id: "red-deer", name: "Red Deer", country: "Canada" },
  { id: "lethbridge", name: "Lethbridge", country: "Canada" },
  { id: "kamloops", name: "Kamloops", country: "Canada" },
  { id: "nanaimo", name: "Nanaimo", country: "Canada" },
  { id: "fredericton", name: "Fredericton", country: "Canada" },
  { id: "medicine-hat", name: "Medicine Hat", country: "Canada" },
  
  // Australia
  { id: "sydney", name: "Sydney", country: "Australia" },
  { id: "melbourne", name: "Melbourne", country: "Australia" },
  { id: "brisbane", name: "Brisbane", country: "Australia" },
  { id: "perth", name: "Perth", country: "Australia" },
  { id: "adelaide", name: "Adelaide", country: "Australia" },
  { id: "gold-coast", name: "Gold Coast", country: "Australia" },
  { id: "newcastle-au", name: "Newcastle", country: "Australia" },
  { id: "canberra", name: "Canberra", country: "Australia" },
  { id: "sunshine-coast", name: "Sunshine Coast", country: "Australia" },
  { id: "wollongong", name: "Wollongong", country: "Australia" },
  { id: "hobart", name: "Hobart", country: "Australia" },
  { id: "geelong", name: "Geelong", country: "Australia" },
  { id: "townsville", name: "Townsville", country: "Australia" },
  { id: "cairns", name: "Cairns", country: "Australia" },
  { id: "darwin", name: "Darwin", country: "Australia" },
  { id: "toowoomba", name: "Toowoomba", country: "Australia" },
  { id: "ballarat", name: "Ballarat", country: "Australia" },
  { id: "bendigo", name: "Bendigo", country: "Australia" },
  { id: "albury", name: "Albury", country: "Australia" },
  { id: "launceston", name: "Launceston", country: "Australia" },
  { id: "mackay", name: "Mackay", country: "Australia" },
  { id: "rockhampton", name: "Rockhampton", country: "Australia" },
  { id: "bunbury", name: "Bunbury", country: "Australia" },
  { id: "bundaberg", name: "Bundaberg", country: "Australia" },
  { id: "coffs-harbour", name: "Coffs Harbour", country: "Australia" },
  { id: "wagga-wagga", name: "Wagga Wagga", country: "Australia" },
  { id: "hervey-bay", name: "Hervey Bay", country: "Australia" },
  { id: "mildura", name: "Mildura", country: "Australia" },
  { id: "shepparton", name: "Shepparton", country: "Australia" },
  { id: "port-macquarie", name: "Port Macquarie", country: "Australia" },
  { id: "orange", name: "Orange", country: "Australia" },
  { id: "tamworth", name: "Tamworth", country: "Australia" },
  { id: "dubbo", name: "Dubbo", country: "Australia" },
  { id: "geraldton", name: "Geraldton", country: "Australia" },
  { id: "kalgoorlie", name: "Kalgoorlie", country: "Australia" },
  { id: "warrnambool", name: "Warrnambool", country: "Australia" },
  { id: "gladstone", name: "Gladstone", country: "Australia" },
  { id: "alice-springs", name: "Alice Springs", country: "Australia" },
  { id: "mount-gambier", name: "Mount Gambier", country: "Australia" },
  { id: "lismore", name: "Lismore", country: "Australia" },
  { id: "devonport", name: "Devonport", country: "Australia" },
  { id: "traralgon", name: "Traralgon", country: "Australia" },
  { id: "bathurst", name: "Bathurst", country: "Australia" },
  { id: "nowra", name: "Nowra", country: "Australia" },
  { id: "warwick", name: "Warwick", country: "Australia" },
  { id: "broken-hill", name: "Broken Hill", country: "Australia" },
  { id: "sunbury", name: "Sunbury", country: "Australia" },
  { id: "goulburn", name: "Goulburn", country: "Australia" },
  { id: "horsham", name: "Horsham", country: "Australia" },
  { id: "griffith", name: "Griffith", country: "Australia" },
  { id: "st-arnaud", name: "St Arnaud", country: "Australia" },
  
  // UAE
  { id: "dubai", name: "Dubai", country: "UAE" },
  { id: "abu-dhabi", name: "Abu Dhabi", country: "UAE" },
  { id: "sharjah", name: "Sharjah", country: "UAE" },
  { id: "al-ain", name: "Al Ain", country: "UAE" },
  { id: "ajman", name: "Ajman", country: "UAE" },
  { id: "ras-al-khaimah", name: "Ras Al Khaimah", country: "UAE" },
  { id: "fujairah", name: "Fujairah", country: "UAE" },
  { id: "umm-al-quwain", name: "Umm Al Quwain", country: "UAE" },
  { id: "khor-fakkan", name: "Khor Fakkan", country: "UAE" },
  { id: "dibba-al-fujairah", name: "Dibba Al Fujairah", country: "UAE" },
  { id: "kalba", name: "Kalba", country: "UAE" },
  { id: "madinat-zayed", name: "Madinat Zayed", country: "UAE" },
  { id: "liwa-oasis", name: "Liwa Oasis", country: "UAE" },
  { id: "al-dhafra", name: "Al Dhafra", country: "UAE" },
  { id: "al-mirfa", name: "Al Mirfa", country: "UAE" },
  { id: "ghayathi", name: "Ghayathi", country: "UAE" },
  { id: "ruwais", name: "Ruwais", country: "UAE" },
  { id: "al-sila", name: "Al Sila", country: "UAE" },
  { id: "jebel-ali", name: "Jebel Ali", country: "UAE" },
  { id: "al-qusais", name: "Al Qusais", country: "UAE" },
  { id: "al-awir", name: "Al Awir", country: "UAE" },
  { id: "hatta", name: "Hatta", country: "UAE" },
  { id: "al-hajar", name: "Al Hajar", country: "UAE" },
  { id: "masafi", name: "Masafi", country: "UAE" },
  { id: "al-bithnah", name: "Al Bithnah", country: "UAE" },
  { id: "al-madam", name: "Al Madam", country: "UAE" },
  { id: "al-dhaid", name: "Al Dhaid", country: "UAE" },
  { id: "mleiha", name: "Mleiha", country: "UAE" },
  { id: "al-hamriyah", name: "Al Hamriyah", country: "UAE" },
  { id: "al-rams", name: "Al Rams", country: "UAE" },
  { id: "digdaga", name: "Digdaga", country: "UAE" },
  { id: "al-jazirah-al-hamra", name: "Al Jazirah Al Hamra", country: "UAE" },
  { id: "al-khiran", name: "Al Khiran", country: "UAE" },
  { id: "sha'am", name: "Sha'am", country: "UAE" },
  { id: "al-manama", name: "Al Manama", country: "UAE" },
  { id: "wadi-al-bih", name: "Wadi Al Bih", country: "UAE" },
  { id: "al-taweelah", name: "Al Taweelah", country: "UAE" },
  { id: "al-salamah", name: "Al Salamah", country: "UAE" },
  { id: "al-faqa", name: "Al Faqa", country: "UAE" },
  { id: "sweihan", name: "Sweihan", country: "UAE" },
  { id: "al-khaznah", name: "Al Khaznah", country: "UAE" },
  { id: "al-wagan", name: "Al Wagan", country: "UAE" },
  { id: "al-yahar", name: "Al Yahar", country: "UAE" },
  { id: "al-ajban", name: "Al Ajban", country: "UAE" },
  { id: "nahel", name: "Nahel", country: "UAE" },
  { id: "al-khatam", name: "Al Khatam", country: "UAE" },
  { id: "al-shwaib", name: "Al Shwaib", country: "UAE" },
  { id: "al-hayer", name: "Al Hayer", country: "UAE" },
  { id: "al-qua", name: "Al Qua", country: "UAE" },
  { id: "al-faw", name: "Al Faw", country: "UAE" },
  { id: "al-shuwaib", name: "Al Shuwaib", country: "UAE" },
  
  // Saudi Arabia
  { id: "riyadh", name: "Riyadh", country: "Saudi Arabia" },
  { id: "jeddah", name: "Jeddah", country: "Saudi Arabia" },
  { id: "mecca", name: "Mecca", country: "Saudi Arabia" },
  { id: "medina", name: "Medina", country: "Saudi Arabia" },
  { id: "dammam", name: "Dammam", country: "Saudi Arabia" },
  { id: "khobar", name: "Khobar", country: "Saudi Arabia" },
  { id: "dhahran", name: "Dhahran", country: "Saudi Arabia" },
  { id: "taif", name: "Taif", country: "Saudi Arabia" },
  { id: "tabuk", name: "Tabuk", country: "Saudi Arabia" },
  { id: "buraidah", name: "Buraidah", country: "Saudi Arabia" },
  { id: "khamis-mushait", name: "Khamis Mushait", country: "Saudi Arabia" },
  { id: "hail", name: "Hail", country: "Saudi Arabia" },
  { id: "hofuf", name: "Hofuf", country: "Saudi Arabia" },
  { id: "jubail", name: "Jubail", country: "Saudi Arabia" },
  { id: "abha", name: "Abha", country: "Saudi Arabia" },
  { id: "yanbu", name: "Yanbu", country: "Saudi Arabia" },
  { id: "qatif", name: "Qatif", country: "Saudi Arabia" },
  { id: "najran", name: "Najran", country: "Saudi Arabia" },
  { id: "al-kharj", name: "Al Kharj", country: "Saudi Arabia" },
  { id: "jizan", name: "Jizan", country: "Saudi Arabia" },
  { id: "sakaka", name: "Sakaka", country: "Saudi Arabia" },
  { id: "arar", name: "Arar", country: "Saudi Arabia" },
  { id: "al-bahah", name: "Al Bahah", country: "Saudi Arabia" },
  { id: "al-qunfudhah", name: "Al Qunfudhah", country: "Saudi Arabia" },
  { id: "bisha", name: "Bisha", country: "Saudi Arabia" },
  { id: "al-majmaah", name: "Al Majmaah", country: "Saudi Arabia" },
  { id: "al-zulfi", name: "Al Zulfi", country: "Saudi Arabia" },
  { id: "al-rass", name: "Al Rass", country: "Saudi Arabia" },
  { id: "unaizah", name: "Unaizah", country: "Saudi Arabia" },
  { id: "al-bukayriyah", name: "Al Bukayriyah", country: "Saudi Arabia" },
  { id: "al-mithnab", name: "Al Mithnab", country: "Saudi Arabia" },
  { id: "ar-riyadh-al-khabra", name: "Ar Riyadh Al Khabra", country: "Saudi Arabia" },
  { id: "al-ghat", name: "Al Ghat", country: "Saudi Arabia" },
  { id: "al-aflaj", name: "Al Aflaj", country: "Saudi Arabia" },
  { id: "wadi-al-dawasir", name: "Wadi Al Dawasir", country: "Saudi Arabia" },
  { id: "al-sulayyil", name: "Al Sulayyil", country: "Saudi Arabia" },
  { id: "al-hawiyah", name: "Al Hawiyah", country: "Saudi Arabia" },
  { id: "al-hariq", name: "Al Hariq", country: "Saudi Arabia" },
  { id: "hotat-bani-tamim", name: "Hotat Bani Tamim", country: "Saudi Arabia" },
  { id: "al-muzahimiyah", name: "Al Muzahimiyah", country: "Saudi Arabia" },
  { id: "al-quwayiyah", name: "Al Quwayiyah", country: "Saudi Arabia" },
  { id: "as-sulayyil", name: "As Sulayyil", country: "Saudi Arabia" },
  { id: "rumah", name: "Rumah", country: "Saudi Arabia" },
  { id: "al-duwadimi", name: "Al Duwadimi", country: "Saudi Arabia" },
  { id: "afif", name: "Afif", country: "Saudi Arabia" },
  { id: "al-qurayyat", name: "Al Qurayyat", country: "Saudi Arabia" },
  { id: "turaif", name: "Turaif", country: "Saudi Arabia" },
  { id: "rafha", name: "Rafha", country: "Saudi Arabia" },
  { id: "al-uwayqilah", name: "Al Uwayqilah", country: "Saudi Arabia" },
  { id: "linah", name: "Linah", country: "Saudi Arabia" },
  { id: "al-hadithah", name: "Al Hadithah", country: "Saudi Arabia" },
  { id: "al-shinanah", name: "Al Shinanah", country: "Saudi Arabia" },
  { id: "al-ula", name: "Al Ula", country: "Saudi Arabia" },
  { id: "al-wajh", name: "Al Wajh", country: "Saudi Arabia" },
  { id: "duba", name: "Duba", country: "Saudi Arabia" },
  { id: "haql", name: "Haql", country: "Saudi Arabia" },
  { id: "al-bad", name: "Al Bad", country: "Saudi Arabia" },
  { id: "tayma", name: "Tayma", country: "Saudi Arabia" },
  { id: "al-shamli", name: "Al Shamli", country: "Saudi Arabia" },
  { id: "badr", name: "Badr", country: "Saudi Arabia" },
  { id: "khaybar", name: "Khaybar", country: "Saudi Arabia" },
  { id: "al-mahd", name: "Al Mahd", country: "Saudi Arabia" },
  { id: "rabigh", name: "Rabigh", country: "Saudi Arabia" },
  { id: "thuwal", name: "Thuwal", country: "Saudi Arabia" },
  { id: "al-kamil", name: "Al Kamil", country: "Saudi Arabia" },
  { id: "al-lith", name: "Al Lith", country: "Saudi Arabia" },
  { id: "al-qunfudhah-2", name: "Al Qunfudhah", country: "Saudi Arabia" },
  { id: "al-birk", name: "Al Birk", country: "Saudi Arabia" },
  { id: "al-qahma", name: "Al Qahma", country: "Saudi Arabia" },
  { id: "sabya", name: "Sabya", country: "Saudi Arabia" },
  { id: "abu-arish", name: "Abu Arish", country: "Saudi Arabia" },
  { id: "samtah", name: "Samtah", country: "Saudi Arabia" },
  { id: "farasan", name: "Farasan", country: "Saudi Arabia" },
  { id: "al-darb", name: "Al Darb", country: "Saudi Arabia" },
  { id: "al-aridah", name: "Al Aridah", country: "Saudi Arabia" },
  { id: "al-tuwal", name: "Al Tuwal", country: "Saudi Arabia" },
  { id: "al-harth", name: "Al Harth", country: "Saudi Arabia" },
  { id: "ahad-al-masarihah", name: "Ahad Al Masarihah", country: "Saudi Arabia" },
  { id: "muhayil", name: "Muhayil", country: "Saudi Arabia" },
  { id: "bariq", name: "Bariq", country: "Saudi Arabia" },
  { id: "al-namas", name: "Al Namas", country: "Saudi Arabia" },
  { id: "tanumah", name: "Tanumah", country: "Saudi Arabia" },
  { id: "al-majardah", name: "Al Majardah", country: "Saudi Arabia" },
  { id: "balqarn", name: "Balqarn", country: "Saudi Arabia" },
  { id: "al-mandaq", name: "Al Mandaq", country: "Saudi Arabia" },
  { id: "qilwah", name: "Qilwah", country: "Saudi Arabia" },
  { id: "al-aqiq", name: "Al Aqiq", country: "Saudi Arabia" },
  { id: "al-makhwah", name: "Al Makhwah", country: "Saudi Arabia" },
  { id: "al-qura", name: "Al Qura", country: "Saudi Arabia" },
  { id: "al-atawlah", name: "Al Atawlah", country: "Saudi Arabia" },
  { id: "baljurashi", name: "Baljurashi", country: "Saudi Arabia" },
  { id: "al-mikhwah", name: "Al Mikhwah", country: "Saudi Arabia" },
  { id: "qurayyat-al-milh", name: "Qurayyat Al Milh", country: "Saudi Arabia" },
  { id: "al-manshiyah", name: "Al Manshiyah", country: "Saudi Arabia" },
  { id: "ghamed-al-zinad", name: "Ghamed Al Zinad", country: "Saudi Arabia" },
  { id: "al-hijrah", name: "Al Hijrah", country: "Saudi Arabia" },
  { id: "al-aqiq-2", name: "Al Aqiq", country: "Saudi Arabia" }
];

// Try to fetch Pakistan cities from Leopard Merchant API
async function fetchPakistanCitiesFromLeopard(): Promise<Array<{ id: string; name: string; country: string }>> {
  const base = process.env.LEOPARDS_API_BASE_URL || process.env.COURIER_API_BASE_URL;
  const apiKey = process.env.LEOPARDS_API_KEY || process.env.COURIER_API_KEY;
  if (!base || !apiKey) return [];

  const normalize = (raw: any): Array<{ id: string; name: string; country: string }> => {
    const arr = Array.isArray(raw)
      ? raw
      : raw?.data || raw?.cities || raw?.city_list || raw?.results || raw?.items || [];
    if (!Array.isArray(arr) || arr.length === 0) return [];
    return arr
      .map((it: any) => {
        const name = it?.name ?? it?.city_name ?? it?.cityName ?? it?.label ?? it?.title ?? String(it?.id ?? it?.city_id ?? it?.value ?? '');
        const id = it?.id ?? it?.city_id ?? it?.value ?? it?.code ?? toSlug(name);
        if (!name) return null;
        return { id: String(id), name: String(name).trim(), country: 'Pakistan' };
      })
      .filter(Boolean) as Array<{ id: string; name: string; country: string }>;
  };

  const pathsToTry = ['/cities', '/city', '/GetCities', '/merchant/cities', '/api/cities'];
  for (const p of pathsToTry) {
    try {
      const res = await courierGet(p);
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        continue;
      }
      const list = normalize(data);
      if (list.length > 0) {
        logger.log(`[Cities API] Leopard API: got ${list.length} cities from ${p}`);
        return list;
      }
    } catch (_) {
      continue;
    }
  }

  try {
    const res = await courierPost('/cities', {});
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return [];
    }
    const list = normalize(data);
    if (list.length > 0) {
      logger.log(`[Cities API] Leopard API: got ${list.length} cities from POST /cities`);
      return list;
    }
  } catch (_) {
    // ignore
  }
  return [];
}

// GET /api/cities - Get cities
router.get('/', async (req, res) => {
  try {
    const country = req.query.country as string;
    const isPakistan = country && country.trim().toLowerCase() === 'pakistan';
    
    let cities: Array<{ id: string; name: string; country: string }> = [];
    
    if (isPakistan) {
      logger.log('[Cities API] Fetching Pakistan cities from Leopard API...');
      cities = await fetchPakistanCitiesFromLeopard();
      if (cities.length === 0) {
        logger.log('[Cities API] Leopard API returned no cities; using local JSON fallback.');
        cities = loadPakistanCities();
      }
      logger.log(`[Cities API] Loaded ${cities.length} Pakistan cities`);
    } else {
      cities = [...globalCities, ...loadPakistanCities()];
      if (country && country.trim()) {
        cities = cities.filter(city => city.country === country.trim());
      }
    }
    
    // Sort by name
    cities.sort((a, b) => a.name.localeCompare(b.name));
    
    logger.log(`[Cities API] Returning ${cities.length} cities for ${country || 'all countries'}`);
    
    res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.json({ ok: true, cities });
  } catch (error: any) {
    logger.error('Error fetching cities:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch cities' });
  }
});

// POST /api/cities - Add a new city
router.post('/', async (req, res) => {
  try {
    const { name, country } = req.body;
    
    if (!name || !country) {
      return res.status(400).json({ ok: false, error: 'Name and country are required' });
    }
    
    const cityName = name.trim();
    const countryName = country.trim();
    
    if (!cityName || !countryName) {
      return res.status(400).json({ ok: false, error: 'Name and country cannot be empty' });
    }
    
    // Create city object
    const newCity = {
      id: toSlug(cityName),
      name: cityName,
      country: countryName
    };
    
    logger.log(`[Cities API] Adding new city: ${cityName}, ${countryName}`);
    
    // For now, just return the city (in a real app, you'd save to database)
    res.json({ ok: true, city: newCity });
  } catch (error: any) {
    logger.error('Error adding city:', error);
    res.status(500).json({ ok: false, error: 'Failed to add city' });
  }
});

// GET /api/cities/countries - Get list of available countries
router.get('/countries', async (req, res) => {
  try {
    const countries = ['Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Saudi Arabia'];
    res.set('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.json({ ok: true, countries: countries.sort() });
  } catch (error) {
    logger.error('Error fetching countries:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch countries' });
  }
});

export default router;