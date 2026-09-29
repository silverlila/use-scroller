export interface Destination {
  city: string
  country: string
  price: number
  gradient: string
}

export interface Message {
  id: number
  name: string
  text: string
  time: string
  avatar: string
}

export const GRADIENTS = [
  'from-rose-400 to-orange-400',
  'from-sky-400 to-indigo-500',
  'from-emerald-400 to-teal-600',
  'from-amber-300 to-rose-500',
  'from-fuchsia-400 to-purple-600',
  'from-cyan-300 to-blue-600',
  'from-lime-300 to-emerald-600',
  'from-orange-300 to-red-600',
]

const PLACES: Array<[city: string, country: string, price: number]> = [
  ['Lisbon', 'Portugal', 420],
  ['Kyoto', 'Japan', 1180],
  ['Cape Town', 'South Africa', 960],
  ['Reykjavík', 'Iceland', 780],
  ['Oaxaca', 'Mexico', 640],
  ['Hoi An', 'Vietnam', 890],
  ['Tbilisi', 'Georgia', 510],
  ['Valparaíso', 'Chile', 1040],
  ['Porto', 'Portugal', 390],
  ['Marrakesh', 'Morocco', 470],
  ['Hobart', 'Australia', 1320],
  ['Bergen', 'Norway', 720],
]

export const DESTINATIONS: Destination[] = PLACES.map(([city, country, price], i) => ({
  city,
  country,
  price,
  gradient: GRADIENTS[i % GRADIENTS.length],
}))

const NAMES = ['Ana', 'Ben', 'Chloé', 'Dev', 'Emre', 'Fatima', 'Goran', 'Hana', 'Iris', 'Jonas']
const TEXTS = [
  'Pushed the fix, can you take a look?',
  'Lunch at 12:30?',
  'The build is green again.',
  'Sent you the slides for tomorrow.',
  'Running five minutes late, sorry!',
  'Does the new layout work on your phone?',
  'Merged. Thanks for the review.',
  'Coffee later?',
]

export const MESSAGES: Message[] = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  name: NAMES[i % NAMES.length],
  text: TEXTS[(i * 3) % TEXTS.length],
  time: `${9 + Math.floor(i / 4)}:${String((i * 7) % 60).padStart(2, '0')}`,
  avatar: GRADIENTS[(i * 5) % GRADIENTS.length],
}))
