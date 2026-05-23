import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClientProvider } from '../context'
import App from '../App'
import { vi } from 'vitest'
import { JobStatus } from '../gen/api/v1/api_pb'

// Create a mock client
const mockClient = {
  queueNarration: vi.fn(),
  getNarration: vi.fn(),
  getNarrators: vi.fn(),
  queueSourceCollection: vi.fn(),
  getSourceCollection: vi.fn(),
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
  const mockNarrators = [
    {
      name: 'narrator1',
      speakers: [
        { id: 1, label: 'Speaker 1' }
      ]
    },
    {
      name: 'narrator2',
      speakers: [
        { id: 2, label: 'Speaker 2' }
      ]
    }
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    // Default mock behavior with a small delay to capture loading states
    mockClient.queueNarration.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { id: 'test-id' };
    })
    mockClient.getNarrators.mockResolvedValue({ narrator: mockNarrators })
    mockClient.getNarration.mockResolvedValue({
      status: JobStatus.UNSPECIFIED,
    })
    mockClient.queueSourceCollection.mockResolvedValue({ id: 'collection-id' })
    mockClient.getSourceCollection.mockResolvedValue({
      status: JobStatus.COMPLETED,
      sources: []
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
    mockClient.getNarration.mockResolvedValueOnce({
      status: JobStatus.PROGRESSING,
    })
    // 2. Second wrap: COMPLETED
    mockClient.getNarration.mockResolvedValueOnce({
      status: JobStatus.COMPLETED,
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
    fireEvent.change(speakerSelect, { target: { value: 'narrator2-2' } }) // Select Speaker 2

    fireEvent.click(screen.getByRole('button', { name: /Generate Narration/i }))

    // Verify queueNarration called with correct params
    await waitFor(() => {
      expect(mockClient.queueNarration).toHaveBeenCalledWith({
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
    mockClient.getNarration.mockResolvedValue({
      status: JobStatus.PROGRESSING,
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


  it('handles batch narration sequence: Narrate All, Pause, Resume, and Cancel', async () => {
    // Mock getSourceCollection with 3 sources
    const mockSources = [
      { id: '1', url: 'https://test.com/1', title: 'Source 1' },
      { id: '2', url: 'https://test.com/2', title: 'Source 2' },
      { id: '3', url: 'https://test.com/3', title: 'Source 3' },
    ]
    mockClient.getSourceCollection.mockResolvedValue({
      status: JobStatus.COMPLETED,
      sources: mockSources,
    })

    let callCount = 0;
    mockClient.queueNarration.mockImplementation(async () => {
      callCount++;
      return { id: `job-id-${callCount}` };
    });
    mockClient.queueSourceCollection.mockResolvedValue({ id: 'collection-id' })

    const jobCalls: Record<string, number> = {};
    mockClient.getNarration.mockImplementation(async ({ id }: { id: string }) => {
      if (id === 'job-id-1') {
        return { status: JobStatus.COMPLETED, path: 'initial.mp3' };
      }
      if (id === 'job-id-2') {
        if (!jobCalls[id]) jobCalls[id] = 0;
        jobCalls[id]++;
        if (jobCalls[id] === 1) {
          return { status: JobStatus.PROGRESSING };
        }
        return { status: JobStatus.COMPLETED, path: 'first.mp3' };
      }
      if (id === 'job-id-3') {
        if (!jobCalls[id]) jobCalls[id] = 0;
        jobCalls[id]++;
        if (jobCalls[id] === 1) {
          return { status: JobStatus.PROGRESSING };
        }
        return { status: JobStatus.COMPLETED, path: 'second.mp3' };
      }
      return { status: JobStatus.IDLE };
    });

    renderApp()

    // Wait for speakers
    await waitFor(() => {
      expect(screen.getByLabelText(/Select Speaker/i)).toBeInTheDocument()
    })

    // Start initial narration to fetch collection
    const urlInput = screen.getByLabelText(/Source URL/i)
    fireEvent.change(urlInput, { target: { value: 'https://test.com/1' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Narration/i }))

    // Wait for sources panel to be displayed
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Narrate All/i })).toBeInTheDocument()
    })

    // Assert sources initial status indicators
    expect(screen.getByTestId('status-idle-https://test.com/1')).toBeInTheDocument()

    // Click "Narrate All"
    fireEvent.click(screen.getByRole('button', { name: /Narrate All/i }))

    // First source should be processing
    await waitFor(() => {
      expect(screen.getByTestId('status-processing-https://test.com/1')).toBeInTheDocument()
      expect(screen.getByTestId('status-pending-https://test.com/2')).toBeInTheDocument()
      expect(mockClient.queueNarration).toHaveBeenCalledWith({
        url: 'https://test.com/1',
        narrator: 'narrator1',
        speakerId: 1,
      })
    })

    // Wait for first source to complete. Since we are not paused, it should progress to the second URL
    await waitFor(() => {
      expect(screen.getByTestId('status-completed-https://test.com/1')).toBeInTheDocument()
      expect(screen.getByTestId('status-processing-https://test.com/2')).toBeInTheDocument()
    }, { timeout: 4000 })

    // Click "Pause"
    const pauseButton = screen.getByRole('button', { name: /Pause/i })
    fireEvent.click(pauseButton)

    // Once second source finishes, it should NOT progress to the third source
    await waitFor(() => {
      expect(screen.getByTestId('status-completed-https://test.com/2')).toBeInTheDocument()
      expect(screen.getByTestId('status-pending-https://test.com/3')).toBeInTheDocument()
    }, { timeout: 4000 })

    // Verify "Resume" and "Cancel" buttons are displayed
    const resumeButton = screen.getByRole('button', { name: /Resume/i })
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    expect(resumeButton).toBeInTheDocument()
    expect(cancelButton).toBeInTheDocument()

    // Click "Cancel" to stop the batch completely
    fireEvent.click(cancelButton)

    // Verify batch is canceled and status indicators are reset
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Narrate All/i })).toBeInTheDocument()
      expect(screen.queryByTestId('status-completed-https://test.com/1')).not.toBeInTheDocument()
    })
  })

  it('handles refreshing a collection with cache disabled', async () => {
    mockClient.getSourceCollection.mockResolvedValue({
      status: JobStatus.COMPLETED,
      collection: {
        id: 'collection-id',
        url: 'https://test.com/collection-url',
        title: 'Mocked Collection',
      },
      sources: [
        { id: '1', url: 'https://test.com/1', title: 'Source 1' }
      ]
    })

    mockClient.queueSourceCollection.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { id: 'refreshed-collection-id' };
    });

    renderApp()

    // Wait for speakers
    await waitFor(() => {
      expect(screen.getByLabelText(/Select Speaker/i)).toBeInTheDocument()
    })

    // Start initial narration to fetch collection
    const urlInput = screen.getByLabelText(/Source URL/i)
    fireEvent.change(urlInput, { target: { value: 'https://test.com/1' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Narration/i }))

    // Wait for collection to load and show the collection title
    await waitFor(() => {
      expect(screen.getByText('Mocked Collection')).toBeInTheDocument()
    })

    // Assert that the Refresh button is displayed
    const refreshButton = screen.getByRole('button', { name: /Refresh Collection/i })
    expect(refreshButton).toBeInTheDocument()

    // Click Refresh button
    fireEvent.click(refreshButton)

    // Verify it calls queueSourceCollection with disableCache: true
    await waitFor(() => {
      expect(mockClient.queueSourceCollection).toHaveBeenCalledWith({
        url: 'https://test.com/collection-url',
        disableCache: true,
      })
    })
  })
})
