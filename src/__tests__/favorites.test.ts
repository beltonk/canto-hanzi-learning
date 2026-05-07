import { describe, it, expect, beforeEach } from 'vitest'
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite,
  toggleFavorite,
  markReviewed,
  getFavoritesCount,
} from '../lib/favorites'

beforeEach(() => {
  localStorage.clear()
})

describe('favorites', () => {
  it('starts empty', () => {
    expect(getFavorites()).toEqual([])
    expect(getFavoritesCount()).toBe(0)
    expect(isFavorite('明')).toBe(false)
  })

  it('adds a single character favorite with inferred kind=char', () => {
    const entry = addFavorite({ text: '明', source: 'explore' })
    expect(entry.text).toBe('明')
    expect(entry.kind).toBe('char')
    expect(entry.reviewCount).toBe(0)
    expect(entry.reason).toBe('manual')
    expect(isFavorite('明')).toBe(true)
    expect(getFavoritesCount()).toBe(1)
  })

  it('infers kind=word for multi-character text', () => {
    const entry = addFavorite({ text: '學習', source: 'flashcard' })
    expect(entry.kind).toBe('word')
  })

  it('does not duplicate; updates source/jyutping on re-add', () => {
    addFavorite({ text: '明', source: 'explore' })
    addFavorite({ text: '明', source: 'dictation', jyutping: 'ming4', reason: 'mistake' })
    const favs = getFavorites()
    expect(favs).toHaveLength(1)
    expect(favs[0].source).toBe('dictation')
    expect(favs[0].jyutping).toBe('ming4')
    expect(favs[0].reason).toBe('mistake')
  })

  it('removes favorites', () => {
    addFavorite({ text: '明' })
    removeFavorite('明')
    expect(isFavorite('明')).toBe(false)
    expect(getFavoritesCount()).toBe(0)
  })

  it('toggleFavorite adds when missing and removes when present', () => {
    expect(toggleFavorite({ text: '光' })).toBe(true)
    expect(isFavorite('光')).toBe(true)
    expect(toggleFavorite({ text: '光' })).toBe(false)
    expect(isFavorite('光')).toBe(false)
  })

  it('markReviewed increments review count', () => {
    addFavorite({ text: '明' })
    markReviewed('明')
    markReviewed('明')
    const fav = getFavorites().find(f => f.text === '明')!
    expect(fav.reviewCount).toBe(2)
    expect(fav.lastReviewedAt).toBeDefined()
  })
})
