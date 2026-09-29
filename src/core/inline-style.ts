export type Restore = () => void

// Longhands only: saving a shorthand reads '' when its longhands differ, and removing it would
// then wipe inline longhands the page had set. Priority is kept so `!important` survives.
export function setInlineStyles(element: HTMLElement, styles: Record<string, string>): Restore {
  const previous = Object.keys(styles).map((property) => ({
    property,
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }))
  for (const [property, value] of Object.entries(styles)) element.style.setProperty(property, value)
  return () => {
    for (const { property, value, priority } of previous) {
      if (value) element.style.setProperty(property, value, priority)
      else element.style.removeProperty(property)
    }
  }
}
