import messages_en from './translations/en.json';
import reducer from './reducer';
import KoboConnectMainMenu from './menu/KoboConnectMainMenu';
import KoboConfigPage from './pages/KoboConfigPage';

const ROUTE_KOBO_CONFIG = 'kobo_connect/config';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }],
  reducers: [{ key: 'koboConnect', reducer }],
  'core.MainMenu': [KoboConnectMainMenu],
  'core.Router': [
    { path: ROUTE_KOBO_CONFIG, component: KoboConfigPage },
  ],
  refs: [
    { key: 'koboConnect.route.koboConfig', ref: ROUTE_KOBO_CONFIG },
  ],
};

export const KoboConnectModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });

