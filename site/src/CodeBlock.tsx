import { useState } from 'react'
import { highlight } from 'sugar-high'

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={['code-block', className].filter(Boolean).join(' ')}>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
      <button type="button" className="code-copy" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
