import type { Product } from './api'

export interface ProductMedia {
  readonly src: string
  readonly width: number
  readonly height: number
}

const IMAGE_WIDTH = 440
const IMAGE_HEIGHT = 340
const image = (slug: string): ProductMedia => ({
  src: `/images/productos/${slug}.webp`,
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
})

const mediaBySlug = {
  paracetamol: image('paracetamol'),
  gasas: image('gasas-esteriles'),
  jabon: image('jabon-neutro'),
  venda: image('venda-elastica'),
  algodon: image('algodon'),
  guantes: image('guantes'),
  termometro: image('termometro'),
  cinta: image('cinta-medica'),
  crema: image('crema-de-manos'),
  mascarillas: image('mascarillas'),
  protector: image('protector-solar'),
  apositos: image('apositos'),
} as const

const mediaByCode: ReadonlyMap<number, ProductMedia> = new Map([
  [101, mediaBySlug.paracetamol],
  [102, mediaBySlug.gasas],
  [103, mediaBySlug.jabon],
  [104, mediaBySlug.venda],
  [105, mediaBySlug.algodon],
  [106, mediaBySlug.guantes],
  [107, mediaBySlug.termometro],
  [108, mediaBySlug.cinta],
  [109, mediaBySlug.crema],
  [110, mediaBySlug.mascarillas],
  [111, mediaBySlug.protector],
  [112, mediaBySlug.apositos],
])

const keywordMedia: ReadonlyArray<readonly [RegExp, ProductMedia]> = [
  [/paracetamol|ibuprofeno|naproxeno|omeprazol|loratadina|cetirizina|aspirina|acetilsalicilico|simeticona|tableta|capsula|comprimido|analgesic/, mediaBySlug.paracetamol],
  [/gasa/, mediaBySlug.gasas],
  [/jabon/, mediaBySlug.jabon],
  [/venda/, mediaBySlug.venda],
  [/algodon/, mediaBySlug.algodon],
  [/guante/, mediaBySlug.guantes],
  [/termometro/, mediaBySlug.termometro],
  [/cinta|esparadrapo|micropore/, mediaBySlug.cinta],
  [/crema|pomada|unguento|gel/, mediaBySlug.crema],
  [/mascarilla|barbijo|cubreboca/, mediaBySlug.mascarillas],
  [/protector|solar|bloqueador|locion|jarabe|alcohol|solucion|suspension/, mediaBySlug.protector],
  [/aposito|curita|tirita|parche/, mediaBySlug.apositos],
]

const presentationMedia: Readonly<Record<string, ProductMedia>> = {
  caja: mediaBySlug.paracetamol,
  paquete: mediaBySlug.gasas,
  bolsa: mediaBySlug.algodon,
  barra: mediaBySlug.jabon,
  rollo: mediaBySlug.venda,
  tubo: mediaBySlug.crema,
  frasco: mediaBySlug.protector,
  unidad: mediaBySlug.termometro,
}

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function productMedia(product: Pick<Product, 'codigo' | 'nombre' | 'presentacion'>): ProductMedia {
  const byCode = mediaByCode.get(product.codigo)
  if (byCode) return byCode
  const normalizedName = normalize(product.nombre)
  for (const [pattern, media] of keywordMedia) {
    if (pattern.test(normalizedName)) return media
  }
  const normalizedPresentation = normalize(product.presentacion)
  return presentationMedia[normalizedPresentation] ?? mediaBySlug.paracetamol
}
