// src/hooks/useProjects.js
import { useState, useEffect, useCallback } from 'react';
import {
  getAllProjects,
  getProject,
  addProject,
  updateProject,
  deleteProject,
  getProjectsByStatus,
  getProjectsWithUpcomingDeadlines
} from '../services/projects';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const projectList = await getAllProjects();
      setProjects(projectList);
    } catch (error) {
      setError(error.message);
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const getProjectById = useCallback(async (projectId) => {
    setLoading(true);
    setError(null);
    
    try {
      const project = await getProject(projectId);
      return project;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addProject = useCallback(async (projectData, userId, userEmail) => {
    setLoading(true);
    setError(null);
    
    try {
      const projectId = await addProject(projectData, userId, userEmail);
      await loadProjects(); // Reload projects
      return projectId;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const editProject = useCallback(async (projectId, projectData, userId, userEmail) => {
    setLoading(true);
    setError(null);
    
    try {
      await updateProject(projectId, projectData, userId, userEmail);
      await loadProjects(); // Reload projects
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const removeProject = useCallback(async (projectId) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteProject(projectId);
      await loadProjects(); // Reload projects
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const getProjectsUpcomingDeadlines = useCallback(async (daysAhead = 30) => {
    try {
      const upcomingProjects = await getProjectsWithUpcomingDeadlines(daysAhead);
      return upcomingProjects;
    } catch (error) {
      setError(error.message);
      return [];
    }
  }, []);

  const filterProjectsByStatus = useCallback((status) => {
    if (status === 'all') return projects;
    return projects.filter(project => project.status === status);
  }, [projects]);

  const searchProjects = useCallback((searchTerm) => {
    const term = searchTerm.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(term) ||
      project.partner.toLowerCase().includes(term) ||
      (project.contractNumber && project.contractNumber.toLowerCase().includes(term))
    );
  }, [projects]);

  return {
    projects,
    loading,
    error,
    loadProjects,
    getProjectById,
    addProject,
    editProject,
    removeProject,
    getProjectsUpcomingDeadlines,
    filterProjectsByStatus,
    searchProjects
  };
};