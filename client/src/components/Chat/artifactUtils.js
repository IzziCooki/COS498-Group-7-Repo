export function getArtifactLabel(artifact) {
  if (artifact.practice) return 'Practice Mode';
  if (artifact.guide) return artifact.guide.title || 'Guide';
  if (artifact.resources) return artifact.resources.topic ? `Resources: ${artifact.resources.topic}` : 'Resources';
  if (artifact.findings) return artifact.findings.title || 'Diagnostic Details';
  if (artifact.videos) return 'Video Tutorials';
  return 'Artifact';
}
