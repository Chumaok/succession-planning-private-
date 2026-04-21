import { useEffect, useState } from 'react';
import {
  UsersIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/axios.js';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';

const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };
const READY_COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];
const RETIRE_COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

const criticalityBadge = (level) => {
  const map = { HIGH: 'red', MEDIUM: 'yellow', LOW: 'green' };
  return <Badge label={level} color={map[level] || 'gray'} />;
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/metrics')
      .then(r => setMetrics(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load metrics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!metrics) return null;

  const retirementData = [
    { name: 'Immediate', value: metrics.retirementExposure.IMMEDIATE },
    { name: 'Mid-Term', value: metrics.retirementExposure.MID_TERM },
    { name: 'Long-Term', value: metrics.retirementExposure.LONG_TERM },
  ];

  const readinessData = [
    { name: 'Ready Now', value: metrics.readinessDistribution.READY_NOW },
    { name: '1-2 Years', value: metrics.readinessDistribution.READY_1_2_YEARS },
    { name: '3-5 Years', value: metrics.readinessDistribution.READY_3_5_YEARS },
  ];

  const riskData = [
    { name: 'High', value: metrics.riskBreakdown.HIGH, fill: '#ef4444' },
    { name: 'Medium', value: metrics.riskBreakdown.MEDIUM, fill: '#f59e0b' },
    { name: 'Low', value: metrics.riskBreakdown.LOW, fill: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={metrics.totalEmployees}
          subtitle="Active workforce"
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Critical Roles"
          value={metrics.criticalPositions}
          subtitle={`${metrics.totalPositions} total positions`}
          icon={BriefcaseIcon}
          color="purple"
        />
        <StatCard
          title="High Risk Roles"
          value={metrics.highRiskRoles}
          subtitle="Require immediate attention"
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <StatCard
          title="Succession Coverage"
          value={`${metrics.successionCoverage}%`}
          subtitle="Critical roles with successors"
          icon={ArrowPathIcon}
          color={metrics.successionCoverage >= 70 ? 'green' : 'yellow'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retirement Exposure */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Retirement Exposure</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={retirementData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {retirementData.map((_, i) => <Cell key={i} fill={RETIRE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Employees']} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Successor Readiness */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Successor Readiness</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={readinessData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Successors" radius={[4,4,0,0]}>
                {readinessData.map((_, i) => <Cell key={i} fill={READY_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Breakdown */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Level Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Assessments" radius={[4,4,0,0]}>
                {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Critical Positions Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Top Critical Positions — Coverage Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Position', 'Department', 'Criticality', 'Successors', 'Ready Now', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {metrics.topCriticalPositions.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.jobTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.department}</td>
                  <td className="px-4 py-3">{criticalityBadge(p.criticalityLevel)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.successorCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.readyNowCount}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={p.hasCoverage ? 'Covered' : 'Gap'}
                      color={p.hasCoverage ? 'green' : 'red'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
