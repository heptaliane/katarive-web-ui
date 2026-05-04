import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_GRPC_WEB_URL: '',
    VITE_AUDIO_BASE_URL: '/file',
  },
})
