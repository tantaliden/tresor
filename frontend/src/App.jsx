import React, { useEffect, useState } from 'react'

async function fetchJSON(url, opts) {
  const r = await fetch(url, opts)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export default function App() {
  const [words, setWords] = useState([])
  const [slots, setSlots] = useState(Array(12).fill(''))
  const [locks, setLocks] = useState(Array(12).fill(false))
  const [result, setResult] = useState(null)
  const [inList, setInList] = useState(null)

  useEffect(() => { fetchJSON('/api/words').then(setWords).catch(console.error) }, [])

  const setSlot = (i, val) => setSlots(s => s.map((v, idx) => idx === i ? val : v))
  const toggleLock = (i) => setLocks(l => l.map((v, idx) => idx === i ? !v : v))

  const randomize = () => {
    if (!words.length) return
    setSlots(slots.map((v, i) => locks[i] ? v : words[Math.floor(Math.random()*words.length)]))
  }

  const jumpLetter = (i) => {
    if (!words.length) return
    const cur = slots[i] || ''
    const letter = (cur[0]?.toLowerCase() || 'a').charCodeAt(0)
    const next = letter >= 122 ? 97 : letter + 1
    const target = String.fromCharCode(next)
    const idx = words.findIndex(w => w.startsWith(target))
    if (idx >= 0) setSlot(i, words[idx])
  }

  const validate = async () => {
    setResult(null); setInList(null)
    if (slots.some(s => !s)) { alert('Alle 12 Wörter setzen.'); return }
    const r = await fetchJSON('/api/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: slots })
    })
    setResult(r)
    if (r.valid && r.pubkey) {
      const c = await fetchJSON('/api/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey: r.pubkey })
      })
      setInList(c.in_list)
    }
  }

  const bulkLock = (state) => setLocks(Array(12).fill(state))

  return (
    <div style={{maxWidth: 980, margin: '30px auto', fontFamily: 'ui-sans-serif, system-ui'}}>
      <h1 style={{marginBottom: 8}}>TRESOR</h1>
      <p style={{marginTop: 0}}>12-Wort Seed Builder · Randomizer · Check</p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        {slots.map((val, i) => (
          <div key={i} style={{display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, alignItems:'center'}}>
            <select value={val} onChange={e => setSlot(i, e.target.value)}>
              <option value="">— Wort {i+1} —</option>
              {words.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <button onClick={() => jumpLetter(i)} title="Zum nächsten Anfangsbuchstaben springen">A→</button>
            <button onClick={() => toggleLock(i)} style={{opacity: locks[i]?1:0.9}} title="Lock/Unlock">{locks[i] ? '🔒' : '🔓'}</button>
          </div>
        ))}
      </div>

      <div style={{display:'flex', gap:8, marginTop:16}}>
        <button onClick={randomize}>Randomizer (nur ungelockte)</button>
        <button onClick={() => bulkLock(true)}>Alle locken</button>
        <button onClick={() => bulkLock(false)}>Alle unlocken</button>
        <button onClick={validate}>Prüfen</button>
      </div>

      {result && (
        <div style={{marginTop:16, padding:12, border:'1px solid #ddd', borderRadius:8}}>
          <div>Valid: <b>{String(result.valid)}</b></div>
          <div>Public Key: <code>{result.pubkey || '-'}</code></div>
          {inList !== null && (
            <div>In dormant list: <b style={{color: inList ? 'green' : 'crimson'}}>{String(inList)}</b></div>
          )}
        </div>
      )}
    </div>
  )
}
