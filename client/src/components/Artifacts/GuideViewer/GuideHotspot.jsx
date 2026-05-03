import React from 'react';
import './GuideHotspot.css';

/**
 * GuideHotspot -- Pulsing concentric rings hotspot overlay, positioned by
 * percentage coordinates on a screenshot. Uses 3 concentric rings staggered
 * by 0.4s, scaling 1->1.6 over 1.4s (D3 spec S2).
 *
 * Reduced-motion fallback: static ring + arrow indicator, no animation.
 *
 * @param {{ xPercent: number, yPercent: number }} props
 */
function GuideHotspot({ xPercent, yPercent }) {
  return (
    <div
      className="pcp-hotspot"
      style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
      aria-hidden="true"
    >
      {/* Inner dot */}
      <div className="pcp-hotspot__dot" />
      {/* Three concentric animated rings */}
      <div className="pcp-hotspot__ring pcp-hotspot__ring--1" />
      <div className="pcp-hotspot__ring pcp-hotspot__ring--2" />
      <div className="pcp-hotspot__ring pcp-hotspot__ring--3" />
      {/* Reduced motion fallback arrow */}
      <div className="pcp-hotspot__arrow" />
    </div>
  );
}

export default GuideHotspot;
