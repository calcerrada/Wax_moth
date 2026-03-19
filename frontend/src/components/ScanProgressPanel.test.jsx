import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ScanProgressPanel from './ScanProgressPanel'

describe('ScanProgressPanel', () => {
  test('muestra estado de escaneo, progreso y ruta', () => {
    const { container } = render(
      <ScanProgressPanel
        folder="/music/library"
        progress={{ current: 2, total: 10 }}
      />
    )

    expect(screen.getByText('scan.scanning')).toBeInTheDocument()
    expect(screen.getByText('/music/library')).toBeInTheDocument()
    expect(screen.getByText('progress.files')).toBeInTheDocument()

    const fill = container.querySelector('.progress-fill')
    expect(fill).toHaveStyle('width: 20%')
  })
})
