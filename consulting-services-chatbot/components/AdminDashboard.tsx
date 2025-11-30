import React, { useEffect, useState } from 'react';
import { Booking } from '../types';
import { api } from '../services/mockApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, LayoutDashboard, Calendar, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await api.getAllBookings();
    setBookings(data);
    setLoading(false);
  };

  const getStats = () => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const revenue = bookings.reduce((acc, curr) => acc + (curr.serviceName.includes('Specialist') ? 120 : 50), 0); // Mock price calc
    return { total, confirmed, cancelled, revenue };
  };

  const stats = getStats();

  const chartData = bookings.reduce((acc: any[], curr) => {
      const date = format(new Date(curr.date), 'MMM dd');
      const found = acc.find(i => i.date === date);
      if (found) found.count++;
      else acc.push({ date, count: 1 });
      return acc;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="text-blue-600" /> Admin Dashboard
            </h1>
            <button 
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
                Back to Site
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        ) : (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Total Bookings</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</h3>
                            </div>
                            <Calendar className="text-blue-500 opacity-20" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Active</p>
                                <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</h3>
                            </div>
                            <Users className="text-green-500 opacity-20" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Cancelled</p>
                                <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</h3>
                            </div>
                            <Users className="text-red-500 opacity-20" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Est. Revenue</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">${stats.revenue}</h3>
                            </div>
                            <DollarSign className="text-yellow-500 opacity-20" size={24} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Booking Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-700">Recent Appointments</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">Patient</th>
                                        <th className="px-4 py-3">Service</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{b.userDetails.name}</td>
                                            <td className="px-4 py-3 text-gray-500">{b.serviceName}</td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {format(new Date(b.date), 'MMM dd')} - {b.time}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                         <h3 className="font-semibold text-gray-700 mb-4">Bookings Trend</h3>
                         <div className="flex-1 min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                    <Tooltip 
                                        cursor={{fill: '#eff6ff'}} 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
