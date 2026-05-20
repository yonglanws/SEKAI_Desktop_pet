import type { CharacterPrompt } from './types'

const mdModules = import.meta.glob('./*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

const prompts: Record<string, CharacterPrompt> = {}

for (const [path, content] of Object.entries(mdModules)) {
  const key = path.replace(/^\.\/(.+)\.md$/, '$1')
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  let name = key
  if (frontmatterMatch) {
    const nameMatch = frontmatterMatch[1].match(/^name:\s*(.+)$/m)
    if (nameMatch) name = nameMatch[1].trim()
  }
  const body = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '').trim()
  prompts[key] = { name, prompt: body }
}

export function getCharacterPrompt(key: string): CharacterPrompt | undefined {
  return prompts[key]
}

export function getAllCharacterPrompts(): Record<string, CharacterPrompt> {
  return prompts
}

export function resolveCharacterKey(modelPath: string): string {
  if (!modelPath) return ''
  const lower = modelPath.toLowerCase()
  const stripped = lower.replace(/^model:\/\/\/|^builtin:\/\//, '')
  const parts = stripped.split('/')
  const modelBase = parts[0] || ''

  const idMatch = modelBase.replace(/^v\d+_?/, '').match(/^0*(\d{1,3})/)
  if (idMatch) {
    const id = parseInt(idMatch[1], 10)
    const idToKey: Record<number, string> = {
      1: 'ichika', 2: 'saki', 3: 'honami', 4: 'shiho',
      5: 'minori', 6: 'haruka', 7: 'airi', 8: 'shizuku',
      9: 'kohane', 10: 'an', 11: 'akito', 12: 'toya',
      13: 'tsukasa', 14: 'emu', 15: 'nene', 16: 'rui',
      17: 'kanade', 18: 'mafuyu', 19: 'ena', 20: 'mizuki',
      21: 'miku', 22: 'rin', 23: 'len', 24: 'luka',
      25: 'meiko', 26: 'kaito',
    }
    const key = idToKey[id]
    if (key && prompts[key]) return key
  }

  const aliasMap: Record<string, string> = {
    hatsunemiku: 'miku', kagaminerin: 'rin', kagaminelen: 'len',
    megurineluka: 'luka', ick: 'ichika', sk: 'saki', hnm: 'honami',
    sh: 'shiho', mnr: 'minori', hrk: 'haruka', szk: 'shizuku',
    khn: 'kohane', akt: 'akito', tks: 'tsukasa', knd: 'kanade',
    mfy: 'mafuyu', mzk: 'mizuki',
  }
  const allKeys = [...Object.keys(aliasMap), ...Object.keys(prompts)]
  const sorted = allKeys.sort((a, b) => b.length - a.length)
  for (const key of sorted) {
    if (key.length < 2) continue
    const re = new RegExp(`(?:^|[^a-z])${key}(?:[^a-z]|$)`, 'i')
    if (re.test(lower)) {
      const resolved = aliasMap[key] || key
      if (prompts[resolved]) return resolved
    }
  }
  return ''
}
