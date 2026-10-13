import { describe, expect, it } from 'vitest'
import { AVATAR_MAX_BYTES, validateAvatarFile } from './avatar'

describe('avatar validation', () => {
  it('menerima format JPG, PNG, dan WebP', () => {
    const jpg = new File(['fake-jpg'], 'profile.jpg', { type: 'image/jpeg' })
    const png = new File(['fake-png'], 'profile.png', { type: 'image/png' })
    const webp = new File(['fake-webp'], 'profile.webp', { type: 'image/webp' })

    expect(validateAvatarFile(jpg)).toBeNull()
    expect(validateAvatarFile(png)).toBeNull()
    expect(validateAvatarFile(webp)).toBeNull()
  })

  it('menolak format yang tidak didukung seperti GIF, SVG, PDF', () => {
    const gif = new File(['fake-gif'], 'profile.gif', { type: 'image/gif' })
    const svg = new File(['fake-svg'], 'profile.svg', { type: 'image/svg+xml' })
    const pdf = new File(['fake-pdf'], 'document.pdf', { type: 'application/pdf' })

    expect(validateAvatarFile(gif)).toContain('Gunakan foto profil berformat JPG, PNG, atau WebP')
    expect(validateAvatarFile(svg)).toContain('Gunakan foto profil berformat JPG, PNG, atau WebP')
    expect(validateAvatarFile(pdf)).toContain('Gunakan foto profil berformat JPG, PNG, atau WebP')
  })

  it('menolak file yang melebihi batas 5 MB', () => {
    // Ukuran melebihi AVATAR_MAX_BYTES
    const oversizedFile = new File(['x'.repeat(100)], 'huge.jpg', { type: 'image/jpeg' })
    Object.defineProperty(oversizedFile, 'size', { value: AVATAR_MAX_BYTES + 1 })

    expect(validateAvatarFile(oversizedFile)).toBe('Ukuran foto profil maksimal 5 MB.')
  })
})
