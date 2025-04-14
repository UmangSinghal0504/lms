import React, { useState, useRef, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AddContext';
import { assets } from '../../assets/assets';

const AddCourse = () => {
  const { backendUrl, getToken } = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [formData, setFormData] = useState({
    courseTitle: '',
    coursePrice: 0,
    discount: 0,
    image: null,
    chapters: [],
  });

  const [lectureForm, setLectureForm] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false,
  });

  const [uiState, setUiState] = useState({
    showLectureModal: false,
    currentChapterId: null,
    isSubmitting: false,
  });

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'video'],
            ['clean']
          ],
        },
        placeholder: 'Write detailed course description...',
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleChapterAction = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:');
      if (title) {
        setFormData(prev => ({
          ...prev,
          chapters: [
            ...prev.chapters,
            {
              chapterId: uuidv4(),
              chapterTitle: title.trim(),
              chapterContent: [],
              collapsed: false,
              chapterOrder: prev.chapters.length + 1,
            }
          ]
        }));
      }
    } else if (action === 'remove') {
      setFormData(prev => ({
        ...prev,
        chapters: prev.chapters.filter(chapter => chapter.chapterId !== chapterId)
      }));
    } else if (action === 'toggle') {
      setFormData(prev => ({
        ...prev,
        chapters: prev.chapters.map(chapter => 
          chapter.chapterId === chapterId 
            ? { ...chapter, collapsed: !chapter.collapsed } 
            : chapter
        )
      }));
    }
  };

  const handleLectureAction = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setUiState(prev => ({
        ...prev,
        showLectureModal: true,
        currentChapterId: chapterId
      }));
    } else if (action === 'remove') {
      setFormData(prev => ({
        ...prev,
        chapters: prev.chapters.map(chapter => {
          if (chapter.chapterId === chapterId) {
            return {
              ...chapter,
              chapterContent: chapter.chapterContent.filter((_, idx) => idx !== lectureIndex)
            };
          }
          return chapter;
        })
      }));
    }
  };

  const handleLectureChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLectureForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddLecture = () => {
    const { lectureTitle, lectureDuration } = lectureForm;
    if (!lectureTitle.trim() || !lectureDuration) {
      toast.error('Title and Duration are required');
      return;
    }

    const duration = Number(lectureDuration);
    if (isNaN(duration)) {
      toast.error('Duration must be a number');
      return;
    }

    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => 
        chapter.chapterId === uiState.currentChapterId
          ? {
              ...chapter,
              chapterContent: [
                ...chapter.chapterContent,
                {
                  lectureId: uuidv4(),
                  lectureTitle: lectureForm.lectureTitle.trim(),
                  lectureDuration: duration,
                  lectureUrl: lectureForm.lectureUrl?.trim() || '',
                  isPreviewFree: lectureForm.isPreviewFree,
                  lectureOrder: chapter.chapterContent.length + 1
                }
              ]
            }
          : chapter
      )
    }));

    setLectureForm({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false
    });
    setUiState(prev => ({ ...prev, showLectureModal: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));

      if (!formData.courseTitle.trim()) {
        toast.error('Course title is required');
        return;
      }

      if (!quillRef.current?.root.innerHTML) {
        toast.error('Course description is required');
        return;
      }

      if (formData.chapters.length === 0) {
        toast.error('At least one chapter is required');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('courseTitle', formData.courseTitle);
      formDataToSend.append('courseDescription', quillRef.current.root.innerHTML);
      formDataToSend.append('coursePrice', formData.coursePrice);
      formDataToSend.append('discount', formData.discount);
      formDataToSend.append('courseContent', JSON.stringify(formData.chapters));
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const token = await getToken();
      const response = await axios.post(
        `${backendUrl}/api/educator/add-course`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('Course created successfully!');
        // Reset form after successful submission
        setFormData({
          courseTitle: '',
          coursePrice: 0,
          discount: 0,
          image: null,
          chapters: [],
        });
        quillRef.current.root.innerHTML = '';
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Course</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
            <input
              type="text"
              name="courseTitle"
              value={formData.courseTitle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              name="coursePrice"
              min="0"
              step="0.01"
              value={formData.coursePrice}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
            <input
              type="number"
              name="discount"
              min="0"
              max="100"
              value={formData.discount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
          <div ref={editorRef} className="h-64 mb-4"></div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Course Content</h2>
            <button
              type="button"
              onClick={() => handleChapterAction('add')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Chapter
            </button>
          </div>

          {formData.chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No chapters added yet. Click "Add Chapter" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.chapters.map((chapter) => (
                <div key={chapter.chapterId} className="border rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleChapterAction('toggle', chapter.chapterId)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {chapter.collapsed ? '▶' : '▼'}
                      </button>
                      <span className="font-medium">{chapter.chapterTitle}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleLectureAction('add', chapter.chapterId)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add Lecture
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChapterAction('remove', chapter.chapterId)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {!chapter.collapsed && (
                    <div className="p-4 border-t">
                      {chapter.chapterContent.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No lectures in this chapter yet.
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {chapter.chapterContent.map((lecture, index) => (
                            <li key={lecture.lectureId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <span>{lecture.lectureTitle}</span>
                                {lecture.isPreviewFree && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Free Preview
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <span className="text-sm text-gray-500">
                                  {lecture.lectureDuration} mins
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleLectureAction('remove', chapter.chapterId, index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uiState.isSubmitting || formData.chapters.length === 0}
            className={`px-6 py-2 rounded-md text-white ${uiState.isSubmitting || formData.chapters.length === 0 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition`}
          >
            {uiState.isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>

      {/* Lecture Modal */}
      {uiState.showLectureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add New Lecture</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Title</label>
                <input
                  type="text"
                  name="lectureTitle"
                  value={lectureForm.lectureTitle}
                  onChange={handleLectureChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  name="lectureDuration"
                  min="1"
                  value={lectureForm.lectureDuration}
                  onChange={handleLectureChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (optional)</label>
                <input
                  type="url"
                  name="lectureUrl"
                  value={lectureForm.lectureUrl}
                  onChange={handleLectureChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPreviewFree"
                  name="isPreviewFree"
                  checked={lectureForm.isPreviewFree}
                  onChange={handleLectureChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPreviewFree" className="ml-2 block text-sm text-gray-700">
                  Free Preview
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUiState(prev => ({ ...prev, showLectureModal: false }))}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLecture}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Lecture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourse;