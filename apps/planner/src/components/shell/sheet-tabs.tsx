import { sheetTabs } from '@planner/lib/sections';
import { usePlannerShellStore } from '@planner/state/planner-shell';

export function SheetTabs() {
  const activeTab = usePlannerShellStore((state) => state.characterSheetTab);
  const setTab = usePlannerShellStore((state) => state.setCharacterSheetTab);

  return (
    <div className="sheet-tabs" role="tablist" aria-label="Hoja de personaje">
      {sheetTabs.map((tab) => (
        <button
          aria-controls={`sheet-panel-${tab.id}`}
          aria-selected={activeTab === tab.id}
          className={`sheet-tabs__tab${activeTab === tab.id ? ' is-active' : ''}`}
          id={`sheet-tab-${tab.id}`}
          key={tab.id}
          onClick={() => setTab(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
