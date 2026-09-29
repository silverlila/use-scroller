export interface SectionMeta {
  id: string
  num: string
  title: string
  code: boolean
  also?: string
}

export const SECTIONS: SectionMeta[] = [
  { id: 'install', num: '00', title: 'Install', code: false, also: 'npm · entry points' },
  { id: 'concepts', num: '01', title: 'Concepts', code: false, also: 'ScrollTarget · cleanup' },
  {
    id: 'use-scroll',
    num: '02',
    title: 'useScroll',
    code: true,
    also: 'scrollToEdge · scrollToElement · scrollBy · cancelScroll',
  },
  { id: 'motion', num: '03', title: 'animateScroll', code: true, also: 'easings · cubicBezier' },
  { id: 'scroll-state', num: '04', title: 'useScrollState', code: true, also: 'observeScroll' },
  { id: 'stick-to-bottom', num: '05', title: 'useStickToBottom', code: true, also: 'stickToBottom' },
  { id: 'drag-scroll', num: '06', title: 'useDragScroll', code: true, also: 'dragScroll' },
  { id: 'scroll-lock', num: '07', title: 'useScrollLock', code: true, also: 'lockScroll' },
  { id: 'scroll-spy', num: '08', title: 'useScrollSpy', code: true, also: 'observeActiveSection' },
  { id: 'in-view', num: '09', title: 'useInView', code: true, also: 'rootMargin · once' },
  {
    id: 'restoration',
    num: '10',
    title: 'useScrollRestoration',
    code: true,
    also: 'restoreScroll',
  },
  {
    id: 'geometry',
    num: '11',
    title: 'Geometry',
    code: false,
    also: 'readScroll · isScrollable · findScrollParent',
  },
]

export const SECTION_IDS = SECTIONS.map((section) => section.id)
export const LAST_SHEET = SECTIONS[SECTIONS.length - 1].num
export const VERSION = '2.0.0'
export const WIDE_QUERY = '(min-width: 1200px)'
