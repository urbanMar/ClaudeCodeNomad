import { For, JSX, Show } from 'solid-js';

interface TabItem {
  id: string;
  label: string;
  closable?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabClose?: (id: string) => void;
  children?: JSX.Element;
}

export function Tabs(props: TabsProps) {
  return (
    <div class="flex items-center overflow-x-auto scrollbar-hide">
      <For each={props.tabs}>
        {(tab) => (
          <div
            class={`
              flex items-center gap-2 px-4 py-3 border-r border-border cursor-pointer
              transition-colors whitespace-nowrap select-none
              ${props.activeTab === tab.id
                ? 'bg-void text-neon-cyan border-b-2 border-b-neon-cyan -mb-px'
                : 'text-muted hover:text-text hover:bg-surface/50'
              }
            `}
            onClick={() => props.onTabChange(tab.id)}
          >
            <span class="font-mono text-sm">{tab.label}</span>
            <Show when={tab.closable && props.onTabClose}>
              <button
                class="ml-1 p-0.5 hover:bg-surface rounded transition-colors opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onTabClose?.(tab.id);
                }}
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Show>
          </div>
        )}
      </For>
      {props.children}
    </div>
  );
}
