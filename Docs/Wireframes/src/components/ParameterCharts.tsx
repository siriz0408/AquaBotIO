import { useState } from 'react';
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const timeRanges = ['7d', '30d', '90d', 'All'];

const parameters = [
  { id: 'ph', label: 'pH', color: '#1B998B', safeMin: 7.8, safeMax: 8.4 },
  { id: 'ammonia', label: 'Ammonia', color: '#FF6B6B', safeMin: 0, safeMax: 0.25 },
  { id: 'nitrate', label: 'Nitrate', color: '#F59E0B', safeMin: 0, safeMax: 20 },
  { id: 'temperature', label: 'Temperature', color: '#0A2463', safeMin: 76, safeMax: 80 },
];

// Mock data
const generateData = (days: number) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: date.getTime(),
      ph: 8.2 + (Math.random() - 0.5) * 0.3,
      ammonia: Math.random() * 0.15,
      nitrate: 10 + (Math.random() - 0.3) * 8 + (i < 5 ? 5 : 0),
      temperature: 78 + (Math.random() - 0.5) * 2,
    });
  }
  return data;
};

export function ParameterCharts() {
  const [selectedRange, setSelectedRange] = useState('30d');
  const [selectedParameters, setSelectedParameters] = useState(['ph', 'nitrate']);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : selectedRange === '90d' ? 90 : 180;
  const data = generateData(days);

  const toggleParameter = (paramId: string) => {
    if (selectedParameters.includes(paramId)) {
      setSelectedParameters(selectedParameters.filter(p => p !== paramId));
    } else {
      setSelectedParameters([...selectedParameters, paramId]);
    }
  };

  const currentParam = parameters.find(p => p.id === selectedParameters[0]);
  const latestValue = data[data.length - 1]?.[selectedParameters[0] as keyof typeof data[0]];
  const previousValue = data[data.length - 8]?.[selectedParameters[0] as keyof typeof data[0]];
  const trend = latestValue > previousValue ? 'up' : 'down';
  const trendPercent = Math.abs(((latestValue - previousValue) / previousValue) * 100).toFixed(1);

  return (
    <div className="h-full flex flex-col bg-[#F0F4F8]">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-[#0A2463]">Water Parameters</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Time Range Tabs */}
        <div className="bg-white px-4 py-3 border-b">
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  selectedRange === range
                    ? 'bg-[#1B998B] text-white shadow-md'
                    : 'bg-[#F0F4F8] text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm p-4">
          {selectedParameters.length > 0 ? (
            <>
              <div className="mb-4">
                <h3 className="font-bold text-[#0A2463] text-lg mb-1">
                  {currentParam?.label}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold" style={{ color: currentParam?.color }}>
                    {typeof latestValue === 'number' ? latestValue.toFixed(2) : '--'}
                  </span>
                  <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-[#FF6B6B]' : 'text-[#1B998B]'}`}>
                    {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{trendPercent}%</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} onClick={(e) => setSelectedPoint(e?.activePayload?.[0]?.payload)}>
                  <defs>
                    {/* Safe zone gradient */}
                    <linearGradient id="safeZone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B998B" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#1B998B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '8px 12px',
                    }}
                  />
                  
                  {currentParam && (
                    <>
                      <ReferenceLine y={currentParam.safeMin} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine y={currentParam.safeMax} stroke="#F59E0B" strokeDasharray="3 3" />
                    </>
                  )}

                  {selectedParameters.map((paramId) => {
                    const param = parameters.find(p => p.id === paramId);
                    return (
                      <Line
                        key={paramId}
                        type="monotone"
                        dataKey={paramId}
                        stroke={param?.color}
                        strokeWidth={2}
                        dot={{ fill: param?.color, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>

              {/* Selected Point Info */}
              {selectedPoint && (
                <div className="mt-4 bg-[#F0F4F8] rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">{selectedPoint.date}</p>
                  {selectedParameters.map((paramId) => {
                    const param = parameters.find(p => p.id === paramId);
                    return (
                      <div key={paramId} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{param?.label}</span>
                        <span className="text-sm font-bold" style={{ color: param?.color }}>
                          {selectedPoint[paramId]?.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Select a parameter to view chart
            </div>
          )}
        </div>

        {/* Parameter Selector Pills */}
        <div className="px-4 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Parameters</p>
          <div className="flex flex-wrap gap-2">
            {parameters.map((param) => (
              <button
                key={param.id}
                onClick={() => toggleParameter(param.id)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  selectedParameters.includes(param.id)
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                }`}
                style={selectedParameters.includes(param.id) ? { backgroundColor: param.color } : {}}
              >
                {param.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-[#0A2463] mb-2 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            AI Analysis
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Your nitrate levels have increased by {trendPercent}% over the past week, moving from {previousValue?.toFixed(1)} to {latestValue?.toFixed(1)} ppm. 
            This upward trend suggests increased bioload or reduced water changes. I recommend a 20% water change within the next 2-3 days 
            and monitoring feeding amounts.
          </p>
        </div>

        {/* Log New Test Button */}
        <div className="px-4 py-4">
          <button className="w-full bg-[#1B998B] text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-[#158f7e] transition-colors">
            <Plus className="w-5 h-5" />
            Log New Test
          </button>
        </div>
      </div>
    </div>
  );
}
