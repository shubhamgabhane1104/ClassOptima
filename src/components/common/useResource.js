import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';

// Loads a list from the API and exposes reload + loading/error state.
export default function useResource(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.get(path);
      setData(d.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching data on mount
  useEffect(() => { reload(); }, [reload]);

  return { data, setData, loading, error, reload };
}
