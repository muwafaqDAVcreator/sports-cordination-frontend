import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch, useSelector } from 'react-redux';
import { setOnline } from '../redux/syncSlice';
import { refreshLocal, runSync } from '../redux/actions';

/**
 * Background sync triggers:
 *  - on sign-in / app start (load local data, then sync),
 *  - when connectivity returns (NetInfo offline -> online),
 *  - when the app returns to the foreground,
 *  - on the user-configured interval while auto-sync is on.
 */
export default function SyncManager() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);
  const { autoSync, intervalMinutes, isOnline } = useSelector((s) => s.sync);
  const wasOnline = useRef(true);

  useEffect(() => {
    if (!token) return undefined;
    dispatch(refreshLocal()).then(() => dispatch(runSync()));

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      dispatch(setOnline(online));
      if (online && !wasOnline.current) dispatch(runSync());
      wasOnline.current = online;
    });

    const appState = AppState.addEventListener('change', (s) => {
      if (s === 'active') dispatch(runSync());
    });

    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [token]);

  useEffect(() => {
    if (!token || !autoSync || !isOnline) return undefined;
    const timer = setInterval(() => dispatch(runSync()), intervalMinutes * 60000);
    return () => clearInterval(timer);
  }, [token, autoSync, intervalMinutes, isOnline]);

  return null;
}
