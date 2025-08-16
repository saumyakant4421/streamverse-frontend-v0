import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import '../../styles/ui/poll-creator.scss';

const PollCreator = ({
  authUser,
  storage,
  newPostContent,
  mediaFile,
  mediaType,
  photoInputRef,
  videoInputRef,
  setPosts,
  setNewPostContent,
  setMediaFile,
  setMediaType,
  setError,
  setLoading,
  API_BASE_URL,
  open,
  onClose,
}) => {
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState([{ text: '', image: null }, { text: '', image: null }]);
  const [pollDuration, setPollDuration] = useState('7');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [optionImages, setOptionImages] = useState({});

  const predefinedQuestions = [
    'Which movie deserves a sequel?',
    'Best Sci-Fi movie of all time?',
    'Who should play the next superhero?',
    'Which director should helm the next blockbuster?',
    'Favorite movie genre?',
    'Best movie soundtrack of the decade?',
    'Which villain stole the show?',
  ];

  const getAuthHeaders = async () => {
    try {
      if (!authUser || !authUser.uid) throw new Error('User is not authenticated');
      const token = await authUser.getIdToken(true);
      if (!token) throw new Error('No authentication token available');
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (err) {
      console.error('Error getting auth token:', err);
      setError('Authentication error: Please sign in again');
      return {};
    }
  };

  const uploadMedia = async (file, type, retries = 3) => {
    if (!file) return null;
    if (!authUser || !authUser.uid) {
      setError('User is not authenticated. Please sign in.');
      return null;
    }

    for (let i = 0; i < retries; i++) {
      try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `media/${authUser.uid}/${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload error:', error);
              setError(`Failed to upload media: ${error.message}`);
              reject(error);
            },
            async () => {
              const url = await getDownloadURL(storageRef);
              resolve({ url, type });
              setUploadProgress(0);
            }
          );
        });
      } catch (err) {
        console.error(`Upload attempt ${i + 1}/${retries} failed:`, err);
        if (i === retries - 1) {
          setError(`Failed to upload media after ${retries} attempts: ${err.message}`);
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return null;
  };

  const handlePollOptionChange = (index, field, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setPollOptions(newOptions);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, { text: '', image: null }]);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
      setOptionImages((prev) => {
        const newImages = { ...prev };
        delete newImages[index];
        return newImages;
      });
    }
  };

  const handleOptionImageChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size exceeds 2MB limit');
      return;
    }

    const media = await uploadMedia(file, 'photo');
    if (media) {
      setOptionImages((prev) => ({ ...prev, [index]: media.url }));
      handlePollOptionChange(index, 'image', media.url);
    }
  };

  const handleRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * predefinedQuestions.length);
    setPollQuestion(predefinedQuestions[randomIndex]);
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim()) {
      setError('Poll question is required');
      return;
    }
    if (pollOptions.some(opt => !opt.text.trim()) || pollOptions.length < 2) {
      setError('At least two valid poll options are required');
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');

      let media = null;
      if (mediaFile) {
        media = await uploadMedia(mediaFile, mediaType);
        if (!media) throw new Error('Media upload failed');
      }

      const pollData = {
        question: pollQuestion,
        options: pollOptions.map(opt => ({ text: opt.text, votes: 0, image: opt.image })),
        duration: parseInt(pollDuration),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + parseInt(pollDuration) * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: newPostContent.trim(),
          media,
          poll: pollData,
          userId: authUser.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create post: ${errorData.message || response.statusText}`);
      }

      const newPost = await response.json();
      setPosts((prev) => [
        {
          ...newPost,
          comments: 0,
          likes: 0,
          isLiked: false,
          user: {
            id: authUser.uid,
            name: authUser.displayName || 'Unknown User',
            username: authUser.email?.split('@')[0] || 'user',
            avatar: authUser.photoURL || '/default-avatar.png',
            verified: false,
          },
        },
        ...prev,
      ]);
      setNewPostContent('');
      setMediaFile(null);
      setMediaType(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      setPollQuestion('');
      setPollOptions([{ text: '', image: null }, { text: '', image: null }]);
      setPollDuration('7');
      setOptionImages({});
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(`Failed to create post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="poll-creator-overlay">
      <div className="poll-creator-dialog">
        <div className="poll-dialog-header">
          <h3>Create a Movie Poll</h3>
          <button className="poll-random-button" onClick={handleRandomQuestion}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16.5 3 21 7.5 16.5 12M21 7.5H7M7 16.5 3 12 7 7.5M3 12h14" />
            </svg>
          </button>
          <button className="poll-close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="poll-dialog-content">
          <div className="poll-question-section">
            <select
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="poll-question-select"
            >
              <option value="">Custom Question</option>
              {predefinedQuestions.map((q, index) => (
                <option key={index} value={q}>{q}</option>
              ))}
            </select>
            {pollQuestion === '' && (
              <input
                type="text"
                placeholder="Custom Poll Question"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="poll-question-input"
              />
            )}
          </div>
          <div className="poll-options-section">
            {pollOptions.map((option, index) => (
              <div key={index} className="poll-option-row">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) => handlePollOptionChange(index, 'text', e.target.value)}
                  className="poll-option-input"
                />
                <div className="poll-option-actions">
                  <label className="poll-option-image">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => handleOptionImageChange(index, e)}
                    />
                    <span>{optionImages[index] ? 'Change Image' : 'Add Image'}</span>
                  </label>
                  {optionImages[index] && (
                    <img
                      src={optionImages[index]}
                      alt={`Option ${index + 1}`}
                      className="poll-option-image-preview"
                    />
                  )}
                  {pollOptions.length > 2 && (
                    <button
                      className="poll-option-remove"
                      onClick={() => handleRemovePollOption(index)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button className="poll-add-option" onClick={handleAddPollOption}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Option
              </button>
            )}
          </div>
          <div className="poll-duration-section">
            <select
              value={pollDuration}
              onChange={(e) => setPollDuration(e.target.value)}
              className="poll-duration-select"
            >
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
            </select>
          </div>
          {uploadProgress > 0 && (
            <div className="poll-upload-progress">
              Uploading media: {Math.round(uploadProgress)}%
            </div>
          )}
          <div className="poll-preview-section">
            <h4>Poll Preview</h4>
            <div className="poll-preview">
              <p className="poll-preview-question">{pollQuestion || 'Your poll question'}</p>
              {pollOptions.map((option, index) => (
                <div key={index} className="poll-preview-option">
                  {optionImages[index] && (
                    <img
                      src={optionImages[index]}
                      alt={`Option ${index + 1}`}
                      className="poll-preview-option-image"
                    />
                  )}
                  <span>{option.text || `Option ${index + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="poll-dialog-footer">
          <button className="poll-cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="poll-create-button"
            onClick={handleCreatePoll}
            disabled={!pollQuestion.trim() || pollOptions.some(opt => !opt.text.trim()) || pollOptions.length < 2}
          >
            Create Poll
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollCreator;