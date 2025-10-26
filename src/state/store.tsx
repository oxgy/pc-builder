import React, { createContext, useContext, useEffect, useState } from 'react'
import { loadAll, GenericItem } from '../data/loader'

type DataState = {
  data: Record<string, GenericItem[]>
  selections: Record<string, string | null>
  setSelection: (category: string, id: string | null) => void
  isCompatible: (category: string, item: any) => { ok: boolean; reasons: string[] }
}

const StoreContext = createContext<DataState | null>(null)

export const StoreProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [data, setData] = useState<Record<string, GenericItem[]>>({})
  const [selections, setSelections] = useState<Record<string, string | null>>(() => {
    try{ const s = localStorage.getItem('selections'); return s ? JSON.parse(s) : {} }catch{ return {} }
  })

  useEffect(()=>{ loadAll().then(d=>setData(d)).catch(e=>console.error(e)) },[])
  useEffect(()=>{ localStorage.setItem('selections', JSON.stringify(selections)) },[selections])

  function setSelection(category: string, id: string | null){
    setSelections(prev=>({ ...prev, [category]: id }))
  }

  function isCompatible(category: string, item: any){
    const reasons: string[] = []
    const getSelected = (cat:string): any => {
      const id = selections[cat]
      return id ? ((data[cat] ?? []) as any[]).find((x:any)=> x.id === id) as any : null
    }

    const mobo = getSelected('anakart')
    const psu = getSelected('psu')
    const kasa = getSelected('kasa')
    const cpu = getSelected('islemci')

    if(category === 'islemci'){
      if(mobo && mobo.soket && item.soket && mobo.soket !== item.soket){
        reasons.push(`Soket uyumsuz (anakart ${mobo.soket} vs işlemci ${item.soket})`)
      }
    }

    if(category === 'ram'){
      if(mobo && mobo.bellek){
        const moboTip = mobo.bellek.tip
        if(item.tip && moboTip && item.tip !== moboTip){
          reasons.push(`Bellek tipi uyumsuz (anakart ${moboTip} vs RAM ${item.tip})`)
        }
        const moboMax = Array.isArray(mobo.bellek.hiz_mhz) ? Math.max(...mobo.bellek.hiz_mhz) : (mobo.bellek.hiz_mhz || 0)
        if(item.hiz_mhz && moboMax && item.hiz_mhz > moboMax){
          reasons.push(`RAM hızı anakartın desteklediğinden yüksek (${item.hiz_mhz} > ${moboMax} MHz)`) 
        }
      }
    }

    if(category === 'ekran_karti'){
      if(psu && psu.guc_w && item.guc && item.guc.onerilen_psu_w && psu.guc_w < item.guc.onerilen_psu_w){
        reasons.push(`PSU gücü düşük (PSU ${psu.guc_w}W < önerilen ${item.guc.onerilen_psu_w}W)`) 
      }
      if(psu && item.guc && Array.isArray(item.guc.ek_guc_konnektoru) && item.guc.ek_guc_konnektoru.includes('12VHPWR')){
        const has12 = psu.baglantilar && psu.baglantilar.pcie_12vhpwr_adet && psu.baglantilar.pcie_12vhpwr_adet > 0
        if(!has12) reasons.push('GPU 12VHPWR gerektiriyor, seçili PSU 12VHPWR kablosu yok')
      }
      // check 8-pin counts
      if(psu && item.guc && Array.isArray(item.guc.ek_guc_konnektoru)){
        const required8 = item.guc.ek_guc_konnektoru.reduce((acc:any, s:any)=>{
          if(!s) return acc
          const low = (''+s).toLowerCase()
          if(low.includes('12vhpwr')) return acc // handled above
          const m = low.match(/(\d+)x\s*8/) || low.match(/(\d+)x8/) || low.match(/(\d+)x8-pin/)
          if(m) return acc + Number(m[1])
          if(low.includes('2x8')) return acc + 2
          if(low.includes('8-pin')) return acc + 1
          if(low.includes('6-pin')) return acc + 0.75
          return acc
        }, 0)
        const have8 = psu.baglantilar && (psu.baglantilar.pcie_8pin_adet || 0)
        if(required8 > 0 && have8 < Math.ceil(required8)){
          reasons.push(`Seçili GPU için gerekli 8-pin konnektör sayısı PSU'dan az (gerekli ~${required8} adet, PSU ${have8} adet)`) 
        }
      }
      if(kasa && kasa.gpu_uzunluk_max_mm && item.boyut && item.boyut.uzunluk_mm && item.boyut.uzunluk_mm > kasa.gpu_uzunluk_max_mm){
        reasons.push(`GPU uzunluğu kasa sınırını aşıyor (${item.boyut.uzunluk_mm}mm > ${kasa.gpu_uzunluk_max_mm}mm)`) 
      }
    }

    if(category === 'kasa'){
      if(mobo && kasa && !kasa.mobo_destek.includes(mobo.form_factor) && !kasa.mobo_destek.includes(mobo.form_factor)){
        // some mobo.form_factor values can be 'ATX' vs 'Micro-ATX' etc. We check membership directly
        if(!kasa.mobo_destek.includes(mobo.form_factor)) reasons.push(`Anakart form faktörü bu kasada desteklenmiyor (${mobo.form_factor})`)
      }
      if(psu && kasa && kasa.psu_destek && !kasa.psu_destek.includes(psu.form_factor)){
        reasons.push(`Seçili PSU form faktörü kasanın desteklediği tipler arasında değil (${psu.form_factor})`)
      }
    }

    if(category === 'depolama'){
      // storage: SATA vs M.2
      if(mobo && item.arayuz){
        const tip = (item.arayuz && item.arayuz.tip) ? (''+item.arayuz.tip).toLowerCase() : ''
        if(tip.includes('sata')){
          const sataCount = mobo.depolama && (mobo.depolama.sata || 0)
          if(!sataCount || sataCount <= 0) reasons.push('Seçilen depolama SATA arayüzlü ancak anakartta SATA portu yok')
        }
        if(tip.includes('m') || item.m2_boy){
          const m2Count = mobo.depolama && (mobo.depolama.m2 || 0)
          if(!m2Count || m2Count <= 0) reasons.push('Seçilen depolama M.2 arayüzlü ancak anakartta M.2 yuvası yok')
        }
      }
    }

    if(category === 'monitor'){
      const gpu = getSelected('ekran_karti')
      if(gpu && item.baglantilar){
        const monPorts = item.baglantilar || {}
        const gpuPorts = gpu.ekran_cikislari || {}
        const types = ['dp','hdmi','usb_c_dp']
        const shared = types.some(t=> (monPorts[t] || 0) > 0 && (gpuPorts[t] || gpuPorts['dp'] || 0) > 0 && (gpuPorts[t] || 0) > 0)
        // above: check if any port type exists on both sides
        // simpler: check hdmi or dp intersection
        const hasCommon = ((monPorts.dp||0) > 0 && (gpuPorts.dp||0) > 0) || ((monPorts.hdmi||0) > 0 && (gpuPorts.hdmi||0) > 0) || ((monPorts.usb_c_dp||0)>0 && (gpuPorts.usb_c_dp||0)>0)
        if(!hasCommon){
          reasons.push('Monitör ve seçili ekran kartı arasında ortak video çıkışı yok (HDMI/DP/USB-C)')
        }
      }
    }

    if(category === 'islemci_sogutucu'){
      if(mobo && item.desteklenen_soketler && Array.isArray(item.desteklenen_soketler) && !item.desteklenen_soketler.includes(mobo.soket)){
        reasons.push(`Soğutucu soket uyumsuz (anakart ${mobo.soket})`)
      }
      if(kasa && kasa.cpu_sogutucu_yukseklik_max_mm && item.yukseklik_mm && item.yukseklik_mm > kasa.cpu_sogutucu_yukseklik_max_mm){
        reasons.push(`Soğutucu yüksekliği kasa limitini aşıyor (${item.yukseklik_mm}mm > ${kasa.cpu_sogutucu_yukseklik_max_mm}mm)`) 
      }
      if(cpu && item.max_tdp_w && cpu.tdp_w && item.max_tdp_w < cpu.tdp_w){
        reasons.push(`Soğutucu CPU'nun TDP'sini desteklemeyebilir (soğutucu ${item.max_tdp_w}W < CPU ${cpu.tdp_w}W)`) 
      }
    }

    return { ok: reasons.length === 0, reasons }
  }

  return <StoreContext.Provider value={{data,selections,setSelection,isCompatible}}>{children}</StoreContext.Provider>
}

export function useStore(){
  const s = useContext(StoreContext)
  if(!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
