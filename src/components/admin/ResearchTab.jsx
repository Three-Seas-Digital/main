import { useState, useMemo } from 'react';
import {
  Users, GraduationCap, Building2, Activity,
  Trees, Landmark, Globe, Search, FolderKanban,
  MapPin, CheckCircle, AlertCircle, Phone,
  ExternalLink, ChevronDown, Trash2, Eye,
  RefreshCw, Home, Wallet, Baby,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAppContext } from '../../context/AppContext';

const RACE_COLORS = {
  white: '#3b82f6',
  black: '#10b981',
  asian: '#f59e0b',
  hispanic: '#ef4444',
  native: '#8b5cf6',
  pacific: '#06b6d4',
  other: '#6b7280',
  multiracial: '#ec4899',
};

const AGE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const RESEARCH_CATEGORIES = [
  { id: 'demographics', label: 'Demographics', icon: 'Users' },
  { id: 'schools', label: 'Schools', icon: 'GraduationCap' },
  { id: 'businesses', label: 'Businesses', icon: 'Building2' },
  { id: 'healthcare', label: 'Healthcare', icon: 'Activity' },
  { id: 'dining', label: 'Dining', icon: 'Coffee' },
  { id: 'services', label: 'Services', icon: 'Briefcase' },
  { id: 'recreation', label: 'Recreation', icon: 'Trees' },
  { id: 'government', label: 'Government', icon: 'Landmark' },
];

const BUSINESS_TYPES = {
  retail: { label: 'Retail/Shops', query: 'shop', color: '#3b82f6' },
  office: { label: 'Offices', query: 'office', color: '#10b981' },
  restaurant: { label: 'Restaurants', query: 'amenity~"restaurant|fast_food"', color: '#f59e0b' },
  cafe: { label: 'Cafes/Coffee', query: 'amenity~"cafe|coffee"', color: '#8b5cf6' },
  bank: { label: 'Banks', query: 'amenity=bank', color: '#06b6d4' },
  hotel: { label: 'Hotels', query: 'tourism~"hotel|motel"', color: '#ec4899' },
  salon: { label: 'Salons/Spas', query: 'shop~"hairdresser|beauty|spa"', color: '#f43f5e' },
  gym: { label: 'Gyms/Fitness', query: 'leisure~"fitness_centre|sports_centre"', color: '#84cc16' },
  auto: { label: 'Auto Services', query: 'shop~"car|car_repair|tyres"', color: '#64748b' },
};

const SCHOOL_TYPES = {
  elementary: { label: 'Elementary', query: 'amenity=school', color: '#3b82f6' },
  secondary: { label: 'High School', query: 'amenity=school', color: '#10b981' },
  university: { label: 'College/University', query: 'amenity~"university|college"', color: '#8b5cf6' },
  kindergarten: { label: 'Preschool/Daycare', query: 'amenity~"kindergarten|childcare"', color: '#f59e0b' },
  library: { label: 'Libraries', query: 'amenity=library', color: '#06b6d4' },
};

const HEALTHCARE_TYPES = {
  hospital: { label: 'Hospitals', query: 'amenity=hospital', color: '#ef4444' },
  clinic: { label: 'Clinics', query: 'amenity~"clinic|doctors"', color: '#3b82f6' },
  pharmacy: { label: 'Pharmacies', query: 'amenity=pharmacy', color: '#10b981' },
  dentist: { label: 'Dentists', query: 'amenity=dentist', color: '#8b5cf6' },
  veterinary: { label: 'Veterinary', query: 'amenity=veterinary', color: '#f59e0b' },
};

