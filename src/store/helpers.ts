import { WritableAtom, atom } from 'jotai'

export function atomWithToggle(
  initialValue?: boolean,
): WritableAtom<boolean, Array<boolean | undefined>, boolean> {
  const anAtom = atom(initialValue, (get, set, nextValue?: boolean) => {
    const update = nextValue ?? !get(anAtom)
    set(anAtom, update)
  })

  return anAtom as unknown as WritableAtom<boolean, Array<boolean | undefined>, boolean>
}