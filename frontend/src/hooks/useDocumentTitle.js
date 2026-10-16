import { useEffect } from 'react';
import { APP_NAME } from '@/config/constants';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
