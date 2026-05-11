import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'



function App() {
  const location = useLocation()
  // const hideHeader = location.pathname === '/signup' || location.pathname === '/login'

  return (
    <>
    <h1 class='bg-amber-400'>Hellow World </h1>
    </>
  )
}

export default App
