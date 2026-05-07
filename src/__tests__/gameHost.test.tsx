import { describe, it, expect, afterEach, vi } from 'vitest'
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import GameHost from '../../app/components/games/GameHost'
import type { GameModule, GameProps } from '../../app/components/games/types'

/** Tiny game stub that lets the test drive the result through a button click. */
function makeStubModule(spy?: (props: GameProps) => void): GameModule {
  const Component: React.FC<GameProps> = (props) => {
    spy?.(props)
    return (
      <div>
        <div data-testid="stub-game">stub-game items:{props.items.length}</div>
        <button onClick={() => props.onResult({ stars: 3, correctCount: 5, totalCount: 5, durationMs: 1000 })}>
          finish
        </button>
        <button onClick={() => props.onPause?.()}>pause-from-game</button>
      </div>
    )
  }
  return {
    Component,
    manifest: {
      id: 'stub',
      title: { 'zh-HK': '測試遊戲', en: 'Stub' },
      description: { 'zh-HK': '一個用於測試嘅遊戲', en: 'a test game' },
      mascot: 'panda',
      color: '#6366F1',
      colorVar: '#6366F1',
      emoji: '🧪',
      recommendedItemCount: 5,
    },
  }
}

const mockApiResponse = (chars: Array<{ character: string; jyutping: string; radical: string }>) => ({
  ok: true,
  json: async () => ({ characters: chars }),
})

describe('GameHost lifecycle', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function renderWithFetch(chars: Array<{ character: string; jyutping: string; radical: string }>, module = makeStubModule()) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockApiResponse(chars)))
    const onExit = vi.fn()
    const utils = render(<GameHost module={module} onExit={onExit} />)
    // Let the load() promise resolve into the intro phase. The component
    // chains through fetch → setItems → setPhase('intro') so we await
    // until the intro renders (or the empty-pool message).
    await waitFor(() => {
      expect(utils.queryByText(/準備字卡中/)).toBeNull()
    })
    return { ...utils, onExit }
  }

  it('progresses loading → intro → playing → result and surfaces XP', async () => {
    const { getByText, findByText } = await renderWithFetch([
      { character: '一', jyutping: 'jat1', radical: '一' },
      { character: '二', jyutping: 'ji6', radical: '二' },
      { character: '三', jyutping: 'saam1', radical: '一' },
    ])

    // Intro: title + start button
    expect(getByText('測試遊戲')).toBeInTheDocument()
    fireEvent.click(getByText('▶ 開始'))
    // Now we should be inside the playing phase, mounting the stub component.
    expect(getByText(/stub-game items:/)).toBeInTheDocument()

    // Stub fires the result callback → transitions to result screen.
    fireEvent.click(getByText('finish'))
    // ResultScreen renders the "正確" label and "+20" XP for 3-star.
    await findByText(/正確/)
    expect(getByText('+20')).toBeInTheDocument()
  })

  it('shows the empty-pool intro when scope filter returns no items', async () => {
    const { getByText, queryByText } = await renderWithFetch([])
    expect(getByText('測試遊戲')).toBeInTheDocument()
    expect(getByText(/暫無適合的字符/)).toBeInTheDocument()
    expect(queryByText('▶ 開始')).toBeNull()
  })

  it('supports pause → resume from inside the game', async () => {
    const { getByText, queryByText } = await renderWithFetch([
      { character: '一', jyutping: 'jat1', radical: '一' },
    ])
    fireEvent.click(getByText('▶ 開始'))
    // Pause via the host's top-bar button.
    fireEvent.click(getByText('⏸ 暫停'))
    expect(getByText('暫停中')).toBeInTheDocument()
    // Resume.
    fireEvent.click(getByText('繼續遊戲'))
    expect(getByText(/stub-game items:/)).toBeInTheDocument()
    expect(queryByText('暫停中')).toBeNull()
  })

  it('lets the game itself trigger a pause via onPause prop', async () => {
    const { getByText } = await renderWithFetch([
      { character: '一', jyutping: 'jat1', radical: '一' },
    ])
    fireEvent.click(getByText('▶ 開始'))
    fireEvent.click(getByText('pause-from-game'))
    expect(getByText('暫停中')).toBeInTheDocument()
  })
})
