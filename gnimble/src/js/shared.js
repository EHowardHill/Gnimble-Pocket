// shared.js

import { FileTransfer } from '@capacitor/file-transfer';
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

// Create a new story
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

  // Then create empty story file
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

// Update story metadata (word count, last modified)
const updateStoryMetadata = async (storyId, content) => {
  const stories = await loadStoriesIndex();
  const story = stories.find(s => s.id === storyId);

  if (!story) throw new Error('Story not found');

  story.wordCount = countWords(content);
  story.lastModified = Date.now();

  await saveStoriesIndex(stories);
  return story;
};

// File operations for stories
const writeStoryFile = async (storyId, content) => {
  const story = await getStory(storyId);
  if (!story) throw new Error('Story not found');

  try {
    await Filesystem.writeFile({
      path: `stories/${story.filename}`,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    // Update metadata
    await updateStoryMetadata(storyId, content);

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
  readStoryFile
};