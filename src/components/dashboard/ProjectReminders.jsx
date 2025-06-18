// src/components/dashboard/ProjectReminders.jsx
import React from 'react';
import { calculateDaysLeft } from '../../utils/formatters';
import { PROJECT_STATUS, DEADLINE_WARNING_DAYS } from '../../utils/constants';

const ProjectReminders = ({ projects }) => {
  const ongoingProjects = projects.filter(p => p.status === PROJECT_STATUS.ONGOING);
  const upcomingDeadlines = ongoingProjects.filter(p => {
    const daysLeft = calculateDaysLeft(p.endDate);
    return daysLeft > 0 && daysLeft <= DEADLINE_WARNING_DAYS;
  }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  const overdueProjects = ongoingProjects.filter(p => {
    const daysLeft = calculateDaysLeft(p.endDate);
    return daysLeft < 0;
  });

  if (upcomingDeadlines.length === 0 && overdueProjects.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      {overdueProjects.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            ⚠️ Proyek Terlambat
          </h3>
          {overdueProjects.map(project => {
            const daysOverdue = Math.abs(calculateDaysLeft(project.endDate));
            return (
              <div key={project.id} className="mt-2">
                <p className="text-red-700">
                  <strong>{project.name}</strong> - {project.partner}
                  <span className="text-red-800 font-bold ml-2">
                    Terlambat {daysOverdue} hari
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {upcomingDeadlines.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⏰ Deadline Proyek Mendekati
          </h3>
          {upcomingDeadlines.map(project => {
            const daysLeft = calculateDaysLeft(project.endDate);
            return (
              <div key={project.id} className="mt-2">
                <p className="text-yellow-700">
                  <strong>{project.name}</strong> - {project.partner}
                  <span className={`font-bold ml-2 ${daysLeft <= 7 ? 'text-red-600' : 'text-yellow-800'}`}>
                    {daysLeft} hari lagi
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectReminders;