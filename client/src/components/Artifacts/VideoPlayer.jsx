import React, { useState } from 'react';
import './VideoPlayer.css';

/**
 * VideoPlayer -- Full-screen YouTube embed with thumbnail-to-play.
 * Shows a list of videos if multiple; clicking a thumbnail loads the iframe.
 * Uses youtube-nocookie.com for privacy.
 *
 * @param {{
 *   videos: Array<{ id?: string, title: string, url: string, thumbnail?: string, channel?: string }>,
 *   onClose: () => void,
 *   titleId: string,
 * }} props
 */
function VideoPlayer({ videos, onClose, titleId }) {
  const videoList = Array.isArray(videos) ? videos : [videos].filter(Boolean);
  const [activeVideo, setActiveVideo] = useState(null);

  /**
   * Extract YouTube video ID from URL.
   */
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const getThumbnail = (video) => {
    if (video.thumbnail) return video.thumbnail;
    const ytId = getYouTubeId(video.url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return null;
  };

  const getEmbedUrl = (video) => {
    const ytId = getYouTubeId(video.url);
    if (ytId) return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
    return video.url;
  };

  return (
    <div className="pcp-video">
      {/* Top bar */}
      <div className="pcp-overlay-topbar">
        <button
          className="pcp-overlay-topbar__back"
          onClick={onClose}
          aria-label="Close video and return to chat"
        >
          <span aria-hidden="true">&lsaquo;</span> Back to chat
        </button>
      </div>

      {/* Title */}
      <div className="pcp-video__title-section">
        <h1 id={titleId} className="pcp-video__title">
          {videoList.length === 1 ? videoList[0].title : 'Video Tutorials'}
        </h1>
        {videoList.length > 1 && (
          <p className="pcp-video__subtitle">
            {videoList.length} videos
          </p>
        )}
      </div>

      {/* Content */}
      <div className="pcp-video__content">
        {/* Active video player */}
        {activeVideo && (
          <div className="pcp-video__player">
            <div className="pcp-video__embed-wrap">
              <iframe
                className="pcp-video__iframe"
                src={getEmbedUrl(activeVideo)}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <h2 className="pcp-video__active-title">{activeVideo.title}</h2>
            {activeVideo.channel && (
              <p className="pcp-video__active-channel">{activeVideo.channel}</p>
            )}
          </div>
        )}

        {/* Video list */}
        <ul className="pcp-video__list" role="list">
          {videoList.map((video, i) => {
            const thumb = getThumbnail(video);
            const isActive = activeVideo === video;
            return (
              <li key={i} className="pcp-video__list-item">
                <button
                  className={`pcp-video__card ${isActive ? 'pcp-video__card--active' : ''}`}
                  onClick={() => setActiveVideo(isActive ? null : video)}
                  aria-label={`${isActive ? 'Now playing' : 'Play'}: ${video.title}`}
                >
                  {thumb && (
                    <div className="pcp-video__thumb-wrap">
                      <img
                        src={thumb}
                        alt=""
                        className="pcp-video__thumb"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {!isActive && (
                        <span className="pcp-video__play-icon" aria-hidden="true">&#9654;</span>
                      )}
                    </div>
                  )}
                  <div className="pcp-video__card-info">
                    <span className="pcp-video__card-title">{video.title}</span>
                    {video.channel && (
                      <span className="pcp-video__card-channel">{video.channel}</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="pcp-video__footer">
        <button
          className="pcp-btn pcp-btn--primary pcp-video__done-btn"
          onClick={onClose}
          aria-label="Done, back to chat"
        >
          Done &middot; Back to chat
        </button>
      </div>
    </div>
  );
}

export default VideoPlayer;
