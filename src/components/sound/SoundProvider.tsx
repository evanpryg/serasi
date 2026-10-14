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

const DEFAULT_VOLUME = 0.35

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const userPausedRef = useRef(false)

  useEffect(() => {
    // Inisialisasi elemen audio di tingkat root
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

    // Event interaksi yang valid menurut browser user activation policy
    const gestureEvents = ['click', 'pointerdown', 'touchstart', 'touchend', 'keydown'] as const

    const removeGestureListeners = () => {
      for (const ev of gestureEvents) {
        window.removeEventListener(ev, handleGesture, true)
        document.removeEventListener(ev, handleGesture, true)
      }
    }

    const handleGesture = () => {
      if (userPausedRef.current || !audioRef.current) return
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          removeGestureListeners()
        })
        .catch(() => {
          // Jika masih dibatasi, tunggu interaksi berikutnya
        })
    }

    // Coba putar otomatis langsung saat web dibuka
    audio
      .play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch(() => {
        // Jika diblokir oleh browser Autoplay Policy, aktifkan pada sentuhan/klik pertama pengguna
        for (const ev of gestureEvents) {
          window.addEventListener(ev, handleGesture, { capture: true, passive: true })
          document.addEventListener(ev, handleGesture, { capture: true, passive: true })
        }
      })

    return () => {
      removeGestureListeners()
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
    userPausedRef.current = false
    try {
      await audio.play()
      setIsPlaying(true)
    } catch (err) {
      console.warn('Gagal memutar audio:', err)
    }
  }

  const pauseSound = () => {
    const audio = audioRef.current
    if (!audio) return
    userPausedRef.current = true
    audio.pause()
    setIsPlaying(false)
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
