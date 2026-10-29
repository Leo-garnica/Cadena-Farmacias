import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter-tight/latin-700.css'
import '@fontsource/inter-tight/latin-800.css'
import { router } from './app/router'
import { MotionProvider } from './shared/motion/MotionProvider'
import './shared/styles/tokens.css'
import './shared/styles/global.css'
import './shared/ui/ui.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><MotionProvider><RouterProvider router={router} /></MotionProvider></StrictMode>,
)
