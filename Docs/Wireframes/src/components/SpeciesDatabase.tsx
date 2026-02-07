import { useState } from 'react';
import { Search, X, ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const filters = {
  waterType: ['Freshwater', 'Saltwater'],
  careLevel: ['Beginner', 'Moderate', 'Expert'],
  temperament: ['Peaceful', 'Semi-aggressive', 'Aggressive'],
};

const speciesData = [
  {
    id: 1,
    name: 'Clownfish',
    scientificName: 'Amphiprion ocellaris',
    image: 'clownfish',
    waterType: 'Saltwater',
    careLevel: 'Beginner',
    minTankSize: '20 gallons',
    temperament: 'Peaceful',
    temperature: '75-82°F',
    pH: '8.0-8.4',
    diet: 'Omnivore',
    maxSize: '4 inches',
    compatibility: 'Excellent for reef tanks. Compatible with most peaceful fish.',
  },
  {
    id: 2,
    name: 'Yellow Tang',
    scientificName: 'Zebrasoma flavescens',
    image: 'yellow-tang',
    waterType: 'Saltwater',
    careLevel: 'Moderate',
    minTankSize: '100 gallons',
    temperament: 'Semi-aggressive',
    temperature: '72-78°F',
    pH: '8.1-8.4',
    diet: 'Herbivore',
    maxSize: '8 inches',
    compatibility: 'Territorial with other tangs. Needs swimming space.',
  },
  {
    id: 3,
    name: 'Neon Tetra',
    scientificName: 'Paracheirodon innesi',
    image: 'neon-tetra',
    waterType: 'Freshwater',
    careLevel: 'Beginner',
    minTankSize: '10 gallons',
    temperament: 'Peaceful',
    temperature: '70-81°F',
    pH: '6.0-7.0',
    diet: 'Omnivore',
    maxSize: '1.5 inches',
    compatibility: 'Perfect for community tanks. Schools of 6+ recommended.',
  },
  {
    id: 4,
    name: 'Betta Fish',
    scientificName: 'Betta splendens',
    image: 'betta',
    waterType: 'Freshwater',
    careLevel: 'Beginner',
    minTankSize: '5 gallons',
    temperament: 'Aggressive',
    temperature: '76-82°F',
    pH: '6.5-7.5',
    diet: 'Carnivore',
    maxSize: '3 inches',
    compatibility: 'Keep males separate. Avoid fin-nippers.',
  },
  {
    id: 5,
    name: 'Royal Gramma',
    scientificName: 'Gramma loreto',
    image: 'royal-gramma',
    waterType: 'Saltwater',
    careLevel: 'Beginner',
    minTankSize: '30 gallons',
    temperament: 'Peaceful',
    temperature: '72-78°F',
    pH: '8.1-8.4',
    diet: 'Carnivore',
    maxSize: '3 inches',
    compatibility: 'Hardy and peaceful. Great for beginners.',
  },
  {
    id: 6,
    name: 'Blue Tang',
    scientificName: 'Paracanthurus hepatus',
    image: 'blue-tang',
    waterType: 'Saltwater',
    careLevel: 'Moderate',
    minTankSize: '100 gallons',
    temperament: 'Peaceful',
    temperature: '72-78°F',
    pH: '8.1-8.4',
    diet: 'Omnivore',
    maxSize: '12 inches',
    compatibility: 'Needs large tank with plenty of swimming room.',
  },
];

const careLevelColors = {
  Beginner: '#1B998B',
  Moderate: '#F59E0B',
  Expert: '#FF6B6B',
};

export function SpeciesDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{[key: string]: string[]}>({
    waterType: [],
    careLevel: [],
    temperament: [],
  });
  const [selectedSpecies, setSelectedSpecies] = useState<typeof speciesData[0] | null>(null);

  const toggleFilter = (category: string, value: string) => {
    const current = selectedFilters[category] || [];
    if (current.includes(value)) {
      setSelectedFilters({
        ...selectedFilters,
        [category]: current.filter(v => v !== value),
      });
    } else {
      setSelectedFilters({
        ...selectedFilters,
        [category]: [...current, value],
      });
    }
  };

  const filteredSpecies = speciesData.filter(species => {
    const matchesSearch = species.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         species.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesWaterType = selectedFilters.waterType.length === 0 ||
                             selectedFilters.waterType.includes(species.waterType);
    
    const matchesCareLevel = selectedFilters.careLevel.length === 0 ||
                             selectedFilters.careLevel.includes(species.careLevel);
    
    const matchesTemperament = selectedFilters.temperament.length === 0 ||
                               selectedFilters.temperament.includes(species.temperament);
    
    return matchesSearch && matchesWaterType && matchesCareLevel && matchesTemperament;
  });

  return (
    <div className="h-full flex flex-col bg-[#F0F4F8]">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <button className="p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-[#0A2463]">Species Database</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search species..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="bg-white px-4 py-3 border-b overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 whitespace-nowrap">
          {Object.entries(filters).map(([category, values]) =>
            values.map((value) => {
              const isSelected = selectedFilters[category]?.includes(value);
              return (
                <button
                  key={`${category}-${value}`}
                  onClick={() => toggleFilter(category, value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#1B998B] text-white shadow-md'
                      : 'bg-[#F0F4F8] text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Species Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredSpecies.map((species) => (
            <motion.button
              key={species.id}
              onClick={() => setSelectedSpecies(species)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-[#1B998B]/20 to-[#0A2463]/20 relative">
                <ImageWithFallback
                  src={species.image}
                  alt={species.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: careLevelColors[species.careLevel as keyof typeof careLevelColors] }}
                >
                  {species.careLevel}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-[#0A2463] text-sm mb-1">{species.name}</h3>
                <p className="text-xs text-gray-500 italic mb-2">{species.scientificName}</p>
                <p className="text-xs text-gray-600 font-medium">{species.minTankSize} min</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Species Detail Modal */}
      <AnimatePresence>
        {selectedSpecies && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedSpecies(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hero Image */}
              <div className="relative h-56 bg-gradient-to-br from-[#1B998B]/20 to-[#0A2463]/20">
                <ImageWithFallback
                  src={selectedSpecies.image}
                  alt={selectedSpecies.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedSpecies(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-[#0A2463] mb-1">
                    {selectedSpecies.name}
                  </h2>
                  <p className="text-gray-500 italic">{selectedSpecies.scientificName}</p>
                </div>

                {/* Stats Grid */}
                <div className="bg-[#F0F4F8] rounded-2xl p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Care Level</p>
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: careLevelColors[selectedSpecies.careLevel as keyof typeof careLevelColors] }}
                      >
                        {selectedSpecies.careLevel}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Min Tank Size</p>
                      <p className="font-semibold text-gray-800">{selectedSpecies.minTankSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Temperature</p>
                      <p className="font-semibold text-gray-800">{selectedSpecies.temperature}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">pH Range</p>
                      <p className="font-semibold text-gray-800">{selectedSpecies.pH}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Diet</p>
                      <p className="font-semibold text-gray-800">{selectedSpecies.diet}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Temperament</p>
                      <p className="font-semibold text-gray-800">{selectedSpecies.temperament}</p>
                    </div>
                  </div>
                </div>

                {/* Compatibility Notes */}
                <div className="mb-6">
                  <h3 className="font-bold text-[#0A2463] mb-2">Compatibility Notes</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedSpecies.compatibility}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button className="w-full bg-[#1B998B] text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-[#158f7e] transition-colors">
                    <Plus className="w-5 h-5" />
                    Add to My Tank
                  </button>
                  <button className="w-full bg-white border-2 border-[#1B998B] text-[#1B998B] py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-[#1B998B]/5 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    Ask AI About This Species
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
