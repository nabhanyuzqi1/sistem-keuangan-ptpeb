// src/components/projects/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllProjects } from '../../services/projects';
import ProjectModal from './ProjectModal';
import ProjectCard from './ProjectCard';

const ProjectList = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectList = await getAllProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Gagal memuat daftar proyek. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleModalClose = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadProjects();
  };

  // Filter and search projects
  const filteredProjects = projects.filter(project => {
    // Status filter
    if (filter !== 'all' && project.status !== filter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        project.name.toLowerCase().includes(search) ||
        project.partner.toLowerCase().includes(search) ||
        (project.contractNumber && project.contractNumber.toLowerCase().includes(search))
      );
    }
    
    return true;
  });

  // Group projects by status
  const projectsByStatus = {
    'akan-datang': filteredProjects.filter(p => p.status === 'akan-datang'),
    'ongoing': filteredProjects.filter(p => p.status === 'ongoing'),
    'retensi': filteredProjects.filter(p => p.status === 'retensi'),
    'selesai': filteredProjects.filter(p => p.status === 'selesai')
  };

  const statusLabels = {
    'akan-datang': 'Akan Datang',
    'ongoing': 'On Going',
    'retensi': 'Retensi',
    'selesai': 'Selesai'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>{error}</p>
        <button
          onClick={loadProjects}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Daftar Proyek</h2>
          {currentUser && currentUser.role === 'admin' && (
            <button
              onClick={() => setShowProjectModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              + Tambah Proyek
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="akan-datang">Akan Datang</option>
              <option value="ongoing">On Going</option>
              <option value="retensi">Retensi</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Proyek
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nama proyek, mitra, atau no. SPK..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Project Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="bg-white p-4 rounded-lg shadow text-center">
            <span className={`status-badge status-${status}`}>{label}</span>
            <p className="text-2xl font-bold mt-2">{projectsByStatus[status].length}</p>
            <p className="text-xs text-gray-500">proyek</p>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-500">
            {searchTerm || filter !== 'all'
              ? 'Tidak ada proyek yang sesuai dengan filter'
              : 'Belum ada proyek'}
          </p>
          {currentUser && currentUser.role === 'admin' && !searchTerm && filter === 'all' && (
            <button
              onClick={() => setShowProjectModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Tambah proyek pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={currentUser?.role === 'admin' ? handleEditProject : null}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          project={editingProject}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ProjectList;