// shared.js

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

defineCustomElements(window);

// Global variables for app state
// Note: quill is attached to window object in editor.js when initialized
let currentStoryId = null;

// Story management functions
const STORIES_INDEX_FILE = 'stories-index.json';

// Utility function to generate unique IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Utility function to count words in HTML content
const countWords = (html) => {
  // Remove HTML tags and count words
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').filter(word => word.length > 0).length;
};

// Format date for display
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 24 * 60 * 60 * 1000) { // Less than 24 hours
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 7 * 24 * 60 * 60 * 1000) { // Less than a week
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

// Authentication utility functions
const isAuthenticated = () => {
  const token = localStorage.getItem('gnimble-auth-token');
  const username = localStorage.getItem('gnimble-username');
  return token && username;
};

const getAuthToken = () => {
  return localStorage.getItem('gnimble-auth-token');
};

const getUsername = () => {
  return localStorage.getItem('gnimble-username');
};

const getUserData = () => {
  const userData = localStorage.getItem('gnimble-user-data');
  return userData ? JSON.parse(userData) : null;
};

const saveUserData = (userData) => {
  localStorage.setItem('gnimble-user-data', JSON.stringify(userData));
};

const clearAuthData = () => {
  localStorage.removeItem('gnimble-auth-token');
  localStorage.removeItem('gnimble-username');
  localStorage.removeItem('gnimble-user-data');
};

const makeApiCall = async (endpoint, data, requireAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`https://gnimble.online${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

const fetchUserProfile = async () => {
  const username = getUsername();
  if (!username) {
    throw new Error('No username found');
  }

  try {
    const userData = await makeApiCall('/api/user', { user: username });
    saveUserData(userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

const requireAuth = () => {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
};

// Optional auth check that doesn't redirect - for pages where login is optional
const checkAuth = () => {
  return isAuthenticated();
};

// Cloud story synchronization functions
const loadStoryFromCloud = async (storyName) => {
  if (!isAuthenticated()) {
    throw new Error('Authentication required for cloud operations');
  }

  try {
    const response = await makeApiCall('/api/story/get/', {
      story: storyName
    }, true); // requireAuth = true

    if (response.success === 1) {
      return response.data;
    } else {
      throw new Error('Failed to load story from cloud');
    }
  } catch (error) {
    console.error('Error loading story from cloud:', error);
    throw error;
  }
};

const saveStoryToCloud = async (storyName, data) => {
  if (!isAuthenticated()) {
    console.log('Not authenticated, skipping cloud save');
    return false;
  }

  try {
    const response = await makeApiCall('/api/story/set/', {
      story: storyName,
      data: data
    }, true); // requireAuth = true

    if (response.success === 1) {
      console.log(`Story "${storyName}" saved to cloud successfully`);
      return true;
    } else {
      throw new Error('Failed to save story to cloud');
    }
  } catch (error) {
    console.error('Error saving story to cloud:', error);
    throw error;
  }
};

// Sync a local story to the cloud
const syncStoryToCloud = async (storyId) => {
  if (!isAuthenticated()) {
    console.log('Not authenticated, skipping cloud sync');
    return false;
  }

  try {
    const story = await getStory(storyId);
    if (!story) {
      throw new Error('Story not found locally');
    }

    const content = await readStoryFile(storyId);
    const storyData = {
      title: story.title,
      content: content,
      wordCount: story.wordCount,
      lastModified: story.lastModified,
      created: story.created
    };

    await saveStoryToCloud(story.title, storyData);
    return true;
  } catch (error) {
    console.error('Error syncing story to cloud:', error);
    throw error;
  }
};

// Import a story from the cloud to local storage
const syncStoryFromCloud = async (storyName) => {
  if (!isAuthenticated()) {
    throw new Error('Authentication required for cloud operations');
  }

  try {
    const cloudStoryData = await loadStoryFromCloud(storyName);

    // Check if story already exists locally
    const stories = await loadStoriesIndex();
    let existingStory = stories.find(s => s.title === storyName);

    if (existingStory) {
      // Update existing story
      existingStory.title = cloudStoryData.title || storyName;
      existingStory.wordCount = cloudStoryData.wordCount || 0;
      existingStory.lastModified = cloudStoryData.lastModified || Date.now();
      existingStory.created = cloudStoryData.created || existingStory.created;

      await saveStoriesIndex(stories);
      await writeStoryFile(existingStory.id, cloudStoryData.content || '<p><br /></p>');

      return existingStory;
    } else {
      // Create new story
      const newStory = {
        id: generateId(),
        title: cloudStoryData.title || storyName,
        filename: `story-${generateId()}.html`,
        wordCount: cloudStoryData.wordCount || 0,
        lastModified: cloudStoryData.lastModified || Date.now(),
        created: cloudStoryData.created || Date.now()
      };

      stories.push(newStory);
      await saveStoriesIndex(stories);
      await writeStoryFile(newStory.id, cloudStoryData.content || '<p><br /></p>');

      return newStory;
    }
  } catch (error) {
    console.error('Error syncing story from cloud:', error);
    throw error;
  }
};

// Sync all local stories to cloud
const syncAllStoriesToCloud = async () => {
  if (!isAuthenticated()) {
    console.log('Not authenticated, skipping cloud sync');
    return { success: 0, synced: 0, errors: [] };
  }

  const stories = await loadStoriesIndex();
  const results = {
    success: 0,
    synced: 0,
    errors: []
  };

  for (const story of stories) {
    try {
      await syncStoryToCloud(story.id);
      results.synced++;
    } catch (error) {
      results.errors.push({
        storyId: story.id,
        title: story.title,
        error: error.message
      });
    }
  }

  results.success = results.errors.length === 0 ? 1 : 0;
  return results;
};

// Enhanced writeStoryFile that also syncs to cloud
const writeStoryFileWithSync = async (storyId, content) => {
  // First, write locally
  const result = await writeStoryFile(storyId, content);

  // Then try to sync to cloud if authenticated
  if (isAuthenticated()) {
    try {
      await syncStoryToCloud(storyId);
    } catch (error) {
      console.warn('Failed to sync story to cloud, but local save was successful:', error);
      // Don't throw error - local save was successful
    }
  }

  return result;
};

// Load stories index
const loadStoriesIndex = async () => {
  try {
    const contents = await Filesystem.readFile({
      path: STORIES_INDEX_FILE,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(contents.data);
  } catch (error) {
    console.log('No stories index found, creating new one');
    return [];
  }
};

// Save stories index
const saveStoriesIndex = async (stories) => {
  try {
    await Filesystem.writeFile({
      path: STORIES_INDEX_FILE,
      data: JSON.stringify(stories, null, 2),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
  } catch (error) {
    console.error('Error saving stories index:', error);
    throw error;
  }
};

// Enhanced createStory that also creates in cloud when authenticated
const createStory = async (title) => {
  const stories = await loadStoriesIndex();
  const newStory = {
    id: generateId(),
    title: title.trim(),
    filename: `story-${generateId()}.html`,
    wordCount: 0,
    lastModified: Date.now(),
    created: Date.now()
  };

  // Add to index first
  stories.push(newStory);
  await saveStoriesIndex(stories);

  // Create empty story file (this will auto-sync to cloud if authenticated)
  await writeStoryFile(newStory.id, '<p><br /></p>');

  return newStory;
};

// Delete a story
const deleteStory = async (storyId) => {
  const stories = await loadStoriesIndex();
  const storyIndex = stories.findIndex(s => s.id === storyId);

  if (storyIndex === -1) throw new Error('Story not found');

  const story = stories[storyIndex];

  // Delete the story file
  try {
    await Filesystem.deleteFile({
      path: `stories/${story.filename}`,
      directory: Directory.Documents,
    });
  } catch (error) {
    console.log('Error deleting story file:', error);
  }

  // Remove from index
  stories.splice(storyIndex, 1);
  await saveStoriesIndex(stories);
};

// Rename a story
const renameStory = async (storyId, newTitle) => {
  const stories = await loadStoriesIndex();
  const story = stories.find(s => s.id === storyId);

  if (!story) throw new Error('Story not found');

  story.title = newTitle.trim();
  story.lastModified = Date.now();

  await saveStoriesIndex(stories);
  return story;
};

// Get a specific story
const getStory = async (storyId) => {
  const stories = await loadStoriesIndex();
  return stories.find(s => s.id === storyId);
};

// Enhanced updateStoryMetadata to sync metadata changes to cloud
const updateStoryMetadata = async (storyId, content) => {
  const stories = await loadStoriesIndex();
  const story = stories.find(s => s.id === storyId);

  if (!story) throw new Error('Story not found');

  story.wordCount = countWords(content);
  story.lastModified = Date.now();

  await saveStoriesIndex(stories);

  // Note: Cloud sync happens in writeStoryFile, not here
  // This prevents duplicate syncs

  return story;
};

// Enhanced writeStoryFile that automatically syncs to cloud when authenticated
const writeStoryFile = async (storyId, content, options = {}) => {
  const story = await getStory(storyId);
  if (!story) throw new Error('Story not found');

  // Default options
  const { skipCloudSync = false } = options;

  try {
    // Step 1: Always save locally first
    await Filesystem.writeFile({
      path: `stories/${story.filename}`,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    // Step 2: Update metadata locally
    await updateStoryMetadata(storyId, content);

    // Step 3: Sync to cloud if authenticated and not skipped
    if (isAuthenticated() && !skipCloudSync) {
      try {
        console.log(`Syncing story "${story.title}" to cloud...`);

        const storyData = {
          title: story.title,
          content: content,
          wordCount: countWords(content),
          lastModified: Date.now(),
          created: story.created
        };

        await saveStoryToCloud(story.title, storyData);
        console.log(`Story "${story.title}" synced to cloud successfully`);
      } catch (cloudError) {
        console.warn('Failed to sync story to cloud, but local save was successful:', cloudError);
        // Optionally, you could track failed syncs for retry later
        // await markStoryForSync(storyId);
      }
    }

    return true;
  } catch (error) {
    console.error('Error writing story file:', error);
    throw error;
  }
};

const readStoryFile = async (storyId) => {
  const story = await getStory(storyId);
  if (!story) throw new Error('Story not found');

  try {
    const contents = await Filesystem.readFile({
      path: `stories/${story.filename}`,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return contents.data;
  } catch (error) {
    console.error('Error reading story file:', error);
    return '<p><br /></p>'; // Return default content if file doesn't exist
  }
};

// Export all functions and variables for use in other modules
export {
  currentStoryId,
  generateId,
  countWords,
  formatDate,
  loadStoriesIndex,
  saveStoriesIndex,
  createStory,
  deleteStory,
  renameStory,
  getStory,
  updateStoryMetadata,
  writeStoryFile,
  readStoryFile,
  // Authentication functions
  isAuthenticated,
  getAuthToken,
  getUsername,
  getUserData,
  saveUserData,
  clearAuthData,
  makeApiCall,
  fetchUserProfile,
  requireAuth,
  checkAuth,
  // Cloud synchronization functions
  loadStoryFromCloud,
  saveStoryToCloud,
  syncStoryToCloud,
  syncStoryFromCloud,
  syncAllStoriesToCloud,
  writeStoryFileWithSync
};

// Optional: Add a function to manually trigger cloud sync for a story
const manualSyncToCloud = async (storyId) => {
  if (!isAuthenticated()) {
    throw new Error('Authentication required for cloud sync');
  }

  try {
    const content = await readStoryFile(storyId);
    const story = await getStory(storyId);

    const storyData = {
      title: story.title,
      content: content,
      wordCount: story.wordCount,
      lastModified: story.lastModified,
      created: story.created
    };

    await saveStoryToCloud(story.title, storyData);
    return true;
  } catch (error) {
    console.error('Error manually syncing story to cloud:', error);
    throw error;
  }
};

// Optional: Add a sync status tracker
const syncStatusTracker = {
  pendingSyncs: new Set(),

  markForSync(storyId) {
    this.pendingSyncs.add(storyId);
  },

  markSynced(storyId) {
    this.pendingSyncs.delete(storyId);
  },

  getPendingSyncs() {
    return Array.from(this.pendingSyncs);
  },

  async syncPending() {
    if (!isAuthenticated()) return;

    const pending = this.getPendingSyncs();
    const results = [];

    for (const storyId of pending) {
      try {
        await manualSyncToCloud(storyId);
        this.markSynced(storyId);
        results.push({ storyId, success: true });
      } catch (error) {
        results.push({ storyId, success: false, error: error.message });
      }
    }

    return results;
  }
};