import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  MapPin,
  Briefcase,
  Award,
  GraduationCap,
  Languages,
  FileText,
  DollarSign,
  Mail,
  Phone,
  CheckCircle
} from 'lucide-react';

export default function LawyerDetailModal({ lawyer, isOpen, onClose, onHire }) {
  const [message, setMessage] = useState('');
  const [showHireForm, setShowHireForm] = useState(false);
  const [caseDescription, setCaseDescription] = useState('');

  if (!lawyer) return null;

  const handleHire = async () => {
    if (!caseDescription.trim()) {
      alert('Por favor describe tu caso');
      return;
    }

    await onHire(lawyer.id, caseDescription);
    setShowHireForm(false);
    setCaseDescription('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-primary-blue to-accent-purple p-8 text-white">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-4xl border-4 border-white/30">
                  {lawyer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{lawyer.name}</h2>
                    {lawyer.verified && (
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-white/90 text-lg mb-3">{lawyer.specialty}</p>

                  <div className="flex items-center gap-6 text-white/80">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                      <span className="font-semibold">{lawyer.rating}</span>
                      <span className="text-sm">({lawyer.total_reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{lawyer.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      <span>{lawyer.experience_years} años</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              {/* Bio */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Acerca de mí</h3>
                <p className="text-gray-600 leading-relaxed">{lawyer.bio}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="stat-icon bg-blue-50">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="stat-label">Casos ganados</p>
                  <h3 className="stat-value text-2xl">{lawyer.cases_won}/{lawyer.cases_total}</h3>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-green-50">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="stat-label">Rating</p>
                  <h3 className="stat-value text-2xl">{lawyer.rating}/5.0</h3>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-purple-50">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="stat-label">Experiencia</p>
                  <h3 className="stat-value text-2xl">{lawyer.experience_years} años</h3>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-yellow-50">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="stat-label">Tarifa/hora</p>
                  <h3 className="stat-value text-xl">${(lawyer.hourly_rate / 1000).toFixed(0)}k</h3>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Education */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-primary-blue" />
                    <h3 className="font-semibold text-gray-900">Educación</h3>
                  </div>
                  <p className="text-gray-600 ml-7">{lawyer.education}</p>
                </div>

                {/* License */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-primary-blue" />
                    <h3 className="font-semibold text-gray-900">Tarjeta Profesional</h3>
                  </div>
                  <p className="text-gray-600 ml-7">{lawyer.license_number}</p>
                </div>

                {/* Languages */}
                {lawyer.languages && lawyer.languages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Languages className="w-5 h-5 text-primary-blue" />
                      <h3 className="font-semibold text-gray-900">Idiomas</h3>
                    </div>
                    <p className="text-gray-600 ml-7">{lawyer.languages.join(', ')}</p>
                  </div>
                )}

                {/* Specialties */}
                {lawyer.specialties && lawyer.specialties.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-primary-blue" />
                      <h3 className="font-semibold text-gray-900">Especialidades</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-7">
                      {lawyer.specialties.map((spec, idx) => (
                        <span key={idx} className="badge badge-primary text-xs">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Certifications */}
              {lawyer.certifications && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Certificaciones</h3>
                  <p className="text-gray-600">{lawyer.certifications}</p>
                </div>
              )}

              {/* Contact */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Información de contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${lawyer.email}`} className="text-primary-blue hover:underline">
                      {lawyer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${lawyer.phone}`} className="text-gray-600">
                      {lawyer.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Hire Form */}
              {showHireForm ? (
                <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Describe tu caso</h3>
                  <textarea
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                    placeholder="Describe brevemente tu situación legal y qué tipo de asistencia necesitas..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-blue focus:border-transparent transition min-h-[120px]"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleHire}
                      className="btn-dashboard btn-dashboard-primary flex-1"
                    >
                      Enviar solicitud
                    </button>
                    <button
                      onClick={() => setShowHireForm(false)}
                      className="btn-dashboard btn-dashboard-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowHireForm(true)}
                  className="w-full btn-dashboard btn-dashboard-primary py-4 text-lg"
                >
                  Contratar a {lawyer.name.split(' ')[0]}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
