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
  getSpeakers: vi.fn(),
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
  const mockSpeakers = [
    { narrator: 'narrator1', speakerId: 1, speakerLabel: 'Speaker 1' },
    { narrator: 'narrator2', speakerId: 2, speakerLabel: 'Speaker 2' },
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    // Default mock behavior with a small delay to capture loading states
    mockClient.createNarration.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { id: 'test-id' };
    })
    mockClient.getSpeakers.mockResolvedValue({ speakers: mockSpeakers })
    mockClient.getJobStatus.mockResolvedValue({
      status: GetJobStatusResponse_Status.UNSPECIFIED,
    })
  })

  it('renders the initial state and loads speakers', async () => {
    renderApp()
    expect(screen.getByText('Katarive')).toBeInTheDocument()
    expect(screen.getByLabelText(/Source URL/i)).toBeInTheDocument()
    
    // Wait for speakers to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Select Speaker/i)).toBeInTheDocument()
    })
    
    expect(screen.getByText(/Speaker 1 \(narrator1\)/i)).toBeInTheDocument()
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
      path: 'test.mp3',
    })

    renderApp()

    // Wait for speakers
    await waitFor(() => {
      expect(screen.getByLabelText(/Select Speaker/i)).toBeInTheDocument()
    })

    // Submit URL and select speaker
    const urlInput = screen.getByLabelText(/Source URL/i)
    fireEvent.change(urlInput, { target: { value: 'https://test.com' } })
    
    const speakerSelect = screen.getByLabelText(/Select Speaker/i)
    fireEvent.change(speakerSelect, { target: { value: '1' } }) // Select Speaker 2

    fireEvent.click(screen.getByRole('button', { name: /Generate Narration/i }))

    // Verify createNarration called with correct params
    await waitFor(() => {
      expect(mockClient.createNarration).toHaveBeenCalledWith({
        url: 'https://test.com',
        narrator: 'narrator2',
        speakerId: 2,
      })
    })

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

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Speaker/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Source URL/i), {
      target: { value: 'https://test.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Generate Narration/i }))

    // Verify loading/disabled state
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })
})
