import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface SoundContextValue {
  isPlaying: boolean
  toggleSound: () => void
  playSound: () => Promise<void>
  pauseSound: () => void
  volume: number
  setVolume: (vol: number) => void
}

const SoundContext = createContext<SoundContextValue | null>(null)

const STORAGE_KEY = 'serasi_bgm_enabled'
const DEFAULT_VOLUME = 0.35

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Inisialisasi elemen audio sekali di tingkat root
    const audio = new Audio('/audio/bgm.mp3')
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = DEFAULT_VOLUME
    audioRef.current = audio

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onError = (e: Event) => {
      console.warn('Audio playback notice:', e)
      setIsPlaying(false)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)

    const tryAutoPlay = () => {
      if (localStorage.getItem(STORAGE_KEY) === 'false') return
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        // Jika browser memblokir autoplay tanpa gesture, pasang listener di interaksi pertama
        const onFirstGesture = () => {
          if (localStorage.getItem(STORAGE_KEY) !== 'false') {
            audio.play().then(() => setIsPlaying(true)).catch(() => {})
          }
          cleanupGestureListeners()
        }

        const events = ['click', 'pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel'] as const
        const cleanupGestureListeners = () => {
          for (const ev of events) {
            window.removeEventListener(ev, onFirstGesture)
            document.removeEventListener(ev, onFirstGesture)
          }
        }

        for (const ev of events) {
          window.addEventListener(ev, onFirstGesture, { once: true, passive: true })
          document.addEventListener(ev, onFirstGesture, { once: true, passive: true })
        }
      })
    }

    tryAutoPlay()

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
      audioRef.current = null
    }

  }, [])

  const playSound = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
      await audio.play()
    } catch (err) {
      console.warn('Gagal memutar audio:', err)
    }
  }

  const pauseSound = () => {
    const audio = audioRef.current
    if (!audio) return
    localStorage.setItem(STORAGE_KEY, 'false')
    audio.pause()
  }

  const toggleSound = () => {
    if (isPlaying) {
      pauseSound()
    } else {
      void playSound()
    }
  }

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val))
    setVolumeState(clamped)
    if (audioRef.current) {
      audioRef.current.volume = clamped
    }
  }

  return (
    <SoundContext.Provider value={{ isPlaying, toggleSound, playSound, pauseSound, volume, setVolume }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const ctx = useContext(SoundContext)
  if (!ctx) {
    throw new Error('useSound must be used within a SoundProvider')
  }
  return ctx
}
