import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/Layout/MainLayout';
import LawyerDetailModal from '../components/Marketplace/LawyerDetailModal';
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
import { staggerContainer, staggerItem, fadeInUp } from '../utils/animations';

export default function Marketplace() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      const response = await fetch(`/api/lawyers?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLawyers(data.data || []);
      } else {
        setLawyers([]);
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await fetch('/api/lawyers/specialties', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      setSpecialties(['Derecho Laboral', 'Derecho Civil', 'Derecho Penal', 'Derecho Comercial']);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/lawyers/cities', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/lawyers/statistics', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        total_lawyers: 0,
        verified_lawyers: 0,
        average_rating: '0.0',
        total_cases_won: 0
      });
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

  const handleViewDetails = (lawyer) => {
    setSelectedLawyer(lawyer);
    setIsModalOpen(true);
  };

  const handleHire = async (lawyerId, caseDescription) => {
    try {
      const response = await fetch('/api/lawyers/hire', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          lawyer_id: lawyerId,
          case_description: caseDescription
        })
      });

      if (response.ok) {
        alert('¡Solicitud enviada! El abogado se pondrá en contacto contigo pronto.');
        setIsModalOpen(false);
      } else {
        alert('Error al enviar la solicitud. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error hiring lawyer:', error);
      alert('Error al enviar la solicitud. Intenta nuevamente.');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketplace de Abogados</h1>
            <p className="text-gray-600 mt-1">
              Encuentra el abogado perfecto para tu caso
            </p>
          </div>
          <button className="btn-dashboard btn-dashboard-primary">
            Publicar Caso
          </button>
        </motion.div>

        {/* Search and Filters */}
        <div className="card-glass card-bordered p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
                />
              </div>
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-blue focus:border-transparent transition"
            >
              <option value="">Todas las ciudades</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <motion.div variants={staggerItem} className="stat-card">
              <div className="stat-icon bg-blue-50">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <p className="stat-label">Abogados</p>
              <h3 className="stat-value">{stats.total_lawyers}</h3>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-card">
              <div className="stat-icon bg-green-50">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <p className="stat-label">Verificados</p>
              <h3 className="stat-value">{stats.verified_lawyers}</h3>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-card">
              <div className="stat-icon bg-purple-50">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <p className="stat-label">Rating Promedio</p>
              <h3 className="stat-value">
                {stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : '0.0'}
              </h3>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-card">
              <div className="stat-icon bg-yellow-50">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="stat-label">Casos Ganados</p>
              <h3 className="stat-value">{stats.total_cases_won}</h3>
            </motion.div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner" />
          </div>
        )}

        {/* Lawyers List */}
        {!loading && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {displayLawyers.map(lawyer => (
            <motion.div key={lawyer.id} variants={staggerItem} className="card-glass card-bordered hover-lift">
              <div className="space-y-4 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-blue to-accent-purple flex items-center justify-center text-white font-bold text-lg">
                      {lawyer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                      <p className="text-sm text-gray-600">{lawyer.specialty}</p>
                    </div>
                  </div>
                  {lawyer.verified && (
                    <span className="badge badge-success text-xs">
                      ✓ Verificado
                    </span>
                  )}
                </div>

                {/* Match Score */}
                {lawyer.match_score && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-700 font-medium">Match Score</span>
                      <span className="text-2xl font-bold text-blue-900">{lawyer.match_score}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-blue to-accent-purple h-2 rounded-full"
                        style={{ width: `${lawyer.match_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span>{lawyer.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span>{lawyer.cases_won} casos</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    <span>{lawyer.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="h-4 w-4 text-green-500" />
                    <span>{lawyer.experience_years} años</span>
                  </div>
                </div>

                {/* Price */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">
                        ${lawyer.hourly_rate.toLocaleString()}/hora
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(lawyer)}
                      className="btn-dashboard btn-dashboard-primary text-sm px-4 py-1.5"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && displayLawyers.length === 0 && (
          <div className="card-glass card-bordered p-12 text-center">
            <p className="text-gray-500">No se encontraron abogados con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {/* Lawyer Detail Modal */}
      <LawyerDetailModal
        lawyer={selectedLawyer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onHire={handleHire}
      />
    </MainLayout>
  );
}
