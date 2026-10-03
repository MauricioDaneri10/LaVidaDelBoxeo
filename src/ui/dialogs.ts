/** Presentation-only dialog stack. No game command or persisted state is touched. */
type Layer = { element: HTMLElement; dialog: HTMLElement; close: () => void; trigger: HTMLElement | null };
const layers: Layer[] = [];
const originals = new Map<HTMLElement, { inert: boolean; hidden: string | null }>();

export const dialogOpen = () => layers.length > 0;

function available(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>("button,input,select,textarea,a[href],[tabindex]"))
    .filter(e => e.tabIndex >= 0 && !e.matches(":disabled") && e.getClientRects().length > 0 && !e.closest("[inert],[hidden]"));
}
function remember(element: HTMLElement) {
  if (!originals.has(element)) originals.set(element, { inert: element.inert, hidden: element.getAttribute("aria-hidden") });
}
function update() {
  const root = document.getElementById("root");
  if (root) {
    remember(root);
    root.inert = layers.length > 0;
    if (layers.length) root.setAttribute("aria-hidden", "true");
  }
  layers.forEach((layer, i) => {
    layer.element.style.zIndex = String(100 + i);
    layer.element.inert = i !== layers.length - 1;
    if (layer.element.inert) layer.element.setAttribute("aria-hidden", "true");
    else layer.element.removeAttribute("aria-hidden");
  });
}
function focusTop() {
  const top = layers[layers.length - 1];
  if (top) (available(top.dialog)[0] ?? top.dialog).focus({ preventScroll: true });
}
function keydown(event: KeyboardEvent) {
  const top = layers[layers.length - 1];
  if (!top) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    top.close();
  } else if (event.key === "Tab") {
    const controls = available(top.dialog);
    const current = controls.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey ? (current <= 0 ? controls.length - 1 : current - 1) : (current + 1) % controls.length;
    event.preventDefault();
    (controls[next] ?? top.dialog).focus({ preventScroll: true });
  }
}
function focusin(event: FocusEvent) {
  const top = layers[layers.length - 1];
  if (top && !top.dialog.contains(event.target as Node)) focusTop();
}

export function mountDialog(element: HTMLElement, dialog: HTMLElement, close: () => void) {
  const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  remember(element);
  layers.push({ element, dialog, close, trigger });
  if (layers.length === 1) {
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin, true);
  }
  update();
  focusTop();
  return () => {
    const index = layers.findIndex(layer => layer.element === element);
    const wasTop = index === layers.length - 1;
    if (index >= 0) layers.splice(index, 1);
    update();
    if (!layers.length) {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", focusin, true);
      for (const [el, value] of originals) {
        el.inert = value.inert;
        if (value.hidden === null) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", value.hidden);
      }
      originals.clear();
    }
    if (wasTop) {
      const top = layers[layers.length - 1];
      if (trigger?.isConnected && (!top || top.dialog.contains(trigger))) trigger.focus({ preventScroll: true });
      else if (top) focusTop();
      else document.querySelector<HTMLElement>("#root nav button, #root button:not(:disabled)")?.focus({ preventScroll: true });
    }
  };
}
