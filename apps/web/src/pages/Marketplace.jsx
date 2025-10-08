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
  DollarSign
} from 'lucide-react';

export default function Marketplace() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');

  // Mock data - replace with API call
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

  useEffect(() => {
    setLawyers(mockLawyers);
  }, []);

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lawyer.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !specialty || lawyer.specialty === specialty;
    const matchesCity = !city || lawyer.city === city;
    return matchesSearch && matchesSpecialty && matchesCity;
  });

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
              <option value="Derecho Laboral">Derecho Laboral</option>
              <option value="Derecho Civil">Derecho Civil</option>
              <option value="Derecho Penal">Derecho Penal</option>
              <option value="Derecho Comercial">Derecho Comercial</option>
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500"
            >
              <option value="">Todas las ciudades</option>
              <option value="Bogotá">Bogotá</option>
              <option value="Medellín">Medellín</option>
              <option value="Cali">Cali</option>
              <option value="Barranquilla">Barranquilla</option>
            </select>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-navy-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-navy-100 p-2">
                <Briefcase className="h-5 w-5 text-navy-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Abogados</p>
                <p className="text-2xl font-bold text-navy-900">{lawyers.length}</p>
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
                <p className="text-2xl font-bold text-navy-900">
                  {lawyers.filter(l => l.verified).length}
                </p>
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
                  {(lawyers.reduce((acc, l) => acc + l.rating, 0) / lawyers.length).toFixed(1)}
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
                <p className="text-2xl font-bold text-navy-900">
                  {lawyers.reduce((acc, l) => acc + l.cases_won, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lawyers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLawyers.map(lawyer => (
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

        {filteredLawyers.length === 0 && (
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
