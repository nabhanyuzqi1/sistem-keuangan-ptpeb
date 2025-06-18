// src/components/projects/ProjectCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, calculateProjectProgress, calculateDaysLeft, getStatusLabel } from '../../utils/formatters';

const ProjectCard = ({ project, onEdit, currentUser }) => {
  const progress = calculateProjectProgress(project);
  const daysLeft = calculateDaysLeft(project.endDate);

  const copyProjectLink = (e, projectId) => {
    e.stopPropagation();
    e.preventDefault();
    const link = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link proyek berhasil disalin!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onEdit) {
      onEdit(project);
    }
  };

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{project.name}</h3>
            <span className={`status-badge status-${project.status} flex-shrink-0 ml-2`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{project.partner}</p>
          <p className="text-sm text-gray-500 mb-4">
            {new Date(project.startDate).toLocaleDateString('id-ID')} - 
            {new Date(project.endDate).toLocaleDateString('id-ID')}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Nilai Proyek:</span>
              <span className="font-semibold">{formatCurrency(project.value)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pajak ({project.taxRate}%):</span>
              <span>{formatCurrency(project.value * project.taxRate / 100)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Terbayar:</span>
              <span className="text-green-600">{formatCurrency(project.paidAmount || 0)}</span>
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              {daysLeft > 0 && project.status === 'ongoing' && (
                <p className="text-xs text-gray-500 mt-1">Sisa {daysLeft} hari</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={(e) => copyProjectLink(e, project.id)}
                className="text-blue-600 hover:text-blue-800 text-sm p-1"
                title="Salin link proyek"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.522 3.756v1.042c4.518-1.322 6.88-5.556 7.522-4.798z" />
                </svg>
              </button>
              {currentUser && currentUser.role === 'admin' && (
                <button
                  onClick={handleEdit}
                  className="text-gray-600 hover:text-gray-800 text-sm p-1"
                  title="Edit proyek"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;