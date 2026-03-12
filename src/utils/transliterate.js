/**
 * English (Roman/Latin) ↔ Tamil transliteration for names.
 * Proper phonetic mapping following Tamil script rules.
 */

// Tamil Unicode reference:
// Vowels: அ(0B85) ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ
// Vowel signs: ா(BBE) ி ஀ ீ ு ூ ெ ே ை ொ ோ ௌ
// Virama (pulli): ் (0BCD) - kills inherent 'a'

// Roman syllable → Tamil. Longest keys first when matching.
const ROMAN_TO_TAMIL = {
  // === Full words (names) - try first ===
  kumari: '\u0B95\u0BC1\u0BAE\u0BBE\u0BB0\u0BBF',
  kumar: '\u0B95\u0BC1\u0BAE\u0BBE\u0BB0\u0BCD',
  sundari: '\u0B9A\u0BC1\u0BA8\u0BCD\u0BA4\u0BB0\u0BBF',
  ramesh: '\u0BB0\u0BBE\u0BAE\u0BC7\u0BB7\u0BCD',
  selvi: '\u0B9A\u0BC6\u0BB2\u0BCD\u0BB5\u0BBF',
  devi: '\u0BA4\u0BC7\u0BB5\u0BBF',
  sri: '\u0B9A\u0BCD\u0BB0\u0BC0',
  shri: '\u0B9A\u0BCD\u0BB0\u0BC0',
  raju: '\u0BB0\u0BBE\u0B9C\u0BC1',
  ravi: '\u0BB0\u0BBE\u0BB5\u0BBF',
  rama: '\u0BB0\u0BBE\u0BAE',
  sita: '\u0B9A\u0BC0\u0BA4\u0BBE',
  murugan: '\u0BAE\u0BC1\u0BB0\u0BC1\u0B95\u0BA9\u0BCD',
  lakshmi: '\u0BB2\u0B95\u0BCD\u0BB7\u0BCD\u0BAE\u0BBF',
  krishna: '\u0B95\u0BBF\u0BB0\u0BC1\u0BB7\u0BCD\u0BA3',
  rajan: '\u0BB0\u0BBE\u0B9C\u0BA9\u0BCD',
  manju: '\u0BAE\u0BA9\u0BCD\u0B9C\u0BC1',
  anbu: '\u0B85\u0BA9\u0BCD\u0BAA\u0BC1',
  priya: '\u0BAA\u0BCD\u0BB0\u0BBF\u0BAF\u0BBE',
  deepa: '\u0BA4\u0BC0\u0BAA\u0BBE',
  kavitha: '\u0B95\u0BB5\u0BBF\u0BA4\u0BBE',
  thangam: '\u0BA4\u0B99\u0BCD\u0B95\u0BAE\u0BCD',
  velu: '\u0BB5\u0BC7\u0BB2\u0BC1',
  muthu: '\u0BAE\u0BC1\u0BA4\u0BC1',
  kannan: '\u0B95\u0BA9\u0BCD\u0BA9\u0BA9\u0BCD',
  maran: '\u0BAE\u0BB0\u0BA9\u0BCD',
  arun: '\u0B85\u0BB0\u0BC1\u0BA9\u0BCD',
  karthik: '\u0B95\u0BBE\u0BB0\u0BCD\u0BA4\u0BBF\u0B95\u0BCD',
  vinoth: '\u0BB5\u0BBF\u0BA9\u0BCB\u0BA4\u0BCD',
  sarala: '\u0B9A\u0BB0\u0BB2\u0BBE',
  amudha: '\u0B85\u0BAE\u0BC1\u0BA4\u0BBE',
  // === Three- and four-character syllables ===
  ram: '\u0BB0\u0BAE\u0BCD',
  ng: '\u0B99\u0BCD',
  nga: '\u0B99',
  ngaa: '\u0B99\u0BBE',
  ngi: '\u0B99\u0BBF',
  ngu: '\u0B99\u0BC1',
  nge: '\u0B99\u0BC7',
  ngo: '\u0B99\u0BCB',
  // === Two-char: vowel signs (consonant + vowel) ===
  aa: '\u0B86',
  i: '\u0B87',
  ee: '\u0B88',
  ii: '\u0B88',
  u: '\u0B89',
  oo: '\u0B8A',
  uu: '\u0B8A',
  e: '\u0B8F',
  ai: '\u0B90',
  o: '\u0B92',
  au: '\u0B94',
  ow: '\u0B94',
  a: '\u0B85',
  // ka series
  ka: '\u0B95',
  kaa: '\u0B95\u0BBE',
  ki: '\u0B95\u0BBF',
  kee: '\u0B95\u0BC0',
  ku: '\u0B95\u0BC1',
  koo: '\u0B95\u0BC2',
  ke: '\u0B95\u0BC7',
  kai: '\u0B95\u0BC8',
  ko: '\u0B95\u0BCB',
  kau: '\u0B95\u0BCC',
  ga: '\u0B95',
  gaa: '\u0B95\u0BBE',
  gi: '\u0B95\u0BBF',
  gu: '\u0B95\u0BC1',
  ge: '\u0B95\u0BC7',
  go: '\u0B95\u0BCB',
  // ca/cha series
  cha: '\u0B9A',
  chaa: '\u0B9A\u0BBE',
  chi: '\u0B9A\u0BBF',
  che: '\u0B9A\u0BC7',
  cho: '\u0B9A\u0BCB',
  chu: '\u0B9A\u0BC1',
  ja: '\u0B9C',
  jaa: '\u0B9C\u0BBE',
  ji: '\u0B9C\u0BBF',
  ju: '\u0B9C\u0BC1',
  je: '\u0B9C\u0BC7',
  jo: '\u0B9C\u0BCB',
  // Ta (retroflex) series
  ta: '\u0B9F',
  taa: '\u0B9F\u0BBE',
  ti: '\u0B9F\u0BBF',
  tee: '\u0B9F\u0BC0',
  tu: '\u0B9F\u0BC1',
  too: '\u0B9F\u0BC2',
  te: '\u0B9F\u0BC7',
  to: '\u0B9F\u0BCB',
  // tha (dental) series
  tha: '\u0BA4',
  thaa: '\u0BA4\u0BBE',
  thi: '\u0BA4\u0BBF',
  thu: '\u0BA4\u0BC1',
  the: '\u0BA4\u0BC7',
  tho: '\u0BA4\u0BCB',
  // da (na+tha) - ந்+த
  da: '\u0BA8\u0BCD\u0BA4',
  daa: '\u0BA8\u0BCD\u0BA4\u0BBE',
  di: '\u0BA8\u0BCD\u0BA4\u0BBF',
  du: '\u0BA8\u0BCD\u0BA4\u0BC1',
  de: '\u0BA8\u0BCD\u0BA4\u0BC7',
  do: '\u0BA8\u0BCD\u0BA4\u0BCB',
  // na (na series - nasal)
  na: '\u0BA8',
  naa: '\u0BA8\u0BBE',
  ni: '\u0BA8\u0BBF',
  nu: '\u0BA8\u0BC1',
  ne: '\u0BA8\u0BC7',
  no: '\u0BA8\u0BCB',
  // pa series
  pa: '\u0BAA',
  paa: '\u0BAA\u0BBE',
  pi: '\u0BAA\u0BBF',
  pu: '\u0BAA\u0BC1',
  poo: '\u0BAA\u0BC2',
  pe: '\u0BAA\u0BC7',
  po: '\u0BAA\u0BCB',
  ba: '\u0BAA',
  baa: '\u0BAA\u0BBE',
  bi: '\u0BAA\u0BBF',
  bu: '\u0BAA\u0BC1',
  be: '\u0BAA\u0BC7',
  bo: '\u0BAA\u0BCB',
  // ma
  ma: '\u0BAE',
  maa: '\u0BAE\u0BBE',
  mi: '\u0BAE\u0BBF',
  mu: '\u0BAE\u0BC1',
  me: '\u0BAE\u0BC7',
  mo: '\u0BAE\u0BCB',
  // ya, ra, la, va
  ya: '\u0BAF',
  yaa: '\u0BAF\u0BBE',
  yi: '\u0BAF\u0BBF',
  yu: '\u0BAF\u0BC1',
  ye: '\u0BAF\u0BC7',
  yo: '\u0BAF\u0BCB',
  ra: '\u0BB0',
  raa: '\u0BB0\u0BBE',
  ri: '\u0BB0\u0BBF',
  ru: '\u0BB0\u0BC1',
  re: '\u0BB0\u0BC7',
  ro: '\u0BB0\u0BCB',
  la: '\u0BB2',
  laa: '\u0BB2\u0BBE',
  li: '\u0BB2\u0BBF',
  lu: '\u0BB2\u0BC1',
  le: '\u0BB2\u0BC7',
  lo: '\u0BB2\u0BCB',
  va: '\u0BB5',
  vaa: '\u0BB5\u0BBE',
  vi: '\u0BB5\u0BBF',
  vu: '\u0BB5\u0BC1',
  ve: '\u0BB5\u0BC7',
  vo: '\u0BB5\u0BCB',
  // sa, ha, sha
  sa: '\u0B9A',
  saa: '\u0B9A\u0BBE',
  si: '\u0B9A\u0BBF',
  su: '\u0B9A\u0BC1',
  se: '\u0B9A\u0BC7',
  so: '\u0B9A\u0BCB',
  ha: '\u0BB9',
  hi: '\u0BB9\u0BBF',
  hu: '\u0BB9\u0BC1',
  he: '\u0BB9\u0BC7',
  ho: '\u0BB9\u0BCB',
  sha: '\u0BB8',
  shaa: '\u0BB8\u0BBE',
  shi: '\u0BB8\u0BBF',
  shu: '\u0BB8\u0BC1',
  she: '\u0BB8\u0BC7',
  sho: '\u0BB8\u0BCB',
  // Single consonant (virama - ending)
  k: '\u0B95\u0BCD',
  ch: '\u0B9A\u0BCD',
  j: '\u0B9C\u0BCD',
  t: '\u0B9F\u0BCD',
  th: '\u0BA4\u0BCD',
  n: '\u0BA8\u0BCD',
  p: '\u0BAA\u0BCD',
  m: '\u0BAE\u0BCD',
  y: '\u0BAF\u0BCD',
  r: '\u0BB0\u0BCD',
  l: '\u0BB2\u0BCD',
  v: '\u0BB5\u0BCD',
  s: '\u0B9A\u0BCD',
  h: '\u0BB9\u0BCD',
  sh: '\u0BB8\u0BCD',
}

