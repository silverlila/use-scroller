export type Axis = 'x' | 'y'

export type ScrollTarget = HTMLElement | Window

// Fractional scroll positions on high-DPI screens never land exactly on an edge.
export const EDGE_TOLERANCE = 1
