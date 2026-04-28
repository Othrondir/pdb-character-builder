export function extractFeatFamilyTargetLabel(
  familyLabel: string,
  targetLabel: string,
): string {
  const trimmedFamilyLabel = familyLabel.trim();
  const trimmedTargetLabel = targetLabel.trim();
  const familyPrefix = `${trimmedFamilyLabel} (`;

  if (
    trimmedTargetLabel.startsWith(familyPrefix) &&
    trimmedTargetLabel.endsWith(')')
  ) {
    return trimmedTargetLabel
      .slice(familyPrefix.length, -1)
      .trim();
  }

  if (trimmedTargetLabel.startsWith(trimmedFamilyLabel)) {
    const suffix = trimmedTargetLabel
      .slice(trimmedFamilyLabel.length)
      .trim()
      .replace(/^[\s:-]+/, '');
    if (suffix.length > 0) {
      return suffix;
    }
  }

  return trimmedTargetLabel;
}