// Build sorted keys: longest first (so "kumari" before "ku")
const ROMAN_KEYS = Object.keys(ROMAN_TO_TAMIL).sort(
  (a, b) => b.length - a.length
)

// Tamil → Roman for reverse conversion
const TAMIL_TO_ROMAN = {
  '\u0B85': 'a',
  '\u0B86': 'aa',
  '\u0B87': 'i',
  '\u0B88': 'ee',
  '\u0B89': 'u',
  '\u0B8A': 'oo',
  '\u0B8E': 'e',
  '\u0B8F': 'e',
  '\u0B90': 'ai',
  '\u0B92': 'o',
  '\u0B93': 'o',
  '\u0B94': 'au',
  '\u0B95': 'ka',
  '\u0B95\u0BBE': 'kaa',
  '\u0B95\u0BBF': 'ki',
  '\u0B95\u0BC0': 'kee',
  '\u0B95\u0BC1': 'ku',
  '\u0B95\u0BC2': 'koo',
  '\u0B95\u0BC6': 'ke',
  '\u0B95\u0BC7': 'ke',
  '\u0B95\u0BC8': 'kai',
  '\u0B95\u0BCA': 'ko',
  '\u0B95\u0BCB': 'ko',
  '\u0B95\u0BCC': 'kau',
  '\u0B95\u0BCD': 'k',
  '\u0B99': 'nga',
  '\u0B99\u0BBE': 'ngaa',
  '\u0B99\u0BBF': 'ngi',
  '\u0B99\u0BC1': 'ngu',
  '\u0B99\u0BC7': 'nge',
  '\u0B99\u0BCB': 'ngo',
  '\u0B99\u0BCD': 'ng',
  '\u0B9A': 'sa',
  '\u0B9A\u0BBE': 'saa',
  '\u0B9A\u0BBF': 'si',
  '\u0B9A\u0BC1': 'su',
  '\u0B9A\u0BC7': 'se',
  '\u0B9A\u0BCB': 'so',
  '\u0B9A\u0BCD': 's',
  '\u0B9C': 'ja',
  '\u0B9C\u0BBE': 'jaa',
  '\u0B9C\u0BBF': 'ji',
  '\u0B9C\u0BC1': 'ju',
  '\u0B9C\u0BC7': 'je',
  '\u0B9C\u0BCB': 'jo',
  '\u0B9C\u0BCD': 'j',
  '\u0B9F': 'ta',
  '\u0B9F\u0BBE': 'taa',
  '\u0B9F\u0BBF': 'ti',
  '\u0B9F\u0BC1': 'tu',
  '\u0B9F\u0BC7': 'te',
  '\u0B9F\u0BCB': 'to',
  '\u0B9F\u0BCD': 't',
  '\u0BA4': 'tha',
  '\u0BA4\u0BBE': 'thaa',
  '\u0BA4\u0BBF': 'thi',
  '\u0BA4\u0BC1': 'thu',
  '\u0BA4\u0BC7': 'the',
  '\u0BA4\u0BCB': 'tho',
  '\u0BA4\u0BCD': 'th',
  '\u0BA8': 'na',
  '\u0BA8\u0BBE': 'naa',
  '\u0BA8\u0BBF': 'ni',
  '\u0BA8\u0BC1': 'nu',
  '\u0BA8\u0BC7': 'ne',
  '\u0BA8\u0BCB': 'no',
  '\u0BA8\u0BCD': 'n',
  '\u0BAA': 'pa',
  '\u0BAA\u0BBE': 'paa',
  '\u0BAA\u0BBF': 'pi',
  '\u0BAA\u0BC1': 'pu',
  '\u0BAA\u0BC7': 'pe',
  '\u0BAA\u0BCB': 'po',
  '\u0BAA\u0BCD': 'p',
  '\u0BAE': 'ma',
  '\u0BAE\u0BBE': 'maa',
  '\u0BAE\u0BBF': 'mi',
  '\u0BAE\u0BC1': 'mu',
  '\u0BAE\u0BC7': 'me',
  '\u0BAE\u0BCB': 'mo',
  '\u0BAE\u0BCD': 'm',
  '\u0BAF': 'ya',
  '\u0BAF\u0BBF': 'yi',
  '\u0BAF\u0BC1': 'yu',
  '\u0BAF\u0BC7': 'ye',
  '\u0BAF\u0BCB': 'yo',
  '\u0BAF\u0BCD': 'y',
  '\u0BB0': 'ra',
  '\u0BB0\u0BBE': 'raa',
  '\u0BB0\u0BBF': 'ri',
  '\u0BB0\u0BC1': 'ru',
  '\u0BB0\u0BC7': 're',
  '\u0BB0\u0BCB': 'ro',
  '\u0BB0\u0BCD': 'r',
  '\u0BB2': 'la',
  '\u0BB2\u0BBE': 'laa',
  '\u0BB2\u0BBF': 'li',
  '\u0BB2\u0BC1': 'lu',
  '\u0BB2\u0BC7': 'le',
  '\u0BB2\u0BCB': 'lo',
  '\u0BB2\u0BCD': 'l',
  '\u0BB5': 'va',
  '\u0BB5\u0BBE': 'vaa',
  '\u0BB5\u0BBF': 'vi',
  '\u0BB5\u0BC1': 'vu',
  '\u0BB5\u0BC7': 've',
  '\u0BB5\u0BCB': 'vo',
  '\u0BB5\u0BCD': 'v',
  '\u0BB8': 'sha',
  '\u0BB8\u0BBF': 'shi',
  '\u0BB8\u0BC1': 'shu',
  '\u0BB8\u0BC7': 'she',
  '\u0BB8\u0BCB': 'sho',
  '\u0BB8\u0BCD': 'sh',
  '\u0BB9': 'ha',
  '\u0BB9\u0BBF': 'hi',
  '\u0BB9\u0BC1': 'hu',
  '\u0BB9\u0BC7': 'he',
  '\u0BB9\u0BCB': 'ho',
  '\u0BB9\u0BCD': 'h',
}

