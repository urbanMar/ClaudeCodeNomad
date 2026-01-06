import { For, Show } from 'solid-js';

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Dropdown(props: DropdownProps) {
  return (
    <div class="space-y-1">
      <Show when={props.label}>
        <label class="block text-xs text-muted">{props.label}</label>
      </Show>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        class="w-full bg-deep border border-border rounded px-3 py-2 text-sm text-text focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 transition-all cursor-pointer"
      >
        <Show when={props.placeholder}>
          <option value="" disabled>{props.placeholder}</option>
        </Show>
        <For each={props.options}>
          {(option) => (
            <option value={option.value}>
              {option.label}
              {option.description ? ` - ${option.description}` : ''}
            </option>
          )}
        </For>
      </select>
    </div>
  );
}
