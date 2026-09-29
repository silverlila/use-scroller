import { SECTIONS } from '../meta'

export function Index({ active, onSelect }: { active: number; onSelect: (id: string) => void }) {
  return (
    <ol className="index">
      {SECTIONS.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={index === active ? 'location' : undefined}
            className={index < active ? 'index-link is-past' : 'index-link'}
            onClick={(event) => {
              event.preventDefault()
              onSelect(section.id)
            }}
          >
            <span className="index-num">{section.num}</span>
            <span className="index-text">
              <span className={section.code ? 'index-title is-code' : 'index-title'}>
                {section.title}
              </span>
              {section.also && <span className="index-also">{section.also}</span>}
            </span>
          </a>
        </li>
      ))}
    </ol>
  )
}
