import React from 'react'
import ReactDOM from 'react-dom/client'

function TestApp() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'black', 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    }}>
      <div>🚀 3I/ATLAS Test - React is working!</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)
