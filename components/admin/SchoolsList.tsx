'use client';

import { useState } from 'react';
import { School, createSchool, updateSchool, deleteSchool } from '@/app/admin/schools/actions';

interface SchoolsListProps {
  initialSchools: School[];
}

export function SchoolsList({ initialSchools }: SchoolsListProps) {
  const [schools, setSchools] = useState(initialSchools);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSchool = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await createSchool(formData);
      setIsAddingSchool(false);
      // The page will be revalidated automatically
    } catch (error) {
      console.error('Error adding school:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSchool = async (id: string, formData: FormData) => {
    setIsSubmitting(true);
    try {
      await updateSchool(id, formData);
      setEditingSchool(null);
      // The page will be revalidated automatically
    } catch (error) {
      console.error('Error updating school:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta escuela?')) {
      try {
        await deleteSchool(id);
        setSchools(schools.filter(school => school.id !== id));
      } catch (error) {
        console.error('Error deleting school:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Add School Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsAddingSchool(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Agregar Escuela
        </button>
      </div>

      {/* Add School Form */}
      {isAddingSchool && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4 text-black">Agregar Nueva Escuela</h3>
          <form action={handleAddSchool} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre de la Escuela
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-600"
                placeholder="Ingresa el nombre de la escuela"
              />
            </div>
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                Logo (opcional)
              </label>
              <input
                type="file"
                id="logo"
                name="logo"
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSchool(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schools List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Escuelas Registradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No hay escuelas registradas
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {school.logo_filename ? (
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600">Logo</span>
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">Sin logo</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSchool?.id === school.id ? (
                        <form action={(formData) => handleEditSchool(school.id, formData)} className="space-y-2">
                          <input
                            type="text"
                            name="name"
                            defaultValue={school.name}
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                          />
                          <input
                            type="file"
                            name="logo"
                            accept="image/*"
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              {isSubmitting ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSchool(null)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{school.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(school.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingSchool?.id === school.id ? null : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingSchool(school)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSchool(school.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
