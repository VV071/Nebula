import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { OHLCData } from '../../services/marketService';

interface CandleChartProps {
    data: OHLCData[];
    height?: number;
}


// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-surface-light dark:bg-surface-dark p-3 border border-light dark:border-dark rounded shadow-lg text-sm">
                <p className="font-bold mb-1">{label}</p>
                <div className="space-y-1">
                    <p className="text-textSecondary-light dark:text-textSecondary-dark">Open: <span className="font-mono text-textPrimary-light dark:text-textPrimary-dark">{data.open.toFixed(2)}</span></p>
                    <p className="text-textSecondary-light dark:text-textSecondary-dark">High: <span className="font-mono text-textPrimary-light dark:text-textPrimary-dark">{data.high.toFixed(2)}</span></p>
                    <p className="text-textSecondary-light dark:text-textSecondary-dark">Low: <span className="font-mono text-textPrimary-light dark:text-textPrimary-dark">{data.low.toFixed(2)}</span></p>
                    <p className="text-textSecondary-light dark:text-textSecondary-dark">Close: <span className={`font-mono font-bold ${data.close >= data.open ? 'text-green-500' : 'text-red-500'}`}>{data.close.toFixed(2)}</span></p>
                </div>
            </div>
        );
    }
    return null;
};

export function CandleChart({ data, height = 300 }: CandleChartProps) {
    // Transform data for the chart
    // We define a 'bodyLow' and 'bodyHeight' to help render the bar
    const chartData = data.map(d => ({
        ...d,
        bodyLow: Math.min(d.open, d.close),
        bodyHigh: Math.max(d.open, d.close),
        color: d.close >= d.open ? '#22c55e' : '#ef4444' // Tailwind green-500 : red-500
    }));

    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis
                        dataKey="time"
                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                        stroke="#9ca3af"
                        fontSize={12}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* 
                        Recharts hack for candlesticks:
                        We use a Bar chart where the bar represents the body (Open-Close).
                        But standard Bar starts from 0. We need floating bars.
                        Recharts <Bar> can take [min, max] as dataKey to be a floating range bar!
                    */}


                    {/*
                        Better standard approach:
                        Use ReferenceLines or ErrorBars for wicks? No.
                        Given 'placeholder' requirement, we will simply use a Range Bar 
                        chart for the Body.
                        AND a Line for the High/Low? No.
                        
                        We will use a Bar with dataKey={[min, max]}.
                        Recharts allows dataKey to be an array for Range Bars.
                     */}

                    <Bar
                        dataKey={({ open, close }: any) => [Math.min(open, close), Math.max(open, close)]}
                        fill="#8884d8"
                    >
                        {
                            chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                        }
                    </Bar>

                    {/* 
                        For Wicks: A common trick is to overlay a "ErrorBar" or a thinner Bar 
                        representing the Low-High range.
                        Let's add a second Bar, very thin, for the wick range [low, high].
                      */}
                    <Bar
                        dataKey={({ low, high }: any) => [low, high]}
                        barSize={2}
                        fill="#000" // Will be overridden by Cell
                    >
                        {
                            chartData.map((entry, index) => (
                                <Cell key={`wick-${index}`} fill={entry.color} />
                            ))
                        }
                    </Bar>

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
