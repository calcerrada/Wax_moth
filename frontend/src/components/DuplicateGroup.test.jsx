import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import DuplicateGroup from './DuplicateGroup'

const group = {
  fingerprint: 'fp-1',
  files: [
    {
      path: '/music/best.flac',
      filename: 'best.flac',
      extension: '.flac',
      bitrate: 320000,
      size_bytes: 1048576,
    },
    {
      path: '/music/copy.mp3',
      filename: 'copy.mp3',
      extension: '.mp3',
      bitrate: 128000,
      size_bytes: 1536,
    },
  ],
}

describe('DuplicateGroup', () => {
  test('muestra grupo y permite auto-seleccionar peores', async () => {
    const user = userEvent.setup()
    const onAutoSelect = vi.fn()

    render(
      <DuplicateGroup
        group={group}
        index={0}
        selected={new Set()}
        onToggle={vi.fn()}
        onAutoSelect={onAutoSelect}
      />
    )

    expect(screen.getByText('duplicates.groupLabel')).toBeInTheDocument()
    expect(screen.getByText('duplicates.copies')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'duplicates.autoSelectWorst' }))
    expect(onAutoSelect).toHaveBeenCalledWith(group)
  })

  test('dispara toggle al hacer click en fila y checkbox, y muestra footer cuando hay seleccion', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <DuplicateGroup
        group={group}
        index={1}
        selected={new Set(['/music/copy.mp3'])}
        onToggle={onToggle}
        onAutoSelect={vi.fn()}
      />
    )

    const rows = screen.getAllByText(/\.flac|\.mp3/i)
    await user.click(rows[0])

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    expect(onToggle).toHaveBeenCalledWith('/music/best.flac')
    expect(onToggle).toHaveBeenCalledWith('/music/copy.mp3')
    expect(screen.getByText('duplicates.markedInGroup')).toBeInTheDocument()
  })
})
