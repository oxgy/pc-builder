import React from 'react'
import { useStore } from '../state/store'

export default function Summary(){
  const {data,selections,setSelection} = useStore()
  const selectedItems = Object.entries(selections).map(([cat,id])=> {
    const it = (data[cat] ?? []).find((x:any)=>x.id===id)
    return it ? {cat, item: it} : null
  }).filter(Boolean) as any[]

  const total = selectedItems.reduce((s, e)=> s + (e.item.fiyat_try || 0), 0)

  return (
    <div className="card">
      <h3>Özet</h3>
      <div style={{display:'grid',gap:8,marginTop:8}}>
        {selectedItems.length===0 && <div className="item">Henüz parça seçilmedi</div>}
        {selectedItems.map(s=> (
          <div key={s.item.id} className="item">
            <div>
              <div style={{fontWeight:600}}>{s.item.ad ?? s.item.model}</div>
              <div style={{fontSize:12,color:'var(--muted)'}}>{s.cat}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
              <div style={{fontWeight:700}}>{s.item.fiyat_try ? (s.item.fiyat_try + ' ₺') : ''}</div>
              <button
                className="remove-btn"
                onClick={() => setSelection(s.cat, null)}
                title="Seçimi kaldır"
              >
                Kaldır
              </button>
            </div>
          </div>
        ))}
        <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'var(--muted)'}}>Toplam</div>
          <div style={{fontSize:18,fontWeight:800}}>{total} ₺</div>
        </div>
      </div>
    </div>
  )
}
