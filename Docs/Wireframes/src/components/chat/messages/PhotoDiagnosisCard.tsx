import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

interface PhotoDiagnosisCardProps {
  data: {
    imageUrl: string;
    diagnosis: string;
    confidence: number;
    treatmentSteps: string[];
    severity: 'low' | 'medium' | 'high';
  };
  timestamp: Date;
}

export function PhotoDiagnosisCard({ data, timestamp }: PhotoDiagnosisCardProps) {
  const severityColors = {
    low: { bg: '#1B998B', text: 'Low Risk' },
    medium: { bg: '#F59E0B', text: 'Monitor Closely' },
    high: { bg: '#FF6B6B', text: 'Requires Attention' },
  };

  const severity = severityColors[data.severity];

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-[#1B998B] to-[#0A2463] rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-[#1B998B]">Aquatic AI</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm ml-8 overflow-hidden">
          {/* Image Thumbnail */}
          <div className="relative h-48 bg-gray-100">
            <ImageWithFallback
              src={data.imageUrl}
              alt="Diagnosis photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
              <p className="text-xs text-white font-medium">
                {data.confidence}% Confidence
              </p>
            </div>
          </div>

          {/* Diagnosis Content */}
          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${severity.bg}15` }}
              >
                {data.severity === 'low' ? (
                  <CheckCircle className="w-6 h-6" style={{ color: severity.bg }} />
                ) : (
                  <AlertCircle className="w-6 h-6" style={{ color: severity.bg }} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#0A2463] mb-1">Diagnosis</h3>
                <p className="text-sm text-gray-700">{data.diagnosis}</p>
              </div>
            </div>

            {/* Severity Badge */}
            <div
              className="inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: `${severity.bg}15`, color: severity.bg }}
            >
              {severity.text}
            </div>

            {/* Treatment Steps */}
            {data.treatmentSteps.length > 0 && (
              <div className="bg-[#F0F4F8] rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0A2463] mb-2">
                  Treatment Steps:
                </p>
                <ol className="space-y-2">
                  {data.treatmentSteps.map((step, index) => (
                    <li key={index} className="flex gap-2 text-sm text-gray-700">
                      <span className="font-semibold text-[#1B998B] flex-shrink-0">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
