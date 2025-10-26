import React, { useState } from 'react'
import { StoreProvider } from './state/store'
import Picker from './components/Picker'
import Summary from './components/Summary'

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'anakart', label: 'Anakart' },
  { key: 'islemci', label: 'İşlemci' },
  { key: 'ram', label: 'RAM' },
  { key: 'ekran_karti', label: 'Ekran Kartı' },
  { key: 'psu', label: 'PSU' },
  { key: 'kasa', label: 'Kasa' },
  { key: 'depolama', label: 'Depolama' },
  { key: 'monitor', label: 'Monitör' },
  { key: 'klavye', label: 'Klavye' },
  { key: 'fare', label: 'Fare' },
  { key: 'islemci_sogutucu', label: 'İşlemci Soğutucu' }
]


export default function App() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <StoreProvider>
      <div className="app">
        <header className="header">Bilgisayar Toplama</header>
        <main className="main">
          <section className="left">
            <nav className="category-list">
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  className={`category-button ${active === c.key ? 'active' : ''}`}
                  onClick={() => setActive(active === c.key ? null : c.key)}
                  aria-pressed={active === c.key}
                >
                  <span className="category-label">{c.label}</span>
                </button>
              ))}
            </nav>
          </section>

          <section className="center">
            {active ? (
              <Picker category={active} title={CATEGORIES.find(c => c.key === active)?.label || active} />
            ) : (
              <div className="card placeholder">Sol taraftan bir kategori seçin.</div>
            )}
          </section>

          <aside className="right">
            <Summary />
          </aside>
        </main>
      </div>
    </StoreProvider>
  )
}
