import React, { useEffect, useState } from 'react';
import { jurisprudence } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import MainLayout from '../components/Layout/MainLayout';
import { Search, BookOpen, Calendar, Building, Heart, ExternalLink, Filter } from 'lucide-react';

export default function Jurisprudence() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [court, setCourt] = useState('');
  const [year, setYear] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [similarCases, setSimilarCases] = useState([]);

  async function performSearch() {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError('');
    setSelected(null);
    setSimilarCases([]);
    
    try {
      const data = await jurisprudence.search({ 
        q: searchTerm, 
        court: court,
        year: year
      });
      setResults(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function selectCase(caseItem) {
    setSelected(caseItem);
    
    // Load similar cases
    try {
      const similar = await jurisprudence.getSimilar(caseItem.id);
      setSimilarCases(Array.isArray(similar) ? similar : similar?.data || []);
    } catch (e) {
      console.warn('Error loading similar cases:', e);
    }
  }

  async function toggleFavorite(caseId) {
    try {
      await jurisprudence.favorite(caseId);
      // Update the results to reflect favorite status
      setResults(prev => prev.map(item => 
        item.id === caseId 
          ? { ...item, is_favorite: !item.is_favorite }
          : item
      ));
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jurisprudencia</h1>
            <p className="text-gray-600">Búsqueda de precedentes y casos relevantes</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guía de Búsqueda
          </Button>
        </div>

        {/* Search Section */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por tema, palabras clave, artículos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-base"
                />
              </div>
              <Button onClick={performSearch} className="flex items-center gap-2 sm:w-auto">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={court}
                onChange={e => setCourt(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las Cortes</option>
                <option value="CSJ">Corte Suprema de Justicia</option>
                <option value="CConst">Corte Constitucional</option>
                <option value="CEstado">Consejo de Estado</option>
                <option value="TA">Tribunal Administrativo</option>
                <option value="JS">Juzgado Superior</option>
              </select>
              
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Cualquier Año</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Filtros Avanzados
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Results Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Results List */}
          <div className="lg:col-span-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Resultados {results.length > 0 && `(${results.length})`}
                </h3>
                {results.length > 0 && (
                  <span className="text-sm text-gray-500">
                    Ordenados por relevancia
                  </span>
                )}
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span className="ml-2">Buscando jurisprudencia...</span>
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron resultados' : 'Ingresa un término de búsqueda'}
                  </div>
                ) : (
                  results.map(caseItem => (
                    <div
                      key={caseItem.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
                        selected?.id === caseItem.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => selectCase(caseItem)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">
                              {caseItem.case_number || `Expediente ${caseItem.id}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(caseItem.id);
                              }}
                              className={`p-1 ${caseItem.is_favorite ? 'text-red-500' : 'text-gray-400'}`}
                            >
                              <Heart className={`h-3 w-3 ${caseItem.is_favorite ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {caseItem.court || 'No especificada'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(caseItem.date)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {caseItem.summary || caseItem.topic || 'Sin descripción disponible'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Detail Panel */}
          <div>
            <Card className="sticky top-4">
              {selected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Detalle del Caso</h3>
                    <Button
                      variant="ghost"
                      onClick={() => toggleFavorite(selected.id)}
                      className={`p-1 ${selected.is_favorite ? 'text-red-500' : 'text-gray-400'}`}
                    >
                      <Heart className={`h-4 w-4 ${selected.is_favorite ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Expediente:</span>
                      <p className="text-sm text-gray-900">{selected.case_number || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Corte:</span>
                      <p className="text-sm text-gray-900">{selected.court || 'No especificada'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Fecha:</span>
                      <p className="text-sm text-gray-900">{formatDate(selected.date)}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Tema:</span>
                      <p className="text-sm text-gray-900">{selected.topic || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Resumen:</span>
                      <p className="text-sm text-gray-700">{selected.summary || 'No disponible'}</p>
                    </div>
                    
                    {selected.tags && selected.tags.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Etiquetas:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selected.tags.map((tag, idx) => (
                            <span key={idx} className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selected.pdf_url && (
                    <Button 
                      as="a" 
                      href={selected.pdf_url} 
                      target="_blank" 
                      className="w-full flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver Documento Completo
                    </Button>
                  )}
                  
                  {/* Similar Cases */}
                  {similarCases.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Casos Similares</h4>
                      <div className="space-y-2">
                        {similarCases.slice(0, 3).map(similar => (
                          <div 
                            key={similar.id}
                            className="cursor-pointer rounded border border-gray-200 p-2 hover:bg-gray-50"
                            onClick={() => selectCase(similar)}
                          >
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {similar.case_number}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {similar.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Selecciona un caso para ver los detalles</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function formatDate(dateString) {
  if (!dateString) return 'No especificada';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('es-CO');
}
