import React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  return (
    <div style={{display:'grid',placeItems:'center',minHeight:'100vh'}}>
      <h1>3I/ATLAS Tracker placeholder — build verified</h1>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
