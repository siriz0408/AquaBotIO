"use client";

import { useState } from "react";
import { FlaskConical, Droplets, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WaterType = "freshwater" | "saltwater";

interface ParameterRange {
  parameter: string;
  unit: string;
  safe: string;
  warning: string;
  danger: string;
  icon: typeof FlaskConical;
}

const FRESHWATER_PARAMS: ParameterRange[] = [
  {
    parameter: "Ammonia",
    unit: "ppm",
    safe: "0",
    warning: "0.1-0.25",
    danger: ">0.25",
    icon: FlaskConical,
  },
  {
    parameter: "Nitrite",
    unit: "ppm",
    safe: "0",
    warning: "0.1-0.5",
    danger: ">0.5",
    icon: FlaskConical,
  },
  {
    parameter: "Nitrate",
    unit: "ppm",
    safe: "0-20",
    warning: "20-40",
    danger: ">40",
    icon: FlaskConical,
  },
  {
    parameter: "pH",
    unit: "",
    safe: "6.5-7.5",
    warning: "6.0-6.5, 7.5-8.0",
    danger: "<6.0, >8.0",
    icon: Droplets,
  },
  {
    parameter: "Temperature",
    unit: "°F",
    safe: "72-78",
    warning: "68-72, 78-82",
    danger: "<68, >82",
    icon: Thermometer,
  },
];

const SALTWATER_PARAMS: ParameterRange[] = [
  {
    parameter: "Ammonia",
    unit: "ppm",
    safe: "0",
    warning: "0.1-0.25",
    danger: ">0.25",
    icon: FlaskConical,
  },
  {
    parameter: "Nitrite",
    unit: "ppm",
    safe: "0",
    warning: "0.1-0.5",
    danger: ">0.5",
    icon: FlaskConical,
  },
  {
    parameter: "Nitrate",
    unit: "ppm",
    safe: "0-20",
    warning: "20-40",
    danger: ">40",
    icon: FlaskConical,
  },
  {
    parameter: "pH",
    unit: "",
    safe: "8.1-8.4",
    warning: "7.8-8.1, 8.4-8.6",
    danger: "<7.8, >8.6",
    icon: Droplets,
  },
  {
    parameter: "Temperature",
    unit: "°F",
    safe: "75-82",
    warning: "72-75, 82-84",
    danger: "<72, >84",
    icon: Thermometer,
  },
  {
    parameter: "Salinity",
    unit: "SG",
    safe: "1.023-1.025",
    warning: "1.020-1.023, 1.025-1.028",
    danger: "<1.020, >1.028",
    icon: Droplets,
  },
];

interface ParameterReferenceProps {
  className?: string;
}

export function ParameterReference({ className }: ParameterReferenceProps) {
  const [waterType, setWaterType] = useState<WaterType>("freshwater");

  const params = waterType === "freshwater" ? FRESHWATER_PARAMS : SALTWATER_PARAMS;

  return (
    <Card className={cn("shadow-sm border-gray-200", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#1B998B15" }}
          >
            <FlaskConical className="w-5 h-5" style={{ color: "#1B998B" }} />
          </div>
          Parameter Reference Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Water Type Toggle */}
        <div className="flex gap-2" role="tablist" aria-label="Water type selection">
          <Button
            variant={waterType === "freshwater" ? "default" : "outline"}
            size="sm"
            onClick={() => setWaterType("freshwater")}
            role="tab"
            aria-selected={waterType === "freshwater"}
            aria-controls="parameter-table"
            className="flex-1"
          >
            Freshwater
          </Button>
          <Button
            variant={waterType === "saltwater" ? "default" : "outline"}
            size="sm"
            onClick={() => setWaterType("saltwater")}
            role="tab"
            aria-selected={waterType === "saltwater"}
            aria-controls="parameter-table"
            className="flex-1"
          >
            Saltwater
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Safe</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Danger</span>
          </div>
        </div>

        {/* Parameter Table */}
        <div
          id="parameter-table"
          role="tabpanel"
          className="overflow-x-auto -mx-6 px-6"
        >
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-2 font-semibold text-brand-navy">
                  Parameter
                </th>
                <th className="text-center py-2 px-2 font-semibold text-green-600">
                  Safe
                </th>
                <th className="text-center py-2 px-2 font-semibold text-yellow-600">
                  Warning
                </th>
                <th className="text-center py-2 px-2 font-semibold text-red-600">
                  Danger
                </th>
              </tr>
            </thead>
            <tbody>
              {params.map((param) => (
                <tr
                  key={param.parameter}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2">
                      <param.icon
                        className="w-4 h-4 text-gray-400 hidden sm:block"
                        aria-hidden="true"
                      />
                      <div>
                        <span className="font-medium text-brand-navy">
                          {param.parameter}
                        </span>
                        {param.unit && (
                          <span className="text-gray-400 text-xs ml-1">
                            ({param.unit})
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-block px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                      {param.safe}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-block px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium whitespace-nowrap">
                      {param.warning}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-block px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium whitespace-nowrap">
                      {param.danger}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <strong>Tip:</strong> Test ammonia, nitrite, and nitrate weekly.
          pH and temperature should be monitored more frequently, especially after water changes.
          {waterType === "saltwater" && (
            <span> Salinity should remain stable - avoid fluctuations of more than 0.001 per day.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
