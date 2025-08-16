import React, { useState, useEffect, useRef } from 'react';
import { Search, Home, MessageCircle, Bell, Settings, Heart, MessageSquare, Share, Camera, Video, BarChart3, Calendar, MoreHorizontal, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import Avatar from '../components/fallback/Avatar';
import PollCreator from '../components/ui/pollCreator';
import '../styles/social-home.scss';

const SocialPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [skills, setSkills] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { user: authUser } = useAuth();
  const API_BASE_URL = 'http://localhost:5006/api/social';

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

  const handleVotePoll = async (postId, optionIndex) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/poll/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ optionIndex, userId: authUser.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to vote: ${errorData.message || response.statusText}`);
      }

      const updatedPost = await response.json();
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, poll: updatedPost.poll, hasVoted: true } : post))
      );
    } catch (err) {
      console.error('Error voting on poll:', err);
      setError(`Failed to vote: ${err.message}`);
    }
  };

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');

      const [profileRes, friendsRes, skillsRes, communitiesRes, activitiesRes, postsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/profile`, { headers }),
        fetch(`${API_BASE_URL}/friends`, { headers }),
        fetch(`${API_BASE_URL}/skills`, { headers }),
        fetch(`${API_BASE_URL}/communities`, { headers }),
        fetch(`${API_BASE_URL}/activities`, { headers }),
        fetch(`${API_BASE_URL}/posts`, { headers }),
      ]);

      if (!profileRes.ok || !friendsRes.ok || !skillsRes.ok || !communitiesRes.ok || !activitiesRes.ok || !postsRes.ok) {
        const errors = [];
        if (!profileRes.ok) errors.push(`Profile: ${profileRes.statusText}`);
        if (!friendsRes.ok) errors.push(`Friends: ${friendsRes.statusText}`);
        if (!skillsRes.ok) errors.push(`Skills: ${skillsRes.statusText}`);
        if (!communitiesRes.ok) errors.push(`Communities: ${communitiesRes.statusText}`);
        if (!activitiesRes.ok) errors.push(`Activities: ${activitiesRes.statusText}`);
        if (!postsRes.ok) errors.push(`Posts: ${postsRes.statusText}`);
        throw new Error(`API requests failed: ${errors.join(', ')}`);
      }

      const [profile, friendsData, skillsData, communitiesData, activitiesData, postsData] = await Promise.all([
        profileRes.json(),
        friendsRes.json(),
        skillsRes.json(),
        communitiesRes.json(),
        activitiesRes.json(),
        postsRes.json(),
      ]);

      setUser({
        id: authUser?.uid || profile.id || 'unknown',
        name: profile.name || profile.displayName || authUser?.displayName || 'Unknown User',
        username: profile.username || authUser?.email?.split('@')[0] || 'user',
        avatar: profile.avatar || profile.photoURL || authUser?.photoURL || '/default-avatar.png',
        followers: profile.followers || 0,
        following: profile.following || 0,
        bio: profile.bio || '',
        verified: profile.verified || false,
      });
      setFriends(
        friendsData.map((friend) => ({
          ...friend,
          name: friend.name || friend.displayName || 'Unknown Friend',
          avatar: friend.avatar || friend.photoURL || '/default-avatar.png',
        }))
      );
      setSkills(skillsData);
      setCommunities(communitiesData);
      setActivities(activitiesData);
      setPosts(
        postsData.map((post) => ({
          ...post,
          user: {
            id: post.user?.id || post.userId || 'unknown',
            name: post.user?.name || post.user?.displayName || 'Unknown User',
            username: post.user?.username || `@user${post.user?.id?.slice(0, 6) || 'unknown'}`,
            avatar: post.user?.avatar || post.user?.photoURL || '/default-avatar.png',
            verified: post.user?.verified || false,
          },
          comments: post.comments || 0,
          likes: post.likes || 0,
          isLiked: post.isLiked || false,
          poll: post.poll || null,
          hasVoted: post.hasVoted || false,
        }))
      );
    } catch (err) {
      console.error('Error fetching social data:', err);
      setError(`Failed to load social data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!authUser || !authUser.uid) {
      setError('You must be signed in to create a post.');
      return;
    }
    if (!newPostContent.trim() && !mediaFile) {
      setError('Post content or media is required.');
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

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: newPostContent.trim(),
          media,
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
            name: authUser.displayName || user?.name || 'Unknown User',
            username: authUser.email?.split('@')[0] || user?.username || 'user',
            avatar: authUser.photoURL || user?.avatar || '/default-avatar.png',
            verified: user?.verified || false,
          },
        },
        ...prev,
      ]);
      setNewPostContent('');
      setMediaFile(null);
      setMediaType(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    } catch (err) {
      console.error('Error creating post:', err);
      setError(`Failed to create post: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'photo' && !file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG)');
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      setError('Please select a valid video file (MP4, WebM)');
      return;
    }

    const maxSize = type === 'photo' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size exceeds ${type === 'photo' ? '5MB' : '50MB'} limit`);
      return;
    }

    setMediaFile(file);
    setMediaType(type);
  };

  const handleToggleLike = async (postId) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to toggle like: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: result.liked,
              likes: result.liked ? post.likes + 1 : post.likes - 1,
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      setError(`Failed to toggle like: ${err.message}`);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: newComment, userId: authUser.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to add comment: ${errorData.message || response.statusText}`);
      }

      const newCommentData = await response.json();
      setPostComments((prev) => ({
        ...prev,
        [postId]: [
          {
            id: newCommentData.id,
            postId,
            content: newCommentData.content,
            time: 'just now',
            user: {
              id: authUser?.uid || 'unknown',
              name: authUser?.displayName || user?.name || 'Unknown User',
              username: authUser?.email?.split('@')[0] || user?.username || 'user',
              avatar: authUser?.photoURL || user?.avatar || '/default-avatar.png',
              verified: user?.verified || false,
            },
          },
          ...(prev[postId] || []),
        ],
      }));

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return { ...post, comments: (post.comments || 0) + 1 };
          }
          return post;
        })
      );

      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(`Failed to add comment: ${err.message}`);
    }
  };

  const handleToggleCommunity = async (communityId) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');
      const response = await fetch(`${API_BASE_URL}/communities/${communityId}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to toggle community: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      setCommunities((prev) =>
        prev.map((community) => {
          if (community.id === communityId) {
            return { ...community, joined: result.joined };
          }
          return community;
        })
      );
    } catch (err) {
      console.error('Error toggling community:', err);
      setError(`Failed to toggle community: ${err.message}`);
    }
  };

  const handleToggleFollow = async (userId) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');
      const response = await fetch(`${API_BASE_URL}/follow/${userId}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to toggle follow: ${errorData.message || response.statusText}`);
      }

      await fetchSocialData();
    } catch (err) {
      console.error('Error toggling follow:', err);
      setError(`Failed to toggle follow: ${err.message}`);
    }
  };

  const fetchCommentsForPost = async (postId) => {
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('Missing authentication token');
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to fetch comments: ${errorData.message || res.statusText}`);
      }
      const data = await res.json();
      setPostComments((prev) => ({
        ...prev,
        [postId]: data.map((comment) => ({
          id: comment.id,
          postId: comment.postId,
          content: comment.content,
          time: comment.time || 'just now',
          user: {
            id: comment.user?.id || comment.userId || 'unknown',
            name: comment.user?.name || comment.user?.displayName || 'Unknown User',
            username: comment.user?.username || `@user${comment.user?.id?.slice(0, 6) || 'unknown'}`,
            avatar: comment.user?.avatar || comment.user?.photoURL || '/default-avatar.png',
            verified: comment.user?.verified || false,
          },
        })),
      }));
    } catch (e) {
      console.error(`Error fetching comments for post ${postId}:`, e);
      setPostComments((prev) => ({ ...prev, [postId]: [] }));
      setError(`Failed to load comments: ${e.message}`);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchSocialData();
    } else {
      setError('Please sign in to view the social feed.');
      setLoading(false);
    }
  }, [authUser]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'profile', icon: Settings, label: 'Customize Profile' },
  ];

  const handleToggleComments = (postId) => {
    if (commentingPostId === postId) {
      setCommentingPostId(null);
    } else {
      setCommentingPostId(postId);
      if (!postComments[postId]) {
        fetchCommentsForPost(postId);
      }
    }
  };

  if (loading && !posts.length) {
    return (
      <div className={`social-page ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-state">
          <div>Loading social feed...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`social-page ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="error-state">
          <div>Error: {error}</div>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`social-page ${isDarkMode ? 'dark' : 'light'}`}>
      <header className="header">
        <div className="header-left">
          <div className="logo">streamverse</div>
        </div>
        <div className="header-center">
          <nav className="main-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={20} />
              </button>
            ))}
          </nav>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="user-info">
            <Avatar
              src={authUser?.photoURL || user?.avatar || '/default-avatar.png'}
              alt={user?.name || user?.username || 'User'}
              className="user-avatar"
            />
            <span className="user-name">{user?.username || 'user'}</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <aside className="left-sidebar">
          <div className="user-profile">
            <div className="profile-header">
              <div className="profile-avatar">
                <Avatar
                  src={authUser?.photoURL || user?.avatar || '/default-avatar.png'}
                  alt={user?.name || user?.username || 'User'}
                  className="profile-avatar-img"
                />
                <div className="avatar-rings"></div>
              </div>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-number">{user?.followers || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{user?.following || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{user?.name || 'Unknown User'}</h3>
              <p className="profile-username">{user?.username || '@user'}</p>
              <p className="profile-bio">{user?.bio || 'No bio available'}</p>
              <button className="profile-button">My Profile</button>
            </div>
          </div>

          <div className="friends-section">
            <div className="friends-grid">
              {friends.map((friend, index) => (
                <div key={friend.id || index} className="friend-avatar">
                  <Avatar
                    src={friend.avatar}
                    alt={friend.name}
                    className="friend-avatar-img"
                  />
                  <span className="friend-name">{friend.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="skills-section">
            <h4>Interests</h4>
            <div className="skills-grid">
              {skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        </aside>

        <div className="center-content">
          <div className="post-creator">
            <div className="creator-header">
              <Avatar
                src={authUser?.photoURL || user?.avatar || '/default-avatar.png'}
                alt={user?.name || user?.username || 'User'}
                className="creator-avatar"
              />
              <input
                type="text"
                placeholder="Share your thoughts about movies..."
                className="creator-input"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePost()}
              />
            </div>
            <div className="creator-actions">
              <label className="action-button">
                <Camera size={16} />
                Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'photo')}
                  ref={photoInputRef}
                />
              </label>
              <label className="action-button">
                <Video size={16} />
                Video
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, 'video')}
                  ref={videoInputRef}
                />
              </label>
              <button
                className="action-button"
                onClick={() => setPollDialogOpen(true)}
              >
                <BarChart3 size={16} />
                Poll
              </button>
              <button className="action-button">
                <Calendar size={16} />
                Schedule
              </button>
              <button
                className="post-button"
                onClick={handleCreatePost}
                disabled={(!newPostContent.trim() && !mediaFile) || uploadProgress > 0 || !authUser}
              >
                {uploadProgress > 0 ? `Uploading ${Math.round(uploadProgress)}%` : 'Post'}
              </button>
            </div>
            {mediaFile && (
              <div className="media-preview">
                {mediaType === 'photo' ? (
                  <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="preview-image" />
                ) : (
                  <video src={URL.createObjectURL(mediaFile)} controls className="preview-video" />
                )}
                <div className="media-info">
                  <p>{mediaFile.name}</p>
                  <button
                    className="remove-media"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaType(null);
                      if (photoInputRef.current) photoInputRef.current.value = '';
                      if (videoInputRef.current) videoInputRef.current.value = '';
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <PollCreator
            authUser={authUser}
            storage={storage}
            newPostContent={newPostContent}
            mediaFile={mediaFile}
            mediaType={mediaType}
            photoInputRef={photoInputRef}
            videoInputRef={videoInputRef}
            setPosts={setPosts}
            setNewPostContent={setNewPostContent}
            setMediaFile={setMediaFile}
            setMediaType={setMediaType}
            setError={setError}
            setLoading={setLoading}
            API_BASE_URL={API_BASE_URL}
            open={pollDialogOpen}
            onClose={() => setPollDialogOpen(false)}
          />

          {posts.map((post) => (
            <div key={post.id} className="post">
              <div className="post-header">
                <div className="post-user">
                  <Avatar
                    src={post.user?.avatar || '/default-avatar.png'}
                    alt={post.user?.name || post.user?.username || 'User'}
                    className="post-avatar"
                  />
                  <div className="post-user-info">
                    <div className="post-user-name">
                      <span>{post.user?.name || 'Unknown User'}</span>
                      {post.user?.verified && <span className="verified-badge">✓</span>}
                    </div>
                    <span className="post-username">{post.user?.username || '@user'}</span>
                  </div>
                  <span className="post-time">• {post.time || 'just now'}</span>
                </div>
                <button className="post-menu">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <div className="post-content">
                <p>{post.content}</p>
                {post.media && (
                  <div className="post-media">
                    {post.media.type === 'photo' ? (
                      <img src={post.media.url} alt="Post content" className="post-image" />
                    ) : (
                      <video src={post.media.url} controls className="post-video" />
                    )}
                  </div>
                )}
                {post.poll && (
                  <div className="post-poll">
                    <h4>{post.poll.question}</h4>
                    {post.poll.options.map((option, index) => {
                      const totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                      const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
                      const isExpired = new Date(post.poll.expiresAt) < new Date();
                      return (
                        <div key={index} className="poll-option">
                          <button
                            className="poll-option-button"
                            onClick={() => handleVotePoll(post.id, index)}
                            disabled={!authUser || post.hasVoted || isExpired}
                          >
                            {option.text}
                          </button>
                          <div className="poll-progress" style={{ width: `${percentage}%` }}></div>
                          <span>{option.votes} votes ({percentage}%)</span>
                        </div>
                      );
                    })}
                    <p>{isExpired ? 'Poll closed' : `Closes ${new Date(post.poll.expiresAt).toLocaleDateString()}`}</p>
                  </div>
                )}
              </div>
              <div className="post-actions">
                <button
                  className={`post-action ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(post.id)}
                  disabled={!authUser}
                >
                  <Heart size={16} />
                  <span>{post.likes || 0}</span>
                </button>
                <button
                  className={`post-action ${commentingPostId === post.id ? 'active' : ''}`}
                  onClick={() => handleToggleComments(post.id)}
                  disabled={!authUser}
                >
                  <MessageSquare size={16} />
                  <span>{post.comments || 0}</span>
                </button>
                <button className="post-action">
                  <Share size={16} />
                </button>
              </div>

              {commentingPostId === post.id && (
                <div className="post-comment">
                  <Avatar
                    src={authUser?.photoURL || user?.avatar || '/default-avatar.png'}
                    alt={user?.name || user?.username || 'User'}
                    className="comment-avatar"
                  />
                  <input
                    type="text"
                    placeholder="Write your comment..."
                    className="comment-input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    disabled={!authUser}
                  />
                </div>
              )}

              {commentingPostId === post.id && (
                <div className="post-comments-list">
                  {Array.isArray(postComments[post.id]) && postComments[post.id].length > 0 ? (
                    postComments[post.id].map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <Avatar
                          src={comment.user?.avatar || '/default-avatar.png'}
                          alt={comment.user?.name || comment.user?.username || 'User'}
                          className="comment-avatar"
                        />
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-user">{comment.user?.name || 'Unknown User'}</span>
                            <span className="comment-time">• {comment.time}</span>
                          </div>
                          <div className="comment-text">{comment.content}</div>
                        </div>
                      </div>
                    ))
                  ) : loadingComments[post.id] ? (
                    <div className="loading-comments">Loading comments...</div>
                  ) : (
                    <div className="no-comments">No comments yet.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <aside className="right-sidebar">
          <div className="communities-section">
            <div className="section-header">
              <h4>Communities</h4>
              <Search size={16} />
            </div>
            {communities.map((community, index) => (
              <div key={community.id || index} className="community-item">
                <div className="community-info">
                  <div className="community-avatar"></div>
                  <div className="community-details">
                    <span className="community-name">{community.name}</span>
                    <span className="community-members">• {community.members} members</span>
                  </div>
                </div>
                <button
                  className={`community-action ${community.joined ? 'joined' : ''}`}
                  onClick={() => handleToggleCommunity(community.id)}
                  disabled={!authUser}
                >
                  {community.joined ? 'Leave' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default SocialPage;