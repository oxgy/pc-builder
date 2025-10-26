export type GenericItem = { id: string; ad?: string; marka?: string; fiyat_try?: number; stok?: { durum?: string; adet?: number } }

async function fetchJson<T>(name: string): Promise<T[]> {
  const res = await fetch('/data/' + name + '.json')
  if (!res.ok) throw new Error('Failed to load ' + name)
  return res.json()
}

export async function loadAll() {
  const names = ['anakart','islemci','ram','ekran_karti','psu','kasa','monitor','depolama','klavye','fare','islemci_sogutucu']
  const entries = await Promise.all(names.map(n => fetchJson<GenericItem>(n).then(data => [n, data] as const)))
  return Object.fromEntries(entries) as Record<string, GenericItem[]>
}
