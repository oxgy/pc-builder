import React from 'react'
import { useStore } from '../state/store'

export default function Picker({category, title}:{category:string;title:string}){
  const {data, selections, setSelection, isCompatible} = useStore()
  const items = data[category] ?? []

  function isDisabled(item:any){
    if(!item.stok) return false
    if(item.stok.durum === 'out_of_stock') return true
    // if user hasn't selected any other part yet, don't pre-disable items
    const anySelected = Object.values(selections).some(v=> !!v)
    if(!anySelected) return false
    const comp = isCompatible(category, item)
    return !comp.ok
  }

  return (
    <div className="card">
      <h3 style={{margin:'0 0 8px 0'}}>{title}</h3>
      <div className="filters">{/* placeholder for filters */}</div>
      {items.length===0 && <div className="item">Yükleniyor...</div>}
      {items.map((it:any)=>{
        const comp = isCompatible(category, it)
        const disabled = isDisabled(it)
        const selected = selections[category] === it.id
        return (
          <div key={it.id} className={'item '+(disabled? 'disabled':'') }>
            <div>
              <div style={{fontWeight:600}}>{it.ad ?? it.model ?? it.id}</div>
              <div style={{fontSize:12,color:'var(--muted)'}}>{it.marka ?? ''}</div>
              {!comp.ok && <div style={{fontSize:12,color:'#b33',marginTop:6}}>{comp.reasons.join(' • ')}</div>}
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{fontWeight:700}}>{it.fiyat_try ? (it.fiyat_try + ' ₺') : ''}</div>
              <button disabled={disabled} onClick={()=> setSelection(category, selected? null : it.id)}>{selected? 'Seçilen':'Seç'}</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
