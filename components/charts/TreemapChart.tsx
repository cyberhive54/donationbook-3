'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface TreemapChartProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function TreemapChart({ data, title, colors = DEFAULT_COLORS }: TreemapChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const treemapData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: colors[index % colors.length],
  }));

  const CustomContent = ({ x, y, width, height, name, value }: any) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const fontSize = Math.max(10, Math.min(14, width / 8));
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
          }}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={fontSize}
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={fontSize - 2}
              fontWeight="600"
            >
              ₹{value.toLocaleString()}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 25}
              textAnchor="middle"
              fill="#fff"
              fontSize={fontSize - 3}
            >
              {percentage.toFixed(1)}%
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="theme-card bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomContent />}
            >
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
            </Treemap>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{item.name}</p>
                    <p className="text-xs font-semibold text-gray-900">
                      ₹{item.value.toLocaleString()} ({percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
