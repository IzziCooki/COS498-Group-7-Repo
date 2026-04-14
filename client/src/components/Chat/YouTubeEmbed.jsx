import React, { useState } from 'react';
import './YouTubeEmbed.css';

/**
 * YouTubeEmbed — Renders YouTube videos inline in chat messages.
 * Collapsible and dismissable so users can easily continue reading.
 *
 * @param {{ videos: Array<{id: string, title: string, url: string, thumbnail: string, channel: string}> }} props
 */
function YouTubeEmbed({ videos }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  if (dismissed || !videos || videos.length === 0) return null;

  return (
    <div className="yt-embed" role="region" aria-label="Video tutorials">
      <div className="yt-embed__header">
        <span className="yt-embed__title">Video Tutorials</span>
        <div className="yt-embed__controls">
          <button
            className="yt-embed__toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Show videos' : 'Hide videos'}
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
          <button
            className="yt-embed__dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss videos"
          >
            Dismiss
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="yt-embed__list">
          {videos.map((video, i) => (
            <div key={video.id || i} className="yt-embed__card">
              {playingId === video.id && video.id ? (
                <div className="yt-embed__player">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="yt-embed__iframe"
                  />
                </div>
              ) : (
                <button
                  className="yt-embed__thumbnail-btn"
                  onClick={() => video.id ? setPlayingId(video.id) : window.open(video.url, '_blank')}
                  aria-label={`Play: ${video.title}`}
                >
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="yt-embed__thumbnail"
                      loading="lazy"
                    />
                  ) : (
                    <div className="yt-embed__thumbnail-placeholder" />
                  )}
                  <div className="yt-embed__play-overlay">
                    <span className="yt-embed__play-icon" aria-hidden="true">&#9654;</span>
                  </div>
                </button>
              )}
              <div className="yt-embed__info">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-embed__video-title"
                >
                  {video.title}
                </a>
                {video.channel && (
                  <span className="yt-embed__channel">{video.channel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YouTubeEmbed;