export default function ResearchTab() {
  const { marketResearch, saveResearch, updateResearch, deleteResearch, currentUser } = useAppContext();

  const [searchLocation, setSearchLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentData, setCurrentData] = useState(null);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('search');
  const [activeCategory, setActiveCategory] = useState('demographics');
  const [categoryData, setCategoryData] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Search for demographics by location
  const handleSearch = async () => {
    if (!searchLocation.trim()) return;
    setSearching(true);
    setSearchError('');
    setCurrentData(null);
    setCategoryData({});

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLocation)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': 'ThreeSeasDigital/1.0' } }
      );
      const geoData = await geoRes.json();

      if (!geoData.length) {
        setSearchError('Location not found. Try a city name, zip code, or address.');
        setSearching(false);
        return;
      }

      const geo = geoData[0];
      const lat = parseFloat(geo.lat);
      const lon = parseFloat(geo.lon);
      const address = geo.address || {};
      const state = address.state || address.county || '';
      const city = address.city || address.town || address.village || address.county || '';
      const zip = address.postcode || '';

      let censusData = null;
      if (address.country_code === 'us' && state) {
        try {
          const stateRes = await fetch('https://api.census.gov/data/2021/acs/acs5?get=NAME&for=state:*');
          const stateList = await stateRes.json();
          const stateRow = stateList.find((row) => row[0]?.toLowerCase().includes(state.toLowerCase()));
          const stateFips = stateRow ? stateRow[1] : null;

          if (stateFips) {
            const censusUrl = `https://api.census.gov/data/2021/acs/acs5?get=NAME,B01003_001E,B01002_001E,B19013_001E,B25077_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B02001_002E,B02001_003E,B02001_004E,B02001_005E,B02001_006E,B02001_007E,B02001_008E,B03003_003E,B01001_003E,B01001_004E,B01001_005E,B01001_006E,B01001_007E,B01001_020E,B01001_021E,B01001_022E,B01001_023E,B01001_024E,B01001_025E,B25003_002E,B25003_003E&for=state:${stateFips}`;
            const dataRes = await fetch(censusUrl);
            if (dataRes.ok) {
              const data = await dataRes.json();
              if (data.length > 1) {
                const headers = data[0];
                const values = data[1];
                const getVal = (col) => {
                  const idx = headers.indexOf(col);
                  return idx >= 0 ? parseInt(values[idx]) || 0 : 0;
                };

                const totalPop = getVal('B01003_001E');
                const medianAge = getVal('B01002_001E');
                const medianIncome = getVal('B19013_001E');
                const medianHomeValue = getVal('B25077_001E');

                censusData = {
                  totalPopulation: totalPop,
                  medianAge,
                  medianIncome,
                  medianHomeValue,
                  race: {
                    white: getVal('B02001_002E'),
                    black: getVal('B02001_003E'),
                    native: getVal('B02001_004E'),
                    asian: getVal('B02001_005E'),
                    pacific: getVal('B02001_006E'),
                    other: getVal('B02001_007E'),
                    multiracial: getVal('B02001_008E'),
                    hispanic: getVal('B03003_003E'),
                  },
                  education: {
                    bachelors: getVal('B15003_022E'),
                    masters: getVal('B15003_023E'),
                    professional: getVal('B15003_024E'),
                    doctorate: getVal('B15003_025E'),
                    highEducation: getVal('B15003_022E') + getVal('B15003_023E') + getVal('B15003_024E') + getVal('B15003_025E'),
                  },
                  housing: {
                    ownerOccupied: getVal('B25003_002E'),
                    renterOccupied: getVal('B25003_003E'),
                  },
                  ageGroups: {
                    under18: getVal('B01001_003E') * 2 + getVal('B01001_004E') * 2 + getVal('B01001_005E') * 2 + getVal('B01001_006E') * 2,
                    age18to24: (getVal('B01001_007E') + getVal('B01001_020E')) * 1.5,
                    age25to34: (getVal('B01001_021E') + getVal('B01001_022E')) * 2,
                    age35to64: totalPop * 0.4,
                    age65plus: (getVal('B01001_023E') + getVal('B01001_024E') + getVal('B01001_025E')) * 2,
                  },
                };
              }
            }
          }
        } catch (censusErr) {
          console.log('Census API unavailable');
        }
      }

      if (!censusData) {
        censusData = { note: 'Census data unavailable for this location.' };
      }

      const result = {
        location: `${city}${state ? `, ${state}` : ''}${zip ? ` ${zip}` : ''}`,
        searchQuery: searchLocation,
        coordinates: { lat, lon },
        address,
        demographics: censusData,
      };

      setCurrentData(result);
      // Auto-load all category data in parallel
      loadCategoryData('schools', lat, lon);
      loadCategoryData('businesses', lat, lon);
      loadCategoryData('healthcare', lat, lon);
      loadCategoryData('dining', lat, lon);
      loadCategoryData('services', lat, lon);
      loadCategoryData('recreation', lat, lon);
      loadCategoryData('government', lat, lon);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Search failed. Please try again.');
    }
    setSearching(false);
  };

  // Load category-specific data from Overpass API
  const loadCategoryData = async (category, lat, lon) => {
    if (categoryData[category]) return; // Already loaded
    setLoadingCategory(category);

    try {
      let query = '';
      const radius = searchRadius;

      if (category === 'schools') {
        query = `[out:json][timeout:25];(
          node["amenity"="school"](around:${radius},${lat},${lon});
          node["amenity"="university"](around:${radius},${lat},${lon});
          node["amenity"="college"](around:${radius},${lat},${lon});
          node["amenity"="kindergarten"](around:${radius},${lat},${lon});
          node["amenity"="childcare"](around:${radius},${lat},${lon});
          node["amenity"="library"](around:${radius},${lat},${lon});
          node["amenity"="language_school"](around:${radius},${lat},${lon});
          node["amenity"="music_school"](around:${radius},${lat},${lon});
          node["amenity"="driving_school"](around:${radius},${lat},${lon});
          node["amenity"="training"](around:${radius},${lat},${lon});
          way["amenity"="school"](around:${radius},${lat},${lon});
          way["amenity"="university"](around:${radius},${lat},${lon});
          way["amenity"="college"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'businesses') {
        query = `[out:json][timeout:25];(
          node["shop"](around:${radius},${lat},${lon});
          node["office"](around:${radius},${lat},${lon});
          node["craft"](around:${radius},${lat},${lon});
          node["industrial"](around:${radius},${lat},${lon});
          way["shop"](around:${radius},${lat},${lon});
          way["office"](around:${radius},${lat},${lon});
          way["craft"](around:${radius},${lat},${lon});
          way["landuse"="commercial"](around:${radius},${lat},${lon});
          way["landuse"="industrial"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'healthcare') {
        query = `[out:json][timeout:25];(
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["amenity"="clinic"](around:${radius},${lat},${lon});
          node["amenity"="doctors"](around:${radius},${lat},${lon});
          node["amenity"="pharmacy"](around:${radius},${lat},${lon});
          node["amenity"="dentist"](around:${radius},${lat},${lon});
          node["amenity"="veterinary"](around:${radius},${lat},${lon});
          node["amenity"="nursing_home"](around:${radius},${lat},${lon});
          node["amenity"="social_facility"](around:${radius},${lat},${lon});
          node["healthcare"](around:${radius},${lat},${lon});
          node["shop"="optician"](around:${radius},${lat},${lon});
          node["shop"="hearing_aids"](around:${radius},${lat},${lon});
          node["shop"="medical_supply"](around:${radius},${lat},${lon});
          way["amenity"="hospital"](around:${radius},${lat},${lon});
          way["amenity"="clinic"](around:${radius},${lat},${lon});
          way["amenity"="nursing_home"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'dining') {
        query = `[out:json][timeout:25];(
          node["amenity"="restaurant"](around:${radius},${lat},${lon});
          node["amenity"="fast_food"](around:${radius},${lat},${lon});
          node["amenity"="cafe"](around:${radius},${lat},${lon});
          node["amenity"="bar"](around:${radius},${lat},${lon});
          node["amenity"="pub"](around:${radius},${lat},${lon});
          node["amenity"="food_court"](around:${radius},${lat},${lon});
          node["amenity"="ice_cream"](around:${radius},${lat},${lon});
          node["amenity"="biergarten"](around:${radius},${lat},${lon});
          node["shop"="bakery"](around:${radius},${lat},${lon});
          node["shop"="butcher"](around:${radius},${lat},${lon});
          node["shop"="deli"](around:${radius},${lat},${lon});
          node["shop"="coffee"](around:${radius},${lat},${lon});
          node["shop"="confectionery"](around:${radius},${lat},${lon});
          node["cuisine"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'services') {
        query = `[out:json][timeout:25];(
          node["amenity"="bank"](around:${radius},${lat},${lon});
          node["amenity"="atm"](around:${radius},${lat},${lon});
          node["amenity"="post_office"](around:${radius},${lat},${lon});
          node["amenity"="fuel"](around:${radius},${lat},${lon});
          node["amenity"="car_wash"](around:${radius},${lat},${lon});
          node["amenity"="car_rental"](around:${radius},${lat},${lon});
          node["shop"="hairdresser"](around:${radius},${lat},${lon});
          node["shop"="beauty"](around:${radius},${lat},${lon});
          node["shop"="massage"](around:${radius},${lat},${lon});
          node["shop"="tattoo"](around:${radius},${lat},${lon});
          node["shop"="dry_cleaning"](around:${radius},${lat},${lon});
          node["shop"="laundry"](around:${radius},${lat},${lon});
          node["shop"="car_repair"](around:${radius},${lat},${lon});
          node["shop"="car_parts"](around:${radius},${lat},${lon});
          node["shop"="tyres"](around:${radius},${lat},${lon});
          node["shop"="copyshop"](around:${radius},${lat},${lon});
          node["shop"="travel_agency"](around:${radius},${lat},${lon});
          node["shop"="insurance"](around:${radius},${lat},${lon});
          node["shop"="electronics_repair"](around:${radius},${lat},${lon});
          node["shop"="mobile_phone"](around:${radius},${lat},${lon});
          node["leisure"="fitness_centre"](around:${radius},${lat},${lon});
          node["leisure"="sports_centre"](around:${radius},${lat},${lon});
          node["leisure"="swimming_pool"](around:${radius},${lat},${lon});
          node["tourism"="hotel"](around:${radius},${lat},${lon});
          node["tourism"="motel"](around:${radius},${lat},${lon});
          node["tourism"="guest_house"](around:${radius},${lat},${lon});
          node["office"="lawyer"](around:${radius},${lat},${lon});
          node["office"="accountant"](around:${radius},${lat},${lon});
          node["office"="insurance"](around:${radius},${lat},${lon});
          node["office"="estate_agent"](around:${radius},${lat},${lon});
          node["office"="notary"](around:${radius},${lat},${lon});
          node["office"="tax_advisor"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'recreation') {
        query = `[out:json][timeout:25];(
          node["leisure"="park"](around:${radius},${lat},${lon});
          node["leisure"="playground"](around:${radius},${lat},${lon});
          node["leisure"="garden"](around:${radius},${lat},${lon});
          node["leisure"="golf_course"](around:${radius},${lat},${lon});
          node["leisure"="stadium"](around:${radius},${lat},${lon});
          node["leisure"="pitch"](around:${radius},${lat},${lon});
          node["leisure"="nature_reserve"](around:${radius},${lat},${lon});
          node["leisure"="dog_park"](around:${radius},${lat},${lon});
          node["leisure"="beach_resort"](around:${radius},${lat},${lon});
          node["leisure"="marina"](around:${radius},${lat},${lon});
          node["amenity"="theatre"](around:${radius},${lat},${lon});
          node["amenity"="cinema"](around:${radius},${lat},${lon});
          node["amenity"="arts_centre"](around:${radius},${lat},${lon});
          node["amenity"="community_centre"](around:${radius},${lat},${lon});
          node["amenity"="nightclub"](around:${radius},${lat},${lon});
          node["amenity"="casino"](around:${radius},${lat},${lon});
          node["tourism"="museum"](around:${radius},${lat},${lon});
          node["tourism"="gallery"](around:${radius},${lat},${lon});
          node["tourism"="zoo"](around:${radius},${lat},${lon});
          node["tourism"="aquarium"](around:${radius},${lat},${lon});
          node["tourism"="theme_park"](around:${radius},${lat},${lon});
          node["tourism"="attraction"](around:${radius},${lat},${lon});
          node["sport"](around:${radius},${lat},${lon});
          way["leisure"="park"](around:${radius},${lat},${lon});
          way["leisure"="golf_course"](around:${radius},${lat},${lon});
          way["leisure"="stadium"](around:${radius},${lat},${lon});
          way["leisure"="nature_reserve"](around:${radius},${lat},${lon});
        );out center;`;
      } else if (category === 'government') {
        query = `[out:json][timeout:25];(
          node["amenity"="townhall"](around:${radius},${lat},${lon});
          node["amenity"="courthouse"](around:${radius},${lat},${lon});
          node["amenity"="police"](around:${radius},${lat},${lon});
          node["amenity"="fire_station"](around:${radius},${lat},${lon});
          node["amenity"="prison"](around:${radius},${lat},${lon});
          node["amenity"="post_office"](around:${radius},${lat},${lon});
          node["amenity"="social_facility"](around:${radius},${lat},${lon});
          node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
          node["amenity"="grave_yard"](around:${radius},${lat},${lon});
          node["office"="government"](around:${radius},${lat},${lon});
          node["office"="diplomatic"](around:${radius},${lat},${lon});
          node["office"="ngo"](around:${radius},${lat},${lon});
          node["office"="political_party"](around:${radius},${lat},${lon});
          node["building"="government"](around:${radius},${lat},${lon});
          node["building"="public"](around:${radius},${lat},${lon});
          node["government"](around:${radius},${lat},${lon});
          way["amenity"="townhall"](around:${radius},${lat},${lon});
          way["amenity"="courthouse"](around:${radius},${lat},${lon});
          way["amenity"="police"](around:${radius},${lat},${lon});
          way["amenity"="fire_station"](around:${radius},${lat},${lon});
          way["amenity"="place_of_worship"](around:${radius},${lat},${lon});
        );out center;`;
      }

      if (query) {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
        });
        const data = await res.json();

        const items = (data.elements || []).map((el) => {
          const tags = el.tags || {};
          return {
            id: el.id,
            name: tags.name || 'Unnamed',
            type: getItemType(tags, category),
            address: tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : '',
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || '',
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            tags,
          };
        }).filter((item) => item.name !== 'Unnamed' || item.address);

        setCategoryData((prev) => ({ ...prev, [category]: items }));
      }
    } catch (err) {
      console.error(`Error loading ${category}:`, err);
      setCategoryData((prev) => ({ ...prev, [category]: [] }));
    }
    setLoadingCategory(null);
  };

  const getItemType = (tags, category) => {
    if (category === 'schools') {
      if (tags.amenity === 'university' || tags.amenity === 'college') return 'university';
      if (tags.amenity === 'kindergarten' || tags.amenity === 'childcare') return 'childcare';
      if (tags.amenity === 'library') return 'library';
      if (tags.amenity === 'language_school') return 'language_school';
      if (tags.amenity === 'music_school') return 'music_school';
      if (tags.amenity === 'driving_school') return 'driving_school';
      if (tags.amenity === 'training') return 'training';
      return 'school';
    }
    if (category === 'healthcare') {
      if (tags.healthcare) return tags.healthcare;
      if (tags.amenity === 'nursing_home') return 'nursing_home';
      if (tags.amenity === 'social_facility') return 'social_facility';
      if (tags.shop === 'optician') return 'optician';
      if (tags.shop === 'hearing_aids') return 'hearing_aids';
      if (tags.shop === 'medical_supply') return 'medical_supply';
      return tags.amenity || 'clinic';
    }
    if (category === 'dining') {
      if (tags.shop === 'bakery') return 'bakery';
      if (tags.shop === 'butcher') return 'butcher';
      if (tags.shop === 'deli') return 'deli';
      if (tags.shop === 'coffee') return 'coffee';
      if (tags.shop === 'confectionery') return 'confectionery';
      if (tags.amenity === 'ice_cream') return 'ice_cream';
      if (tags.amenity === 'food_court') return 'food_court';
      if (tags.amenity === 'biergarten') return 'biergarten';
      return tags.amenity || 'restaurant';
    }
    if (category === 'services') {
      // Professional services
      if (tags.office === 'lawyer') return 'lawyer';
      if (tags.office === 'accountant') return 'accountant';
      if (tags.office === 'insurance') return 'insurance';
      if (tags.office === 'estate_agent') return 'real_estate';
      if (tags.office === 'notary') return 'notary';
      if (tags.office === 'tax_advisor') return 'tax_advisor';
      // Financial
      if (tags.amenity === 'bank') return 'bank';
      if (tags.amenity === 'atm') return 'atm';
      // Personal care
      if (tags.shop === 'hairdresser') return 'hairdresser';
      if (tags.shop === 'beauty') return 'beauty';
      if (tags.shop === 'massage') return 'massage';
      if (tags.shop === 'tattoo') return 'tattoo';
      // Laundry/cleaning
      if (tags.shop === 'dry_cleaning') return 'dry_cleaning';
      if (tags.shop === 'laundry') return 'laundry';
      // Auto
      if (tags.shop === 'car_repair') return 'car_repair';
      if (tags.shop === 'car_parts') return 'car_parts';
      if (tags.shop === 'tyres') return 'tyres';
      if (tags.amenity === 'fuel') return 'gas_station';
      if (tags.amenity === 'car_wash') return 'car_wash';
      if (tags.amenity === 'car_rental') return 'car_rental';
      // Other services
      if (tags.amenity === 'post_office') return 'post_office';
      if (tags.shop === 'copyshop') return 'print_shop';
      if (tags.shop === 'travel_agency') return 'travel_agency';
      if (tags.shop === 'insurance') return 'insurance';
      if (tags.shop === 'electronics_repair') return 'electronics_repair';
      if (tags.shop === 'mobile_phone') return 'mobile_phone';
      // Fitness
      if (tags.leisure === 'fitness_centre') return 'gym';
      if (tags.leisure === 'sports_centre') return 'sports_center';
      if (tags.leisure === 'swimming_pool') return 'swimming_pool';
      // Lodging
      if (tags.tourism === 'hotel') return 'hotel';
      if (tags.tourism === 'motel') return 'motel';
      if (tags.tourism === 'guest_house') return 'guest_house';
      return tags.amenity || tags.shop || tags.leisure || tags.tourism || tags.office || 'service';
    }
    if (category === 'recreation') {
      // Parks & nature
      if (tags.leisure === 'park') return 'park';
      if (tags.leisure === 'playground') return 'playground';
      if (tags.leisure === 'garden') return 'garden';
      if (tags.leisure === 'nature_reserve') return 'nature_reserve';
      if (tags.leisure === 'dog_park') return 'dog_park';
      if (tags.leisure === 'beach_resort') return 'beach';
      if (tags.leisure === 'marina') return 'marina';
      // Sports
      if (tags.leisure === 'golf_course') return 'golf';
      if (tags.leisure === 'stadium') return 'stadium';
      if (tags.leisure === 'pitch') return 'sports_field';
      if (tags.sport) return tags.sport;
      // Entertainment
      if (tags.amenity === 'theatre') return 'theatre';
      if (tags.amenity === 'cinema') return 'cinema';
      if (tags.amenity === 'arts_centre') return 'arts_center';
      if (tags.amenity === 'community_centre') return 'community_center';
      if (tags.amenity === 'nightclub') return 'nightclub';
      if (tags.amenity === 'casino') return 'casino';
      // Tourism attractions
      if (tags.tourism === 'museum') return 'museum';
      if (tags.tourism === 'gallery') return 'gallery';
      if (tags.tourism === 'zoo') return 'zoo';
      if (tags.tourism === 'aquarium') return 'aquarium';
      if (tags.tourism === 'theme_park') return 'theme_park';
      if (tags.tourism === 'attraction') return 'attraction';
      return tags.leisure || tags.tourism || 'recreation';
    }
    if (category === 'government') {
      // Government buildings
      if (tags.amenity === 'townhall') return 'city_hall';
      if (tags.amenity === 'courthouse') return 'courthouse';
      if (tags.amenity === 'police') return 'police';
      if (tags.amenity === 'fire_station') return 'fire_station';
      if (tags.amenity === 'prison') return 'prison';
      if (tags.amenity === 'post_office') return 'post_office';
      // Social services
      if (tags.amenity === 'social_facility') return 'social_services';
      // Religious
      if (tags.amenity === 'place_of_worship') return tags.religion || 'place_of_worship';
      if (tags.amenity === 'grave_yard') return 'cemetery';
      // Offices
      if (tags.office === 'government') return 'government_office';
      if (tags.office === 'diplomatic') return 'embassy';
      if (tags.office === 'ngo') return 'nonprofit';
      if (tags.office === 'political_party') return 'political';
      if (tags.government) return tags.government;
      if (tags.building === 'government' || tags.building === 'public') return 'public_building';
      return tags.amenity || tags.office || 'government';
    }
    // Businesses
    if (tags.craft) return tags.craft;
    if (tags.landuse === 'commercial') return 'commercial';
    if (tags.landuse === 'industrial') return 'industrial';
    return tags.shop || tags.office || 'business';
  };

  const getTypeCounts = (items, category) => {
    const counts = {};
    items.forEach((item) => {
      const type = item.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setTypeFilter('all');
    if (currentData && !categoryData[cat] && cat !== 'demographics') {
      loadCategoryData(cat, currentData.coordinates.lat, currentData.coordinates.lon);
    }
  };

  const handleSaveResearch = () => {
    if (!currentData) return;
    const result = saveResearch({ ...currentData, categoryData });
    if (result.success) {
      setToastMsg(result.updated ? 'Research updated!' : 'Research saved!');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const formatNumber = (num) => num?.toLocaleString() || 'N/A';
  const formatCurrency = (num) => num ? `$${num.toLocaleString()}` : 'N/A';
  const formatPercent = (num, total) => total ? `${((num / total) * 100).toFixed(1)}%` : 'N/A';

  const getRaceChartData = (race, total) => {
    if (!race || !total) return [];
    return [
      { name: 'White', value: race.white, color: RACE_COLORS.white },
      { name: 'Black', value: race.black, color: RACE_COLORS.black },
      { name: 'Hispanic', value: race.hispanic, color: RACE_COLORS.hispanic },
      { name: 'Asian', value: race.asian, color: RACE_COLORS.asian },
      { name: 'Other', value: (race.native || 0) + (race.pacific || 0) + (race.other || 0) + (race.multiracial || 0), color: RACE_COLORS.other },
    ].filter((d) => d.value > 0);
  };

  const getAgeChartData = (ageGroups) => {
    if (!ageGroups) return [];
    return [
      { name: 'Under 18', value: ageGroups.under18 },
      { name: '18-24', value: ageGroups.age18to24 },
      { name: '25-34', value: ageGroups.age25to34 },
      { name: '35-64', value: ageGroups.age35to64 },
      { name: '65+', value: ageGroups.age65plus },
    ].filter((d) => d.value > 0);
  };

  const displayData = selectedResearch?.demographics || currentData?.demographics;
  const currentCategoryItems = categoryData[activeCategory] || [];
  const filteredItems = typeFilter === 'all' ? currentCategoryItems : currentCategoryItems.filter((i) => i.type === typeFilter);
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  const getCategoryIcon = (id) => {
    const icons = { demographics: <Users size={16} />, schools: <GraduationCap size={16} />, businesses: <Building2 size={16} />, healthcare: <Activity size={16} />, dining: <Coffee size={16} />, services: <Briefcase size={16} />, recreation: <Trees size={16} />, government: <Landmark size={16} /> };
    return icons[id] || <Globe size={16} />;
  };

  const Coffee = (props) => <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>;

  return (
    <div className="research-tab">
      {toastMsg && <div className="toast-message">{toastMsg}</div>}

      <div className="research-view-toggle">
        <button className={viewMode === 'search' ? 'active' : ''} onClick={() => { setViewMode('search'); setSelectedResearch(null); }}>
          <Search size={16} /> Search
        </button>
        <button className={viewMode === 'saved' ? 'active' : ''} onClick={() => setViewMode('saved')}>
          <FolderKanban size={16} /> Saved ({marketResearch.length})
        </button>
      </div>

      {viewMode === 'search' && (
        <>
          <div className="research-search-card">
            <h3><Globe size={18} /> Market Research</h3>
            <p className="research-subtitle">Search for demographics, schools, businesses, and more by location</p>
            <div className="research-search-row">
              <input
                type="text"
                placeholder="Enter city, zip code, or address..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="research-input"
              />
              <select value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className="research-radius-select">
                <option value={1000}>1 km</option>
                <option value={2000}>2 km</option>
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
                <option value={20000}>20 km</option>
              </select>
              <button onClick={handleSearch} disabled={searching || !searchLocation.trim()} className="btn btn-primary">
                {searching ? 'Searching...' : <><Search size={16} /> Search</>}
              </button>
            </div>
            {searchError && <p className="research-error">{searchError}</p>}
          </div>

          {currentData && (
            <div className="research-results">
              <div className="research-header">
                <h3><MapPin size={18} /> {currentData.location}</h3>
                <div className="research-header-actions">
                  <button onClick={handleSaveResearch} className="btn btn-sm btn-primary">
                    <CheckCircle size={14} /> Save Research
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="research-category-tabs">
                {RESEARCH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`research-cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {getCategoryIcon(cat.id)}
                    <span>{cat.label}</span>
                    {cat.id !== 'demographics' && categoryData[cat.id] && (
                      <span className="research-cat-count">{categoryData[cat.id].length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Demographics Tab */}
              {activeCategory === 'demographics' && displayData && (
                <>
                  {displayData.note && (
                    <div className="research-note">
                      <AlertCircle size={16} /> {displayData.note}
                    </div>
                  )}
                  {displayData.totalPopulation && (
                    <>
                      <div className="research-metrics-grid">
                        <div className="research-metric-card">
                          <Users size={24} />
                          <div className="metric-value">{formatNumber(displayData.totalPopulation)}</div>
                          <div className="metric-label">Population</div>
                        </div>
                        <div className="research-metric-card">
                          <Activity size={24} />
                          <div className="metric-value">{displayData.medianAge || 'N/A'}</div>
                          <div className="metric-label">Median Age</div>
                        </div>
                        <div className="research-metric-card">
                          <Wallet size={24} />
                          <div className="metric-value">{formatCurrency(displayData.medianIncome)}</div>
                          <div className="metric-label">Median Income</div>
                        </div>
                        <div className="research-metric-card">
                          <Home size={24} />
                          <div className="metric-value">{formatCurrency(displayData.medianHomeValue)}</div>
                          <div className="metric-label">Median Home Value</div>
                        </div>
                      </div>

                      <div className="research-charts-row">
                        {displayData.race && (
                          <div className="research-chart-card">
                            <h4><PieChartIcon size={16} /> Race & Ethnicity</h4>
                            <div className="research-chart-container">
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie data={getRaceChartData(displayData.race, displayData.totalPopulation)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {getRaceChartData(displayData.race, displayData.totalPopulation).map((entry, i) => (
                                      <Cell key={i} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(val) => formatNumber(val)} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                        {displayData.ageGroups && (
                          <div className="research-chart-card">
                            <h4><Baby size={16} /> Age Distribution</h4>
                            <div className="research-chart-container">
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={getAgeChartData(displayData.ageGroups)}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                                  <Tooltip formatter={(val) => formatNumber(val)} />
                                  <Bar dataKey="value" fill="var(--primary)">
                                    {getAgeChartData(displayData.ageGroups).map((_, i) => (
                                      <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="research-stats-row">
                        {displayData.education && (
                          <div className="research-stat-card">
                            <h4><GraduationCap size={16} /> Education</h4>
                            <div className="stat-items">
                              <div className="stat-item"><span>Bachelor's</span><span>{formatNumber(displayData.education.bachelors)}</span></div>
                              <div className="stat-item"><span>Master's</span><span>{formatNumber(displayData.education.masters)}</span></div>
                              <div className="stat-item"><span>Doctorate</span><span>{formatNumber(displayData.education.doctorate)}</span></div>
                              <div className="stat-item total"><span>Higher Ed Total</span><span>{formatNumber(displayData.education.highEducation)}</span></div>
                            </div>
                          </div>
                        )}
                        {displayData.housing && (
                          <div className="research-stat-card">
                            <h4><Home size={16} /> Housing</h4>
                            <div className="stat-items">
                              <div className="stat-item"><span>Owner Occupied</span><span>{formatNumber(displayData.housing.ownerOccupied)}</span></div>
                              <div className="stat-item"><span>Renter Occupied</span><span>{formatNumber(displayData.housing.renterOccupied)}</span></div>
                              <div className="stat-item"><span>Ownership Rate</span><span>{formatPercent(displayData.housing.ownerOccupied, displayData.housing.ownerOccupied + displayData.housing.renterOccupied)}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Other Category Tabs (Schools, Businesses, etc.) */}
              {activeCategory !== 'demographics' && (
                <div className="research-category-content">
                  {loadingCategory === activeCategory ? (
                    <div className="research-loading"><RefreshCw size={20} className="spin" /> Loading {activeCategory}...</div>
                  ) : (
                    <>
                      {/* Summary Stats */}
                      <div className="research-cat-summary">
                        <div className="research-cat-total">
                          <strong>{currentCategoryItems.length}</strong>
                          <span>{activeCategory} found within {searchRadius / 1000} km</span>
                        </div>
                        {currentCategoryItems.length > 0 && (
                          <div className="research-type-chips">
                            {getTypeCounts(currentCategoryItems, activeCategory).slice(0, 8).map(([type, count]) => (
                              <button
                                key={type}
                                className={`research-type-chip ${typeFilter === type ? 'active' : ''}`}
                                onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                              >
                                {type.replace(/_/g, ' ')} <span>{count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Filters */}
                      {currentCategoryItems.length > 0 && (
                        <div className="research-filters-bar">
                          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="research-select">
                            <option value="all">All Types ({currentCategoryItems.length})</option>
                            {getTypeCounts(currentCategoryItems, activeCategory).map(([type, count]) => (
                              <option key={type} value={type}>{type.replace(/_/g, ' ')} ({count})</option>
                            ))}
                          </select>
                          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="research-select">
                            <option value="name">Sort by Name</option>
                            <option value="type">Sort by Type</option>
                          </select>
                          <span className="research-results-count">{filteredItems.length} results</span>
                        </div>
                      )}

                      {/* Results List */}
                      {sortedItems.length > 0 ? (
                        <div className="research-items-list">
                          {sortedItems.slice(0, 50).map((item) => (
                            <div key={item.id} className="research-item-card">
                              <div className="research-item-header">
                                <h4>{item.name}</h4>
                                <span className="research-item-type">{item.type.replace(/_/g, ' ')}</span>
                              </div>
                              {item.address && <p className="research-item-address"><MapPin size={12} /> {item.address}</p>}
                              <div className="research-item-meta">
                                {item.phone && <span><Phone size={12} /> {item.phone}</span>}
                                {item.website && <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> Website</a>}
                              </div>
                            </div>
                          ))}
                          {sortedItems.length > 50 && (
                            <p className="research-more-note">Showing 50 of {sortedItems.length} results</p>
                          )}
                        </div>
                      ) : (
                        <div className="research-empty-cat">
                          <Building2 size={32} />
                          <p>No {activeCategory} found in this area</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {viewMode === 'saved' && (
        <div className="research-saved-section">
          <h3><FolderKanban size={18} /> Saved Research ({marketResearch.length})</h3>
          {marketResearch.length === 0 ? (
            <p className="research-empty">No saved research yet. Search for a location and save it.</p>
          ) : (
            <div className="research-saved-list">
              {marketResearch.map((research) => (
                <div key={research.id} className={`research-saved-card ${selectedResearch?.id === research.id ? 'selected' : ''}`}>
                  <div className="saved-card-header" onClick={() => setSelectedResearch(selectedResearch?.id === research.id ? null : research)}>
                    <div className="saved-card-title">
                      <MapPin size={16} />
                      <span>{research.location}</span>
                    </div>
                    <div className="saved-card-meta">
                      <span>{new Date(research.createdAt).toLocaleDateString()}</span>
                      <ChevronDown size={16} className={selectedResearch?.id === research.id ? 'rotated' : ''} />
                    </div>
                  </div>
                  {selectedResearch?.id === research.id && (
                    <div className="saved-card-body">
                      {research.demographics?.totalPopulation ? (
                        <div className="saved-card-stats">
                          <div className="saved-stat"><span className="saved-stat-label">Population</span><span className="saved-stat-value">{formatNumber(research.demographics.totalPopulation)}</span></div>
                          <div className="saved-stat"><span className="saved-stat-label">Median Income</span><span className="saved-stat-value">{formatCurrency(research.demographics.medianIncome)}</span></div>
                          <div className="saved-stat"><span className="saved-stat-label">Median Age</span><span className="saved-stat-value">{research.demographics.medianAge || 'N/A'}</span></div>
                          <div className="saved-stat"><span className="saved-stat-label">Home Value</span><span className="saved-stat-value">{formatCurrency(research.demographics.medianHomeValue)}</span></div>
                        </div>
                      ) : (
                        <p className="saved-card-note">No demographic data available</p>
                      )}
                      <div className="saved-card-actions">
                        <button onClick={() => { setCurrentData(research); setCategoryData(research.categoryData || {}); setViewMode('search'); setSelectedResearch(null); }} className="btn btn-sm btn-outline">
                          <Eye size={14} /> View Full
                        </button>
                        {deleteConfirm === research.id ? (
                          <div className="delete-confirm">
                            <span>Delete?</span>
                            <button onClick={() => { deleteResearch(research.id); setDeleteConfirm(null); setSelectedResearch(null); }} className="btn btn-sm btn-danger">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-sm btn-outline">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(research.id)} className="btn btn-sm btn-ghost">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