/** Detect if text is mostly Tamil (Unicode range 0B80-0BFF) */
function isMostlyTamil(text) {
  if (!text || !text.trim()) return false
  const tamilRange = /[\u0B80-\u0BFF]/g
  const tamilCount = (text.match(tamilRange) || []).length
  const letterCount = (text.match(/\S/g) || []).length
  return letterCount > 0 && tamilCount / letterCount >= 0.3
}

/** Roman/Latin script → Tamil (proper longest-match) */
function englishToTamil(text) {
  if (!text || typeof text !== 'string') return ''
  const input = text.trim()
  if (!input) return ''
  if (isMostlyTamil(input)) return input

  const out = []
  const lower = input.toLowerCase()
  const totalLen = lower.length
  let i = 0

  while (i < totalLen) {
    let matched = false
    for (const key of ROMAN_KEYS) {
      const keyLen = key.length
      if (i + keyLen <= totalLen) {
        const chunk = lower.slice(i, i + keyLen)
        if (chunk === key) {
          const tamil = ROMAN_TO_TAMIL[key]
          if (tamil) {
            out.push(tamil)
            i += keyLen
            matched = true
            break
          }
        }
      }
    }
    if (!matched) {
      const ch = input[i]
      if (/[\u0B80-\u0BFF]/.test(ch)) {
        out.push(ch)
      } else if (/[a-zA-Z]/.test(ch)) {
        const single = ROMAN_TO_TAMIL[ch.toLowerCase()]
        out.push(single != null ? single : ch)
      } else {
        out.push(ch)
      }
      i += 1
    }
  }
  return out.join('')
}

/** Tamil → Roman */
function tamilToEnglish(text) {
  if (!text || typeof text !== 'string') return ''
  const input = text.trim()
  if (!input) return ''
  if (!isMostlyTamil(input)) return input

  const out = []
  const chars = [...input]
  let i = 0
  while (i < chars.length) {
    let found = false
    for (const keyLen of [2, 1]) {
      if (i + keyLen > chars.length) continue
      const chunk = chars.slice(i, i + keyLen).join('')
      const roman = TAMIL_TO_ROMAN[chunk]
      if (roman) {
        out.push(roman)
        i += keyLen
        found = true
        break
      }
    }
    if (!found) {
      const ch = chars[i]
      if (/[\u0B80-\u0BFF]/.test(ch)) out.push(ch)
      else out.push(ch)
      i += 1
    }
  }
  return out.join('')
}

export function convertName(text) {
  if (!text || typeof text !== 'string') return ''
  const t = text.trim()
  if (!t) return ''
  return isMostlyTamil(t) ? tamilToEnglish(t) : englishToTamil(t)
}

export { englishToTamil, tamilToEnglish, isMostlyTamil }
