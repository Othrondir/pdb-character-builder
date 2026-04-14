import {
  BookOpenText,
  Gem,
  Hammer,
  ScrollText,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { PlannerSectionId } from '@planner/lib/sections';
import { plannerSections } from '@planner/lib/sections';
import { shellCopyEs } from '@planner/lib/copy/es';
import { usePlannerShellStore } from '@planner/state/planner-shell';

const sectionIcons = {
  abilities: Gem,
  build: Shield,
  skills: Hammer,
  spells: Sparkles,
  stats: ScrollText,
  summary: BookOpenText,
  utilities: Wrench,
} satisfies Record<PlannerSectionId, typeof Shield>;

interface SectionNavProps {
  currentSectionId: PlannerSectionId;
}

export function SectionNav({ currentSectionId }: SectionNavProps) {
  const setActiveSection = usePlannerShellStore((state) => state.setActiveSection);
  const setSummaryPanelOpen = usePlannerShellStore(
    (state) => state.setSummaryPanelOpen,
  );

  return (
    <nav
      aria-label="Navegación principal del planificador"
      className="planner-nav planner-panel planner-panel--nav"
    >
      <div className="planner-nav__heading">
        <p className="planner-nav__eyebrow">{shellCopyEs.subtitle}</p>
        <h2>{shellCopyEs.appTitle}</h2>
      </div>

      <ul className="planner-nav__list">
        {plannerSections.map((section) => {
          const Icon = sectionIcons[section.id];
          const isActive = section.id === currentSectionId;

          return (
            <li key={section.id}>
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={`planner-nav__link${isActive ? ' is-active' : ''}`}
                onClick={() => {
                  setActiveSection(section.id);
                  setSummaryPanelOpen(true);
                }}
                to={section.path}
              >
                <Icon aria-hidden="true" className="planner-nav__icon" />
                <span>{section.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
