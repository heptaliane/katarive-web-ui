import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClientProvider } from '../context'
import App from '../App'
import { vi } from 'vitest'
import { GetJobStatusResponse_Status } from '../gen/api/v1/api_pb'

// Create a mock client
const mockClient = {
  createNarration: vi.fn(),
  getJobStatus: vi.fn(),
}

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientProvider client={mockClient}>
        <App />
      </ClientProvider>
    </QueryClientProvider>
  )
}

describe('App Flow', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Default mock behavior
    mockClient.createNarration.mockResolvedValue({ id: 'test-id' })
  })

  it('renders the initial state', () => {
    renderApp()
    expect(screen.getByText('Katarive')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter source URL/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate Narration/i })).toBeInTheDocument()
  })

  it('handles the end-to-end generation flow', async () => {
    // 1. Initial status mock: PROGRESSING
    mockClient.getJobStatus.mockResolvedValueOnce({
      status: GetJobStatusResponse_Status.PROGRESSING,
    })
    // 2. Second wrap: COMPLETED
    mockClient.getJobStatus.mockResolvedValueOnce({
      status: GetJobStatusResponse_Status.COMPLETED,
      path: 'file/test.mp3',
    })

    renderApp()

    // Submit URL
    const input = screen.getByPlaceholderText(/Enter source URL/i)
    fireEvent.change(input, { target: { value: 'https://test.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Narration/i }))

    // Verify status card appears as Progressing
    await waitFor(() => {
      expect(screen.getByText(/Progressing/i)).toBeInTheDocument()
    })

    // Wait for COMPLETED status
    await waitFor(() => {
      expect(screen.getByText(/Success/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify audio player appears
    expect(screen.getByText(/Narration Ready/i)).toBeInTheDocument()
    const audio = document.querySelector('audio')
    expect(audio).toHaveAttribute('src', '/file/test.mp3')
  })

  it('disables the generate button while a job is in progress', async () => {
    mockClient.getJobStatus.mockResolvedValue({
      status: GetJobStatusResponse_Status.PROGRESSING,
    })

    renderApp()

    fireEvent.change(screen.getByPlaceholderText(/Enter source URL/i), {
      target: { value: 'https://test.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Generate Narration/i }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})
