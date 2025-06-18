// src/components/dashboard/RecentProjects.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, getStatusLabel } from '../../utils/formatters';

const RecentProjects = ({ projects }) => {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Proyek Terbaru</h3>
          <Link
            to="/projects"
            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
          >
            Lihat Semua
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="p-6">
          {projects.length === 0 ? (
            <p className="text-gray-500 text-center">Belum ada proyek</p>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{project.name}</h4>
                      <p className="text-sm text-gray-600">{project.partner}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Nilai: {formatCurrency(project.value)}
                      </p>
                    </div>
                    <span className={`status-badge status-${project.status} ml-4`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentProjects;