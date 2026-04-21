import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/axios.js';
import Badge from '../components/Badge.jsx';

const TABS = ['Critical Roles', 'Risk Summary', 'Retirement Risk', 'Successor Readiness'];
const critColor = { HIGH: 'red', MEDIUM: 'yellow', LOW: 'green' };
const READY_COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];
const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };

function exportCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState(0);
  const [criticalRoles, setCriticalRoles] = useState([]);
  const [riskSummary, setRiskSummary] = useState(null);
  const [retirementRisk, setRetirementRisk] = useState(null);
  const [successorReadiness, setSuccessorReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/critical-roles'),
      api.get('/reports/risk-summary'),
      api.get('/reports/retirement-risk'),
      api.get('/reports/successor-readiness'),
    ]).then(([cr, rs, rr, sr]) => {
      setCriticalRoles(cr.data);
      setRiskSummary(rs.data);
      setRetirementRisk(rr.data);
      setSuccessorReadiness(sr.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Reports &amp; Analytics</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 0: Critical Roles */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{criticalRoles.length} critical positions</p>
            <button onClick={() => exportCSV(criticalRoles, 'critical-roles.csv')} className="btn-secondary text-xs py-1.5 px-3">
              Export CSV
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Position', 'Department', 'Criticality', 'Successors', 'Ready Now', 'Finalized', 'Coverage'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {criticalRoles.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.jobTitle}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.department}</td>
                    <td className="px-4 py-3"><Badge label={r.criticalityLevel} color={critColor[r.criticalityLevel]} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.successorCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.readyNowCount}</td>
                    <td className="px-4 py-3"><Badge label={r.hasFinalizedSuccessor ? 'Yes' : 'No'} color={r.hasFinalizedSuccessor ? 'green' : 'red'} /></td>
                    <td className="px-4 py-3"><Badge label={r.successorCount > 0 ? 'Covered' : 'Gap'} color={r.successorCount > 0 ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Risk Summary */}
      {activeTab === 1 && riskSummary && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{riskSummary.summary.total} total risk assessments</p>
            <button onClick={() => exportCSV(riskSummary.details.map(d => ({ position: d.position?.jobTitle, riskLevel: d.riskLevel, flightRisk: d.flightRiskScore, engagement: d.engagementScore })), 'risk-summary.csv')} className="btn-secondary text-xs py-1.5 px-3">
              Export CSV
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { name: 'High', value: riskSummary.summary.high, fill: '#ef4444' },
                  { name: 'Medium', value: riskSummary.summary.medium, fill: '#f59e0b' },
                  { name: 'Low', value: riskSummary.summary.low, fill: '#22c55e' },
                ]} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                    {[0,1,2].map(i => <Cell key={i} fill={['#ef4444','#f59e0b','#22c55e'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'High Risk', value: riskSummary.summary.high, color: 'bg-red-500' },
                  { label: 'Medium Risk', value: riskSummary.summary.medium, color: 'bg-yellow-500' },
                  { label: 'Low Risk', value: riskSummary.summary.low, color: 'bg-green-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`}
                        style={{ width: `${riskSummary.summary.total ? (item.value / riskSummary.summary.total * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Retirement Risk */}
      {activeTab === 2 && retirementRisk && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Retirement risk by department</p>
            <button onClick={() => exportCSV(retirementRisk.breakdown, 'retirement-risk.csv')} className="btn-secondary text-xs py-1.5 px-3">
              Export CSV
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Immediate', value: retirementRisk.categoryCounts.IMMEDIATE, color: 'red' },
              { label: 'Mid-Term', value: retirementRisk.categoryCounts.MID_TERM, color: 'yellow' },
              { label: 'Long-Term', value: retirementRisk.categoryCounts.LONG_TERM, color: 'green' },
            ].map(item => (
              <div key={item.label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <Badge label={item.label} color={item.color} />
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Department', 'Immediate', 'Mid-Term', 'Long-Term', 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {retirementRisk.breakdown.map((row, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${row.IMMEDIATE > 0 ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.department}</td>
                    <td className="px-4 py-3 text-sm text-red-700 font-medium">{row.IMMEDIATE}</td>
                    <td className="px-4 py-3 text-sm text-yellow-700">{row.MID_TERM}</td>
                    <td className="px-4 py-3 text-sm text-green-700">{row.LONG_TERM}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Successor Readiness */}
      {activeTab === 3 && successorReadiness && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{successorReadiness.distribution.total} total successors</p>
            <button onClick={() => exportCSV(
              successorReadiness.successors.map(s => ({
                employee: s.employee?.name,
                position: s.position?.jobTitle,
                readiness: s.readinessLevel,
                performance: s.performanceRating,
                potential: s.potentialRating,
              })),
              'successor-readiness.csv'
            )} className="btn-secondary text-xs py-1.5 px-3">
              Export CSV
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Readiness Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Ready Now', value: successorReadiness.distribution.READY_NOW },
                      { name: '1-2 Years', value: successorReadiness.distribution.READY_1_2_YEARS },
                      { name: '3-5 Years', value: successorReadiness.distribution.READY_3_5_YEARS },
                    ]}
                    cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value"
                  >
                    {READY_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Successors']} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Breakdown</h3>
              {[
                { label: 'Ready Now', value: successorReadiness.distribution.READY_NOW, color: '#22c55e' },
                { label: 'Ready 1-2 Years', value: successorReadiness.distribution.READY_1_2_YEARS, color: '#3b82f6' },
                { label: 'Ready 3-5 Years', value: successorReadiness.distribution.READY_3_5_YEARS, color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.value} ({successorReadiness.distribution.total ? Math.round(item.value / successorReadiness.distribution.total * 100) : 0}%)</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${successorReadiness.distribution.total ? (item.value / successorReadiness.distribution.total * 100) : 0}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
