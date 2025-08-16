import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import MovieMarathonPlanner from '../components/MovieMarathonPlanner';
import WatchPartyPlanner from '../components/WatchPartyPlanner';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import '../styles/tools.scss';
import '../styles/watchparty.scss';
import '../styles/marathon-planner.scss';

const ToolsPage = () => {
  const { isDarkMode } = useAuth();
  const [expandedTools, setExpandedTools] = useState({});

  const toggleTool = (toolId) => {
    setExpandedTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const tools = [
    {
      id: 'movie-marathon-planner',
      title: 'Movie Marathon Planner',
      description: 'Search and add up to 30 movies to your marathon bucket, then calculate the total runtime to plan your viewing time.',
      component: <MovieMarathonPlanner />,
    },
    {
      id: 'watch-party-planner',
      title: 'Watch Party Scheduler',
      description: 'Plan watch parties with friends, schedule movies on a calendar, and chat in real-time with pinned movie details.',
      component: <WatchPartyPlanner />,
    },
  ];

  return (
    <div className={`tools-page ${isDarkMode ? 'dark' : ''}`}>
      <Navbar />
      <div className="tools-page-content">
        <div className="tools-page-list">
          {tools.map((tool) => (
            <div key={tool.id} className="tools-page-item">
              <div className="tools-banner" onClick={() => toggleTool(tool.id)}>
                <div className="tools-banner-content">
                  <h2>{tool.title}</h2>
                  <p>{tool.description}</p>
                </div>
                <div className="tools-banner-icon">
                  {expandedTools[tool.id] ? <FaChevronDown /> : <FaChevronRight />}
                </div>
              </div>
              {expandedTools[tool.id] && (
                <div className="tools-content">
                  {tool.component}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;