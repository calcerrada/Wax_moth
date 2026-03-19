import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import DuplicatesTab from './DuplicatesTab'

const baseProps = {
  dupCount: 0,
  detectDups: true,
  selectedCount: 0,
  deleteStatus: null,
  results: { duplicate_groups: [] },
  onAutoSelectAll: vi.fn(),
  onClearSelection: vi.fn(),
  onOpenDeleteConfirm: vi.fn(),
  onToggle: vi.fn(),
  onAutoSelectGroup: vi.fn(),
  selected: new Set(),
}

describe('DuplicatesTab', () => {
  test('muestra estado sin duplicados y hint cuando detectDups es false', () => {
    const { rerender } = render(<DuplicatesTab {...baseProps} />)
    expect(screen.getByText('duplicates.noneFound')).toBeInTheDocument()
    expect(screen.queryByText('duplicates.detectionDisabledHint')).not.toBeInTheDocument()

    rerender(<DuplicatesTab {...baseProps} detectDups={false} />)
    expect(screen.getByText('duplicates.detectionDisabledHint')).toBeInTheDocument()
  })

  test('muestra acciones y ejecuta callbacks en vista con duplicados', async () => {
    const user = userEvent.setup()
    const onAutoSelectAll = vi.fn()
    const onClearSelection = vi.fn()
    const onOpenDeleteConfirm = vi.fn()

    render(
      <DuplicatesTab
        {...baseProps}
        dupCount={1}
        selectedCount={2}
        deleteStatus={null}
        onAutoSelectAll={onAutoSelectAll}
        onClearSelection={onClearSelection}
        onOpenDeleteConfirm={onOpenDeleteConfirm}
        results={{
          duplicate_groups: [
            {
              fingerprint: 'fp-1',
              files: [
                { path: '/music/a.flac', filename: 'a.flac', extension: '.flac', size_bytes: 10 },
                { path: '/music/b.mp3', filename: 'b.mp3', extension: '.mp3', size_bytes: 11 },
              ],
            },
          ],
        }}
      />
    )

    await user.click(screen.getByRole('button', { name: 'duplicates.autoSelectAllWorst' }))
    await user.click(screen.getByRole('button', { name: 'duplicates.clearSelection' }))
    await user.click(screen.getByRole('button', { name: 'duplicates.deleteSelected' }))

    expect(onAutoSelectAll).toHaveBeenCalledTimes(1)
    expect(onClearSelection).toHaveBeenCalledTimes(1)
    expect(onOpenDeleteConfirm).toHaveBeenCalledTimes(1)
  })

  test('deshabilita boton de borrado mientras deleteStatus es deleting', () => {
    render(
      <DuplicatesTab
        {...baseProps}
        dupCount={1}
        selectedCount={1}
        deleteStatus="deleting"
        results={{
          duplicate_groups: [
            {
              fingerprint: 'fp-2',
              files: [
                { path: '/music/a.wav', filename: 'a.wav', extension: '.wav', size_bytes: 1 },
                { path: '/music/b.wav', filename: 'b.wav', extension: '.wav', size_bytes: 1 },
              ],
            },
          ],
        }}
      />
    )

    const deleteBtn = screen.getByRole('button', { name: 'duplicates.deleting' })
    expect(deleteBtn).toBeDisabled()
  })
})
