import { describe, expect, it } from 'vitest'
import { arrayMove, initialState, reducer } from '#/state/reducer'
import type { Photo } from '#/state/types'

const photo = (id: string): Photo => ({
  id,
  name: id,
  bitmap: {} as ImageBitmap,
  thumbUrl: `blob:${id}`,
})

describe('reducer', () => {
  const withPhotos = reducer(initialState, {
    type: 'add',
    photos: ['a', 'b', 'c'].map(photo),
  })

  it('adds and removes', () => {
    expect(withPhotos.photos.map((p) => p.id)).toEqual(['a', 'b', 'c'])
    const s = reducer(withPhotos, { type: 'remove', id: 'b' })
    expect(s.photos.map((p) => p.id)).toEqual(['a', 'c'])
  })

  it('moves', () => {
    const s = reducer(withPhotos, { type: 'move', from: 0, to: 2 })
    expect(s.photos.map((p) => p.id)).toEqual(['b', 'c', 'a'])
  })

  it('sets a crop on one photo only', () => {
    const crop = {
      rotation: 0 as const,
      aspect: 1,
      area: { x: 0, y: 0, w: 1, h: 1 },
    }
    const s = reducer(withPhotos, { type: 'setCrop', id: 'c', crop })
    expect(s.photos[2]!.crop).toBe(crop)
    expect(s.photos[0]!.crop).toBeUndefined()
  })

  it('patches settings', () => {
    const s = reducer(initialState, { type: 'settings', patch: { gapMm: 5 } })
    expect(s.settings.gapMm).toBe(5)
    expect(s.settings.format).toBe(initialState.settings.format)
  })

  it('resets settings but keeps photos', () => {
    const changed = reducer(withPhotos, {
      type: 'settings',
      patch: { gapMm: 7, format: 'polaroid' },
    })
    const s = reducer(changed, { type: 'resetSettings' })
    expect(s.settings).toEqual(initialState.settings)
    expect(s.photos).toBe(withPhotos.photos)
  })

  it('defaults: Instax Mini, 2 mm gap, 2 mm margin, cut marks on', () => {
    expect(initialState.settings).toMatchObject({
      format: 'instax-mini',
      gapMm: 2,
      safeMarginMm: 2,
      cutMarks: true,
    })
  })
})

describe('arrayMove', () => {
  it('ignores out of range', () => {
    expect(arrayMove([1, 2], 5, 0)).toEqual([1, 2])
  })
})
