import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/auth/AuthProvider'
import { MotionProvider } from '@/components/motion'
import { SoundProvider } from '@/components/sound/SoundProvider'
import { router } from '@/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <AuthProvider>
        <SoundProvider>
          <RouterProvider router={router} />
        </SoundProvider>
      </AuthProvider>
    </MotionProvider>
  </StrictMode>,
)

