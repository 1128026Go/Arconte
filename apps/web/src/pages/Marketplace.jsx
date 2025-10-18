import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Search,
  MapPin,
  Star,
  Briefcase,
  Award,
  TrendingUp,
  Filter,
  DollarSign,
  Loader2
} from 'lucide-react';
import api from '../lib/api';

export default function Marketplace() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchLawyers();
    fetchSpecialties();
    fetchCities();
    fetchStats();
  }, []);

  // Fetch lawyers when filters change
  useEffect(() => {
    fetchLawyers();
  }, [specialty, city, searchTerm]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (specialty) params.append('specialty', specialty);
      if (city) params.append('city', city);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/lawyers?${params.toString()}`);
      setLawyers(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await api.get('/lawyers/specialties');
      setSpecialties(response.data);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/lawyers/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/lawyers/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Backup mock data in case API fails
  const mockLawyers = [
    {
      id: 1,
      name: 'María González',
      specialty: 'Derecho Laboral',
      city: 'Bogotá',
      rating: 4.8,
      cases_won: 45,
      experience_years: 12,
      hourly_rate: 250000,
      match_score: 95,
      verified: true
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      specialty: 'Derecho Civil',
      city: 'Medellín',
      rating: 4.6,
      cases_won: 38,
      experience_years: 8,
      hourly_rate: 200000,
      match_score: 88,
      verified: true
    },
    {
      id: 3,
      name: 'Ana Martínez',
      specialty: 'Derecho Penal',
      city: 'Cali',
      rating: 4.9,
      cases_won: 52,
      experience_years: 15,
      hourly_rate: 300000,
      match_score: 92,
      verified: true
    }
  ];

  const displayLawyers = lawyers.length > 0 ? lawyers : mockLawyers;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy-900">Marketplace de Abogados</h1>
            <p className="text-slate-600 mt-1">
              Encuentra el abogado perfecto para tu caso
            </p>
          </div>
          <Button className="bg-gold-500 hover:bg-gold-600 text-white">
            Publicar Caso
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
            >
              <option value="">Todas las ciudades</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-navy-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-navy-100 p-2">
                  <Briefcase className="h-5 w-5 text-navy-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Abogados</p>
                  <p className="text-2xl font-bold text-navy-900">{stats.total_lawyers}</p>
                </div>
              </div>
            </Card>
            <Card className="border-gold-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gold-100 p-2">
                  <Award className="h-5 w-5 text-gold-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Verificados</p>
                  <p className="text-2xl font-bold text-navy-900">{stats.verified_lawyers}</p>
                </div>
              </div>
            </Card>
            <Card className="border-primary-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-100 p-2">
                  <TrendingUp className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Rating Promedio</p>
                  <p className="text-2xl font-bold text-navy-900">
                    {stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : '0.0'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-success-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success-100 p-2">
                  <Star className="h-5 w-5 text-success-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Casos Ganados</p>
                  <p className="text-2xl font-bold text-navy-900">{stats.total_cases_won}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        )}

        {/* Lawyers List */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayLawyers.map(lawyer => (
            <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-lg">
                      {lawyer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">{lawyer.name}</h3>
                      <p className="text-sm text-slate-600">{lawyer.specialty}</p>
                    </div>
                  </div>
                  {lawyer.verified && (
                    <span className="bg-success-100 text-success-700 text-xs px-2 py-1 rounded-full font-medium">
                      ✓ Verificado
                    </span>
                  )}
                </div>

                {/* Match Score */}
                {lawyer.match_score && (
                  <div className="bg-navy-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-navy-700 font-medium">Match Score</span>
                      <span className="text-2xl font-bold text-navy-900">{lawyer.match_score}%</span>
                    </div>
                    <div className="w-full bg-navy-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full"
                        style={{ width: `${lawyer.match_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Star className="h-4 w-4 text-gold-500" />
                    <span>{lawyer.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Award className="h-4 w-4 text-navy-500" />
                    <span>{lawyer.cases_won} casos</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-primary-500" />
                    <span>{lawyer.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Briefcase className="h-4 w-4 text-success-500" />
                    <span>{lawyer.experience_years} años</span>
                  </div>
                </div>

                {/* Price */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-600" />
                      <span className="font-semibold text-navy-900">
                        ${lawyer.hourly_rate.toLocaleString()}/hora
                      </span>
                    </div>
                    <Button className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-1.5 text-sm">
                      Contratar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}

        {!loading && displayLawyers.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <p className="text-slate-500">No se encontraron abogados con los filtros seleccionados</p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
