'use client';

import React, { useState } from 'react';

interface MockBooking {
  id: string;
  customerName: string;
  service: string;
  price: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'COMPLETED';
  coordinates: string;
  time: string;
}

interface MockBarber {
  id: string;
  name: string;
  rating: number;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  distance: string;
  specialty: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'barbers' | 'schema'>('dispatch');

  const [bookings] = useState<MockBooking[]>([
    {
      id: 'BK-9021',
      customerName: 'Fathur Rahman',
      service: 'Potong Rambut + Cukur',
      price: 80000,
      status: 'IN_TRANSIT',
      coordinates: 'POINT(106.8272 -6.1754)',
      time: '2 menit yang lalu',
    },
    {
      id: 'BK-9022',
      customerName: 'Dimas Prasetyo',
      service: 'Styling Rambut Fade',
      price: 75000,
      status: 'PENDING',
      coordinates: 'POINT(106.8315 -6.1820)',
      time: 'Baru saja',
    },
    {
      id: 'BK-9019',
      customerName: 'Andi Saputra',
      service: 'Facial Treatment & Shave',
      price: 110000,
      status: 'COMPLETED',
      coordinates: 'POINT(106.8190 -6.1680)',
      time: '45 menit yang lalu',
    },
  ]);

  const [barbers] = useState<MockBarber[]>([
    {
      id: 'B-01',
      name: 'Ahmad Rizky (Mitra #042)',
      rating: 4.9,
      status: 'ONLINE',
      distance: '1.2 km dari pusat',
      specialty: 'Fade Expert, Scissor Cut',
    },
    {
      id: 'B-02',
      name: 'Budi Santoso (Mitra #018)',
      rating: 4.8,
      status: 'BUSY',
      distance: '2.1 km dari pusat',
      specialty: 'Classic Cut, Hot Towel Shave',
    },
    {
      id: 'B-03',
      name: 'Chandra Wijaya (Mitra #077)',
      rating: 4.7,
      status: 'ONLINE',
      distance: '3.5 km dari pusat',
      specialty: 'Beard Sculpting, Hair Tattoo',
    },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Hometik Logo"
            className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20 object-cover"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-white">HOMETIK</h1>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Command Center v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">On-Demand Dispatching & Spatial Fleet Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PostGIS Geodetic Index: Active</span>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs bg-indigo-950/60 text-indigo-400 border border-indigo-800 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Supabase Realtime: Ready</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
            ADM
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Pesanan Aktif</span>
              <span className="text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md text-[10px] border border-indigo-900">Live</span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">18</span>
              <span className="text-xs text-emerald-400 font-semibold">+14% vs kemarin</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">3 butuh dispatching instan</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Mitra Online</span>
              <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md text-[10px] border border-emerald-900">PostGIS</span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">24</span>
              <span className="text-xs text-slate-400 font-normal">/ 30 terdaftar</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Radius rata-rata: 4.2 km</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Dispatch Latency</span>
              <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md text-[10px] border border-amber-900">WS</span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">1.4s</span>
              <span className="text-xs text-emerald-400 font-semibold">Cepat</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Broadcast via Supabase Channel</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Gross Transaksi</span>
              <span className="text-slate-400 text-[10px]">Hari Ini</span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-white">Rp 2.850.000</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">38 pesanan terselesaikan</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'dispatch'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Antrean Dispatching & Pesanan
          </button>
          <button
            onClick={() => setActiveTab('barbers')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'barbers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Armada Mitra Barber (Spatial)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'schema'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            PostGIS Stored Procedure & Schema
          </button>
        </div>

        {/* Tab 1: Dispatching Table */}
        {activeTab === 'dispatch' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Live Real-Time Dispatching Feed</h2>
                <p className="text-xs text-slate-400">
                  Pesanan masuk dicocokkan otomatis dengan stored function <code>find_nearby_barbers()</code>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Endpoint:</span>
                <code className="text-xs bg-slate-950 px-2 py-1 rounded text-indigo-300 border border-slate-800">
                  POST /api/bookings
                </code>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">ID Pesanan</th>
                    <th className="p-4">Pelanggan</th>
                    <th className="p-4">Layanan</th>
                    <th className="p-4">PostGIS Point</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-mono font-bold text-indigo-400">{booking.id}</td>
                      <td className="p-4 font-medium text-white">{booking.customerName}</td>
                      <td className="p-4 text-slate-300">{booking.service}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">{booking.coordinates}</td>
                      <td className="p-4 font-semibold text-white">
                        Rp {booking.price.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            booking.status === 'IN_TRANSIT'
                              ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                              : booking.status === 'PENDING'
                              ? 'bg-amber-950/80 text-amber-400 border-amber-800 animate-pulse'
                              : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{booking.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Barbers Fleet */}
        {activeTab === 'barbers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Status Mitra & Radius Pelayanan</h2>
              <p className="text-xs text-slate-400">
                Penyaringan radius menggunakan geodetik ST_DWithin(geometry, point, radius_in_meters)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {barbers.map((barber) => (
                <div key={barber.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{barber.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        barber.status === 'ONLINE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {barber.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-amber-300">
                    <span>★ {barber.rating}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{barber.distance}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Spesialisasi: <span className="text-slate-300">{barber.specialty}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Schema Overview */}
        {activeTab === 'schema' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">PostGIS Migration & SQL Stored Function</h2>
              <p className="text-xs text-slate-400">
                Tersimpan di <code>apps/web-backend/src/lib/schema.sql</code>
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto space-y-2">
              <p className="text-indigo-400">-- PostGIS Stored Function Definition:</p>
              <pre className="text-slate-300 leading-relaxed">
{`CREATE OR REPLACE FUNCTION find_nearby_barbers(
  user_lat   FLOAT,
  user_lng   FLOAT,
  radius_km  FLOAT DEFAULT 5.0
)
RETURNS TABLE (
  id              UUID,
  profile_id      UUID,
  is_online       BOOLEAN,
  rating          NUMERIC,
  total_reviews   INT,
  specialties     TEXT[],
  distance_km     FLOAT,
  user_name       VARCHAR,
  user_avatar_url TEXT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    bd.id, bd.profile_id, bd.is_online, bd.rating, bd.total_reviews, bd.specialties,
    (ST_Distance(bd.current_location::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000.0)::FLOAT AS distance_km,
    p.name::VARCHAR AS user_name, p.avatar_url AS user_avatar_url
  FROM barber_details bd
  JOIN profiles p ON p.id = bd.profile_id
  WHERE bd.is_online = true
    AND bd.current_location IS NOT NULL
    AND ST_DWithin(bd.current_location::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_km * 1000)
  ORDER BY distance_km ASC;
END;
$$;`}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
