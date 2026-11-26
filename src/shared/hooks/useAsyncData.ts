import { useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useAsyncData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))

    load()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, error: error as Error, loading: false })
      })

    return () => {
      active = false
    }
    // `load` es una función inline del componente; las dependencias reales las da el llamador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken])

  return { ...state, reload: () => setReloadToken((token) => token + 1) }
}
