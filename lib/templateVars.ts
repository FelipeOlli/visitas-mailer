export function extractTemplateVars(assunto: string, html: string): string[] {
  const text = assunto + ' ' + html
  const re = /\{\{(\w+)\}\}/g
  const seen = new Set<string>()
  const result: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); result.push(m[1]) }
  }
  return result
}
