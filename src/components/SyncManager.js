import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useDispatch, useSelector } from 'react-redux';
import { setOnline, refreshPendingCount, runSync } from '../redux/syncSlice';

export default function SyncManager() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const wasOffline = useRef(false);

  useEffect(() => {
    dispatch(refreshPendingCount());

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      dispatch(setOnline(online));

      if (online && wasOffline.current && token) {
        dispatch(runSync());
      }
      wasOffline.current = !online;
    });

    return unsubscribe;
  }, [token]);

  return null;
}
