import { useTheme } from '@mui/material/styles';

export const CUSTOMER_TYPES = {
  POSTPAID: 'POSTPAID',
  PREPAID: 'PREPAID',
  ALL: 'ALL',
};

export const DUNNING_STATUS = {
  ACTIVE: 'ACTIVE',
  NOTIFIED: 'NOTIFIED',
  RESTRICTED: 'RESTRICTED',
  BARRED: 'BARRED',
  CURED: 'CURED',
};

export const ACTION_TYPES = {
  NOTIFY: 'NOTIFY',
  THROTTLE: 'THROTTLE',
  BAR_OUTGOING: 'BAR_OUTGOING',
  DEACTIVATE: 'DEACTIVATE',
};

export const NOTIFICATION_CHANNELS = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  APP: 'APP',
  ALL: 'ALL',
};

export const useStatusColors = () => {
  const theme = useTheme();
  const tm = theme.palette;
  return {
    ACTIVE: tm.success?.main || '#4caf50',
    NOTIFIED: tm.secondary?.main || '#ff69b4',
    RESTRICTED: tm.warning?.main || '#ff9800',
    BARRED: tm.error?.main || '#f44336',
    CURED: tm.customChart?.accent || '#2196f3',
  };
};

export const useChartColors = () => {
  const theme = useTheme();
  return {
    main: theme.palette.customChart?.main || theme.palette.secondary.main,
    accent: theme.palette.customChart?.accent || theme.palette.secondary.light,
  };
};
