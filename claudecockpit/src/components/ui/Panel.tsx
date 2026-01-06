import { JSX, splitProps } from 'solid-js';

interface PanelProps extends JSX.HTMLAttributes<HTMLDivElement> {
  header?: string;
}

export function Panel(props: PanelProps) {
  const [local, rest] = splitProps(props, ['header', 'class', 'children']);

  return (
    <div
      {...rest}
      class={`panel ${local.class || ''}`}
    >
      {local.header && (
        <div class="panel-header">{local.header}</div>
      )}
      {local.children}
    </div>
  );
}
