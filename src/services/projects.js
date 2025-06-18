// src/services/projects.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'projects';

// Get all projects
export const getAllProjects = async () => {
  try {
    const projectsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(projectsQuery);
    const projects = [];
    snapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

// Get single project
export const getProject = async (projectId) => {
  try {
    const projectDoc = await getDoc(doc(db, COLLECTION_NAME, projectId));
    if (projectDoc.exists()) {
      return {
        id: projectDoc.id,
        ...projectDoc.data()
      };
    } else {
      throw new Error('Project not found');
    }
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

// Create project
export const createProject = async (projectData, userId, userEmail) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...projectData,
      paidAmount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId,
      userEmail
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Update project
export const updateProject = async (projectId, projectData, userId, userEmail) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, projectId), {
      ...projectData,
      updatedAt: serverTimestamp(),
      userId,
      userEmail
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete project
export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, projectId));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Update project paid amount
export const updateProjectPaidAmount = async (projectId, amount) => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, projectId), {
      paidAmount: increment(amount),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project paid amount:', error);
    throw error;
  }
};

/**
 * Firestore composite index required for getProjectsByStatus query:
 * Fields: status (Ascending), createdAt (Descending)
 * Create index here:
 * https://console.firebase.google.com/v1/r/project/sistem-keuangan-ptpeb/firestore/indexes?create_composite=Clpwcm9qZWN0cy9zaXN0ZW0ta2V1YW5nYW4tcHRwZWIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2luZGV4ZXMvXxABGg0KCXN0YXR1cxABGgkKCGNyZWF0ZWRBdBgC
 */
export const getProjectsByStatus = async (status) => {
  try {
    const projectsQuery = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(projectsQuery);
    const projects = [];
    snapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return projects;
  } catch (error) {
    console.error('Error getting projects by status:', error);
    if (error.code === 'failed-precondition') {
      console.error('Firestore index required for getProjectsByStatus query. Please create the index in Firebase console: https://console.firebase.google.com/v1/r/project/sistem-keuangan-ptpeb/firestore/indexes?create_composite=Clpwcm9qZWN0cy9zaXN0ZW0ta2V1YW5nYW4tcHRwZWIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2luZGV4ZXMvXxABGg0KCXN0YXR1cxABGgkKCGNyZWF0ZWRBdBgC');
    }
    throw error;
  }
};

// Get projects with upcoming deadlines
export const getProjectsWithUpcomingDeadlines = async (daysAhead = 30) => {
  try {
    const projects = await getAllProjects();
    const today = new Date();
    const upcomingProjects = projects.filter(project => {
      if (project.status !== 'ongoing') return false;
      
      const endDate = new Date(project.endDate);
      const daysUntilDeadline = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      return daysUntilDeadline > 0 && daysUntilDeadline <= daysAhead;
    });
    
    return upcomingProjects.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  } catch (error) {
    console.error('Error getting upcoming projects:', error);
    throw error;
  }
};