import { Volume2, VolumeX } from 'lucide-react'
import { useSound } from './SoundProvider'
import { cn } from '@/lib/cn'

export function SoundToggle({ className }: { className?: string }) {
  const { isPlaying, toggleSound } = useSound()

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center group',
        className,
      )}
    >
      {/* Tooltip hint on hover */}
      <div className="pointer-events-none absolute right-full mr-2.5 hidden sm:flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink/90 px-2.5 py-1 text-xs font-medium text-surface opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 backdrop-blur-sm">
        <span>{isPlaying ? 'Matikan musik' : 'Putar musik'}</span>
        <span
          className={cn(
            'inline-block size-1.5 rounded-full',
            isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-ink-muted',
          )}
        />
      </div>

      <button
        type="button"
        onClick={toggleSound}
        aria-label={isPlaying ? 'Matikan musik latar' : 'Nyalakan musik latar'}
        title={isPlaying ? 'Matikan musik latar' : 'Nyalakan musik latar'}
        className={cn(
          'relative flex size-12 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isPlaying
            ? 'border-primary/20 bg-surface/95 text-primary shadow-pop hover:scale-105 hover:bg-primary-soft/40 hover:border-primary/40'
            : 'border-border/80 bg-surface/85 text-ink-muted shadow-card hover:scale-105 hover:text-ink hover:bg-surface',
        )}
      >
        {isPlaying ? (
          <div className="relative flex items-center justify-center">
            {/* Equalizer bars animation */}
            <div className="flex items-end gap-0.5 mr-1" aria-hidden>
              <span className="w-0.5 h-3 bg-primary rounded-full animate-[soundWave_1s_ease-in-out_infinite]" />
              <span className="w-0.5 h-4 bg-primary rounded-full animate-[soundWave_0.8s_ease-in-out_infinite_0.2s]" />
              <span className="w-0.5 h-2.5 bg-primary rounded-full animate-[soundWave_1.2s_ease-in-out_infinite_0.4s]" />
            </div>
            <Volume2 className="size-4 shrink-0 text-primary" aria-hidden />
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <VolumeX className="size-5 shrink-0 opacity-75" aria-hidden />
          </div>
        )}
      </button>
    </div>
  )
}
