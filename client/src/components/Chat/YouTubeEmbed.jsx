import React, { useState } from 'react';
import './YouTubeEmbed.css';

/**
 * YouTubeEmbed — Renders YouTube videos inline in chat.
 * Uses youtube-nocookie.com embeds for privacy.
 * Shows "Open on YouTube" fallback if embed is blocked.
 *
 * When `embedded` is true, the header with collapse/dismiss controls is hidden
 * (used by SidePanel which provides its own chrome).
 */
function YouTubeEmbed({ videos, embedded = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  if (dismissed || !videos || videos.length === 0) return null;

  const showList = embedded || !collapsed;

  return (
    <div className="yt-embed" role="region" aria-label="Video tutorials">
      {!embedded && (
        <div className="yt-embed__header">
          <span className="yt-embed__title">Video Tutorials</span>
          <div className="yt-embed__controls">
            <button className="yt-embed__toggle" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
              {collapsed ? 'Show' : 'Hide'}
            </button>
            <button className="yt-embed__dismiss" onClick={() => setDismissed(true)}>Dismiss</button>
          </div>
        </div>
      )}

      {showList && (
        <div className="yt-embed__list">
          {videos.map((video, i) => (
            <div key={video.id || i} className="yt-embed__card">
              {playingId === video.id && video.id ? (
                <div className="yt-embed__player">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="yt-embed__iframe"
                  />
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="yt-embed__external">
                    Having trouble? Open on YouTube
                  </a>
                </div>
              ) : (
                <button className="yt-embed__thumbnail-btn" onClick={() => video.id ? setPlayingId(video.id) : window.open(video.url, '_blank')} aria-label={`Play: ${video.title}`}>
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt="" className="yt-embed__thumbnail" loading="lazy" />
                  ) : (
                    <div className="yt-embed__thumbnail-placeholder" />
                  )}
                  <div className="yt-embed__play-overlay">
                    <span className="yt-embed__play-icon" aria-hidden="true">&#9654;</span>
                  </div>
                </button>
              )}
              <div className="yt-embed__info">
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="yt-embed__video-title">{video.title}</a>
                {video.channel && <span className="yt-embed__channel">{video.channel}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YouTubeEmbed;
