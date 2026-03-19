import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import FilesTab from './FilesTab'

const filteredFiles = [
  {
    path: '/music/song.mp3',
    filename: 'song.mp3',
    title: 'Song',
    artist: 'Artist',
    duration_seconds: 60,
    size_bytes: 1024,
    bitrate: 128000,
    extension: '.mp3',
  },
]

describe('FilesTab', () => {
  test('dispara cambios en buscador y filtro de extension', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    const onFilterExtChange = vi.fn()

    render(
      <FilesTab
        search=""
        onSearchChange={onSearchChange}
        filterExt="all"
        onFilterExtChange={onFilterExtChange}
        extensions={['.mp3', '.flac']}
        filteredFiles={filteredFiles}
      />
    )

    await user.type(screen.getByPlaceholderText('filters.searchPlaceholder'), 'rock')
    await user.click(screen.getByRole('button', { name: 'filters.all' }))
    await user.click(screen.getByRole('button', { name: 'MP3' }))

    expect(onSearchChange).toHaveBeenCalled()
    expect(onFilterExtChange).toHaveBeenCalledWith('all')
    expect(onFilterExtChange).toHaveBeenCalledWith('.mp3')
  })

  test('muestra mensaje vacio cuando no hay resultados', () => {
    render(
      <FilesTab
        search="abc"
        onSearchChange={vi.fn()}
        filterExt=".flac"
        onFilterExtChange={vi.fn()}
        extensions={['.flac']}
        filteredFiles={[]}
      />
    )

    expect(screen.getByText('files.none')).toBeInTheDocument()
  })
})
