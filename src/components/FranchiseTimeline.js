
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import '../styles/franchise-timeline.scss';

// Debounce utility to prevent rapid event triggers
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const FranchiseTimeline = ({ movies }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!movies || movies.length === 0) return;

    // Prepare and validate data
    const data = movies
      .filter((m) => 
        m.release_date && 
        m.id && 
        typeof m.title === 'string' && 
        m.title.trim() !== '' && 
        Array.isArray(m.genre_ids) // Ensure genre_ids is an array
      )
      .map((m, i) => ({
        id: m.id,
        title: m.title.trim(),
        date: new Date(m.release_date),
        year: new Date(m.release_date).getFullYear(),
        genre_ids: m.genre_ids, // Already validated as an array
        index: i,
      }))
      .sort((a, b) => a.date - b.date);

    // Log invalid movies for debugging
    const invalidMovies = movies.filter((m) => 
      !m.release_date || 
      !m.id || 
      typeof m.title !== 'string' || 
      m.title.trim() === '' || 
      !Array.isArray(m.genre_ids)
    );
    if (invalidMovies.length > 0) {
      console.warn('Invalid movies filtered out:', invalidMovies);
    }

    if (data.length === 0) return;

    // Dynamic sizing with better mobile support
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const width = Math.max(containerWidth, data.length * 100);
    const height = window.innerWidth <= 768 ? 350 : 450;
    const margin = { top: 40, right: 60, bottom: 100, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG with appropriate dimensions
    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('opacity', 0);

    // Define gradient for background
    const defs = svg.append('defs');
    const backgroundGradient = defs
      .append('linearGradient')
      .attr('id', 'background-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    backgroundGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(37, 99, 235, 0.1)');
    backgroundGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(147, 51, 234, 0.1)');

    // Background rect with subtle gradient
    svg
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', 'url(#background-gradient)');

    // Create time scale with proper spacing
    const timeExtent = d3.extent(data, (d) => d.date);
    const earliestYear = timeExtent[0].getFullYear();
    const latestYear = timeExtent[1].getFullYear();
    
    // Add padding to time scale (one year before and after)
    const startDate = new Date(earliestYear - 1, 0, 1);
    const endDate = new Date(latestYear + 1, 11, 31);
    
    const x = d3
      .scaleTime()
      .domain([startDate, endDate])
      .range([0, innerWidth]);

    // Create the wave path for timeline with consistent amplitude
    const midY = innerHeight / 2;
    const amplitude = Math.min(innerHeight * 0.1, 20);
    
    // Generate points for a wavy timeline
    const generateWavePath = () => {
      const numPoints = Math.max(innerWidth / 10, 40);
      const points = [];
      
      for (let i = 0; i < numPoints; i++) {
        const xPos = (i / (numPoints - 1)) * innerWidth;
        const yPos = midY + amplitude * Math.sin((xPos / innerWidth) * Math.PI * 3);
        points.push([xPos, yPos]);
      }
      
      return points;
    };
    
    const wavePoints = generateWavePath();
    
    // Calculate y-position on wave for a given x position
    const getYOnWave = (xPos) => {
      const relativeX = xPos / innerWidth;
      return midY + amplitude * Math.sin(relativeX * Math.PI * 3);
    };

    // Draw the wavy timeline
    const line = d3
      .line()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveCatmullRom);

    svg
      .append('path')
      .datum(wavePoints)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1);

    // Genre colors
    const genreColors = {
      28: '#3b82f6',
      12: '#ef4444',
      16: '#22c55e',
      35: '#f59e0b',
      80: '#8b5cf6',
      99: '#6b7280',
      18: '#ec4899',
      10751: '#10b981',
      14: '#a855f7',
      36: '#64748b',
      27: '#dc2626',
      10402: '#f97316',
      9648: '#6d28d9',
      10749: '#db2777',
      878: '#8b5cf6',
      10770: '#f87171',
      53: '#475569',
      10752: '#78716c',
      37: '#d97706',
      default: '#9ca3af',
    };

    // Glow filter for hover effect
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Calculate positions for nodes and labels to avoid overlaps
    const calculatePositions = () => {
      const nodeRadius = window.innerWidth <= 768 ? 8 : 10;
      const minNodeDistance = nodeRadius * 5;
      const labelHeight = window.innerWidth <= 768 ? 16 : 20;
      const fontSize = window.innerWidth <= 768 ? 12 : 14;
      
      // First pass: position nodes on x-axis based on date
      data.forEach(d => {
        d.x = x(d.date);
        d.y = getYOnWave(d.x);
      });
      
      // Second pass: adjust x positions to ensure minimum spacing
      for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1];
        const curr = data[i];
        const minDist = minNodeDistance;
        
        if (curr.x - prev.x < minDist) {
          curr.x = prev.x + minDist;
        }
      }
      
      // Third pass: determine label positions (above or below the timeline)
      data.forEach((d, i) => {
        // Calculate lines for wrapped text
        const maxLabelWidth = 120;
        const charWidth = fontSize * 0.6;
        
        // Wrap text into lines
        const words = d.title.split(' ');
        let lines = [];
        let currentLine = words[0] || '';
        
        for (let j = 1; j < words.length; j++) {
          const testLine = currentLine + ' ' + words[j];
          if (testLine.length * charWidth <= maxLabelWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = words[j];
          }
        }
        lines.push(currentLine);
        d.lines = lines;
        
        // Alternate labels above and below timeline
        const pattern = i % 3;
        if (pattern === 0) {
          d.labelY = d.y - (nodeRadius + 15 + (lines.length * labelHeight));
          d.labelPosition = 'above';
        } else if (pattern === 1) {
          d.labelY = d.y + (nodeRadius + 20);
          d.labelPosition = 'below';
        } else {
          d.labelY = d.y - (nodeRadius + 15 + (lines.length * labelHeight)) - 15;
          d.labelPosition = 'above';
        }
        
        // Ensure labels stay within bounds
        if (d.labelPosition === 'above') {
          d.labelY = Math.max(0, d.labelY);
        } else {
          d.labelY = Math.min(innerHeight - (lines.length * labelHeight), d.labelY);
        }
      });
      
      return {
        nodeRadius,
        labelHeight,
        fontSize
      };
    };
    
    const { nodeRadius, labelHeight, fontSize } = calculatePositions();

    // Year labels - positioned opposite to movie labels
    svg
      .selectAll('.year-tick')
      .data(data)
      .enter()
      .append('line')
      .attr('class', 'year-tick')
      .attr('x1', d => d.x)
      .attr('x2', d => d.x)
      .attr('y1', d => d.y - 15)
      .attr('y2', d => d.y + 15)
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)
      .style('opacity', 0)
      .transition()
      .duration(600)
      .delay((d, i) => i * 40)
      .style('opacity', 1);

    svg
      .selectAll('.year-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'year-label')
      .attr('x', d => d.x)
      .attr('y', d => d.labelPosition === 'above' ? d.y + 35 : d.y - 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', window.innerWidth <= 768 ? '12px' : '14px')
      .attr('fill', '#e0e0e0')
      .text(d => d.year)
      .style('opacity', 0)
      .transition()
      .duration(600)
      .delay((d, i) => i * 40)
      .style('opacity', 1);

    // Create movie nodes with labels
    const movieGroups = svg
      .selectAll('.movie-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'movie-group')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .attr('role', 'button')
      .attr('aria-label', d => `View details for ${d.title}`)
      .attr('tabindex', '0')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        navigate(`/movie/${d.id}`);
      })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation();
          navigate(`/movie/${d.id}`);
        }
      });

    // Draw connecting lines from node to label
    movieGroups
      .append('line')
      .attr('class', 'connector')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', d => d.labelPosition === 'above' ? -nodeRadius : nodeRadius)
      .attr('stroke', d => genreColors[d.genre_ids[0]] || genreColors.default)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '3,2')
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 80 + 200)
      .attr('y2', d => d.labelPosition === 'above' ? d.labelY - d.y + labelHeight : d.labelY - d.y)
      .style('opacity', 1);

    // Draw movie nodes (circles)
    movieGroups
      .append('circle')
      .attr('r', 0)
      .attr('fill', d => genreColors[d.genre_ids[0]] || genreColors.default)
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 1.5)
      .transition()
      .duration(800)
      .delay((d, i) => i * 80)
      .attr('r', nodeRadius)
      .ease(d3.easeBounce);

    // Add multi-line text labels
    movieGroups.each(function(d) {
      const text = d3.select(this)
        .append('text')
        .attr('class', 'movie-label')
        .attr('x', 0)
        .attr('y', d.labelPosition === 'above' ? d.labelY - d.y : d.labelY - d.y)
        .attr('text-anchor', 'middle')
        .attr('font-size', fontSize + 'px')
        .attr('fill', '#e0e0e0')
        .style('opacity', 0);

      (d.lines || []).forEach((line, i) => {
        text
          .append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? 0 : labelHeight)
          .text(line);
      });

      text.transition()
        .duration(800)
        .delay((d, i) => i * 80 + 200)
        .style('opacity', 1);
    });

    // Tooltip implementation
    const showTooltip = debounce((d, position) => {
      d3.selectAll('.tooltip').remove();
      const maxWidth = 200;
      const lineHeight = 20;
      const padding = 10;

      // Calculate tooltip dimensions
      const tooltipWidth = Math.min(maxWidth, Math.max(...d.lines.map(line => line.length * (fontSize * 0.6))) + 2 * padding);
      const tooltipHeight = d.lines.length * lineHeight + 2 * padding;

      // Position tooltip
      const [xPos, yPos] = position;
      const adjustedX = Math.max(0, Math.min(innerWidth - tooltipWidth, xPos - tooltipWidth / 2));
      const adjustedY = d.labelPosition === 'above' ? yPos + 40 : yPos - tooltipHeight - 20;
      const finalY = Math.max(0, Math.min(innerHeight - tooltipHeight, adjustedY));

      const tooltip = svg
        .append('g')
        .attr('class', 'tooltip')
        .attr('pointer-events', 'none')
        .style('opacity', 0);

      tooltip
        .append('rect')
        .attr('x', adjustedX)
        .attr('y', finalY)
        .attr('width', tooltipWidth)
        .attr('height', tooltipHeight)
        .attr('rx', 8)
        .attr('fill', 'rgba(20, 20, 20, 0.9)')
        .attr('stroke', d.genre_ids && d.genre_ids.length > 0 ? genreColors[d.genre_ids[0]] : 'rgba(37, 99, 235, 0.5)') // Fallback if genre_ids is missing
        .attr('stroke-width', 1.5);

      const text = tooltip
        .append('text')
        .attr('x', adjustedX + padding)
        .attr('y', finalY + padding + lineHeight / 2)
        .attr('fill', '#ffffff')
        .attr('font-size', fontSize + 'px')
        .attr('font-weight', '500');

      d.lines.forEach((line, i) => {
        text
          .append('tspan')
          .attr('x', adjustedX + padding)
          .attr('dy', i === 0 ? 0 : lineHeight)
          .text(line);
      });

      tooltip.transition().duration(200).style('opacity', 1);
    }, 100);

    const hideTooltip = debounce(() => {
      svg.selectAll('.tooltip').transition().duration(200).style('opacity', 0).remove();
    }, 100);

    // Add hover interactions
    movieGroups
      .on('mouseover', function (event, d) {
        const [xPos, yPos] = d3.pointer(event, svg.node());
        
        // Highlight node
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', nodeRadius * 1.3)
          .style('filter', 'url(#glow)');
          
        // Highlight connector
        d3.select(this)
          .select('.connector')
          .transition()
          .duration(200)
          .attr('stroke-opacity', 0.8)
          .attr('stroke-width', 1.5);
          
        // Highlight label
        d3.select(this)
          .select('.movie-label')
          .transition()
          .duration(200)
          .style('opacity', 0.9)
          .style('fill', '#ffffff');
          
        // Show tooltip
        showTooltip(d, [xPos, yPos]);
      })
      .on('mouseout', function () {
        // Reset node
        d3.select(this)
          .select('circle')
          .transition()
          .duration(200)
          .attr('r', nodeRadius)
          .style('filter', 'none');
          
        // Reset connector
        d3.select(this)
          .select('.connector')
          .transition()
          .duration(200)
          .attr('stroke-opacity', 0.5)
          .attr('stroke-width', 1);
          
        // Reset label
        d3.select(this)
          .select('.movie-label')
          .transition()
          .duration(200)
          .style('opacity', 1)
          .style('fill', '#e0e0e0');
          
        // Hide tooltip
        hideTooltip();
      });

    // Fade in the SVG
    svg.transition().duration(600).style('opacity', 1);
    
    // Add responsive behavior
    const handleResize = debounce(() => {
      const newWidth = containerRef.current.getBoundingClientRect().width;
      d3.select(svgRef.current)
        .attr('width', newWidth)
        .attr('viewBox', `0 0 ${width} ${height}`);
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    
  }, [movies, navigate]);

  return (
    <div className="timeline-container" ref={containerRef}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default FranchiseTimeline;
