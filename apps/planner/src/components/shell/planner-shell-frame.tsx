import { useEffect } from 'react';
import { Menu, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Outlet, useLocation } from '@tanstack/react-router';
import { SectionNav } from '@planner/components/shell/section-nav';
import { SummaryPanel } from '@planner/components/shell/summary-panel';
import { getSectionByPathname } from '@planner/lib/sections';
import { shellCopyEs } from '@planner/lib/copy/es';
import { usePlannerShellStore } from '@planner/state/planner-shell';

export function PlannerShellFrame() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  const currentSection = getSectionByPathname(pathname);
  const activeSection = usePlannerShellStore((state) => state.activeSection);
  const mobileNavOpen = usePlannerShellStore((state) => state.mobileNavOpen);
  const setActiveSection = usePlannerShellStore((state) => state.setActiveSection);
  const toggleMobileNav = usePlannerShellStore((state) => state.toggleMobileNav);
  const summaryPanelOpen = usePlannerShellStore((state) => state.summaryPanelOpen);
  const toggleSummaryPanel = usePlannerShellStore(
    (state) => state.toggleSummaryPanel,
  );

  useEffect(() => {
    if (currentSection.id !== activeSection) {
      setActiveSection(currentSection.id);
    }
  }, [activeSection, currentSection.id, setActiveSection]);

  return (
    <div className="planner-shell shell-reveal">
      <header className="planner-shell__topbar planner-panel planner-panel--inner">
        <div>
          <p className="planner-shell__eyebrow">{shellCopyEs.subtitle}</p>
          <h1>{shellCopyEs.appTitle}</h1>
        </div>

        <div className="planner-shell__actions">
          <button
            aria-label={
              mobileNavOpen
                ? shellCopyEs.closeMenuLabel
                : shellCopyEs.menuLabel
            }
            className="planner-shell__icon-button planner-shell__menu"
            onClick={toggleMobileNav}
            type="button"
          >
            <Menu aria-hidden="true" />
          </button>

          <button
            aria-label={shellCopyEs.summaryToggleLabel}
            className="planner-shell__icon-button"
            onClick={toggleSummaryPanel}
            type="button"
          >
            {summaryPanelOpen ? (
              <PanelRightClose aria-hidden="true" />
            ) : (
              <PanelRightOpen aria-hidden="true" />
            )}
          </button>

          <button className="planner-shell__cta" type="button">
            {shellCopyEs.primaryAction}
          </button>
        </div>
      </header>

      <div className="planner-layout">
        <div className={`planner-layout__nav${mobileNavOpen ? ' is-open' : ''}`}>
          <SectionNav currentSectionId={currentSection.id} />
        </div>

        <main className="planner-main">
          <Outlet />
        </main>

        <SummaryPanel isOpen={summaryPanelOpen} />
      </div>
    </div>
  );
}
