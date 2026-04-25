import React from 'react';

// AnimatedHotspot — a pulsing red ring drawn on top of a guide step's reference
// image at a given coordinate. Pure presentational. The parent must be
// position: relative so this component can position itself absolutely
// relative to the image. Coordinates are percentages of the parent's width
// and height so the hotspot stays anchored as the image scales responsively.
//
// Honors prefers-reduced-motion via the CSS media query in CommandGuide.css —
// users who turn off animation get a static halo instead of a pulse.
function AnimatedHotspot({ x, y, label }) {
  return (
    <div className="hotspot" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="hotspot__ring" />
      {label && <div className="hotspot__label">{label}</div>}
    </div>
  );
}

export default AnimatedHotspot;
