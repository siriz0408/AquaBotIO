import { useState } from 'react';
import { ParameterCharts } from './components/ParameterCharts';
import { SpeciesDatabase } from './components/SpeciesDatabase';
import { Maintenance } from './components/Maintenance';
import { BottomTabBar } from './components/dashboard/BottomTabBar';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<'parameters' | 'species' | 'maintenance'>('parameters');

  return (
    <div className="h-screen flex flex-col bg-[#F0F4F8]">
      <div className="flex-1 overflow-hidden">
        {activeScreen === 'parameters' && <ParameterCharts />}
        {activeScreen === 'species' && <SpeciesDatabase />}
        {activeScreen === 'maintenance' && <Maintenance />}
      </div>
      
      <div className="border-t bg-white p-2">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setActiveScreen('parameters')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeScreen === 'parameters'
                ? 'bg-[#1B998B] text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Parameters
          </button>
          <button
            onClick={() => setActiveScreen('species')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeScreen === 'species'
                ? 'bg-[#1B998B] text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Species
          </button>
          <button
            onClick={() => setActiveScreen('maintenance')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeScreen === 'maintenance'
                ? 'bg-[#1B998B] text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Maintenance
          </button>
        </div>
      </div>
    </div>
  );
}
