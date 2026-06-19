import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'
import { afterEach, expect, vi } from 'vitest'

expect.extend(matchers)

vi.mock('obsidian', async () => await import('./mocks/obsidian'))

afterEach(() => {
  cleanup()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  vi.clearAllMocks()
})
