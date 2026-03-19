import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import FileRow from './FileRow'

describe('FileRow', () => {
  test('muestra metadatos formateados y placeholders cuando faltan campos', () => {
    const file = {
      filename: 'song.mp3',
      path: '/music/song.mp3',
      title: null,
      artist: null,
      duration_seconds: 65,
      size_bytes: 1536,
      bitrate: 192000,
      extension: '.mp3',
    }

    render(
      <table>
        <tbody>
          <FileRow file={file} />
        </tbody>
      </table>
    )

    expect(screen.getByText('song.mp3')).toBeInTheDocument()
    expect(screen.getByText('/music/song.mp3')).toBeInTheDocument()
    expect(screen.getByText('1:05')).toBeInTheDocument()
    expect(screen.getByText('1.5 KB')).toBeInTheDocument()
    expect(screen.getByText('192 kbps')).toBeInTheDocument()

    const emptyValues = screen.getAllByText('files.empty')
    expect(emptyValues).toHaveLength(2)
  })

  test('muestra files.empty para bitrate cuando no existe', () => {
    const file = {
      filename: 'ambient.flac',
      path: '/music/ambient.flac',
      title: 'Ambient',
      artist: 'Artist',
      duration_seconds: 120,
      size_bytes: 1048576,
      bitrate: null,
      extension: '.flac',
    }

    render(
      <table>
        <tbody>
          <FileRow file={file} />
        </tbody>
      </table>
    )

    expect(screen.getByText('files.empty')).toBeInTheDocument()
  })
})
