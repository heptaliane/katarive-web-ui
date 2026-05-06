import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('VITE_GRPC_WEB_URL', 'http://localhost:9421')
vi.stubEnv('VITE_AUDIO_BASE_URL', '/file')
