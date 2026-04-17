import { usePlannerShellStore } from '@planner/state/planner-shell';
import { OriginBoard } from '@planner/features/character-foundation/origin-board';
import { AttributesBoard } from '@planner/features/character-foundation/attributes-board';
import { BuildProgressionBoard } from '@planner/features/level-progression/build-progression-board';
import { SkillBoard } from '@planner/features/skills/skill-board';
import { FeatBoard } from '@planner/features/feats/feat-board';
import { shellCopyEs } from '@planner/lib/copy/es';

export function CenterContent() {
  const activeOriginStep = usePlannerShellStore((state) => state.activeOriginStep);
  const expandedLevel = usePlannerShellStore((state) => state.expandedLevel);
  const activeLevelSubStep = usePlannerShellStore((state) => state.activeLevelSubStep);

  // Origin steps
  if (activeOriginStep === 'race' || activeOriginStep === 'alignment') {
    return <OriginBoard activeStep={activeOriginStep} />;
  }
  if (activeOriginStep === 'attributes') {
    return <AttributesBoard />;
  }

  // Level sub-steps
  if (expandedLevel !== null && activeLevelSubStep !== null) {
    switch (activeLevelSubStep) {
      case 'class':
        return <BuildProgressionBoard />;
      case 'skills':
        return <SkillBoard />;
      case 'feats':
        return <FeatBoard />;
    }
  }

  // Default empty state
  return <PlaceholderScreen
    title={shellCopyEs.stepper.heading}
    body={shellCopyEs.stepper.emptySheetBody}
  />;
}

function PlaceholderScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="placeholder-screen">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
