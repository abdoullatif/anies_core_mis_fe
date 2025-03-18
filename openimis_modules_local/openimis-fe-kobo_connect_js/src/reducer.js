import {
  parseData,
  pageInfo,
  formatGraphQLError,
  formatServerError,
} from '@openimis/fe-core';

export const ACTION_TYPE = {
  KOBO_FORMS_REQ: 'KOBO_FORMS_REQ',
  KOBO_FORMS_RESP: 'KOBO_FORMS_RESP',
  KOBO_FORMS_ERR: 'KOBO_FORMS_ERR',
  SYNC_CONFIG_REQ: 'SYNC_CONFIG_REQ',
  SYNC_CONFIG_RESP: 'SYNC_CONFIG_RESP',
  SYNC_CONFIG_ERR: 'SYNC_CONFIG_ERR',
  KOBO_MUTATION_REQ: 'KOBO_MUTATION_REQ',
  KOBO_MUTATION_ERR: 'KOBO_MUTATION_ERR',
  KOBO_UPDATE_SYNC_CONFIG_RESP: 'KOBO_UPDATE_SYNC_CONFIG_RESP',
};

const initialState = {
  fetchingKoboForms: false,
  fetchedKoboForms: false,
  errorKoboForms: null,
  koboForms: [],
  koboFormsPageInfo: { totalCount: 0 },

  fetchingSyncConfig: false,
  fetchedSyncConfig: false,
  errorSyncConfig: null,
  syncConfig: null,

  submittingMutation: false,
  mutation: {},
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case ACTION_TYPE.KOBO_FORMS_REQ:
      return {
        ...state,
        fetchingKoboForms: true,
        fetchedKoboForms: false,
        koboForms: [],
        errorKoboForms: null,
      };
    case ACTION_TYPE.KOBO_FORMS_RESP:
      return {
        ...state,
        fetchingKoboForms: false,
        fetchedKoboForms: true,
        koboForms: parseData(action.payload.data.koboForms),
        koboFormsPageInfo: pageInfo(action.payload.data.koboForms),
        errorKoboForms: formatGraphQLError(action.payload),
      };
    case ACTION_TYPE.KOBO_FORMS_ERR:
      return {
        ...state,
        fetchingKoboForms: false,
        errorKoboForms: formatServerError(action.payload),
      };
    case ACTION_TYPE.SYNC_CONFIG_REQ:
      return {
        ...state,
        fetchingSyncConfig: true,
        fetchedSyncConfig: false,
        syncConfig: null,
        errorSyncConfig: null,
      };
    case ACTION_TYPE.SYNC_CONFIG_RESP:
      return {
        ...state,
        fetchingSyncConfig: false,
        fetchedSyncConfig: true,
        syncConfig: action.payload.data.syncConfig,
        errorSyncConfig: formatGraphQLError(action.payload),
      };
    case ACTION_TYPE.SYNC_CONFIG_ERR:
      return {
        ...state,
        fetchingSyncConfig: false,
        errorSyncConfig: formatServerError(action.payload),
      };
    case ACTION_TYPE.KOBO_MUTATION_REQ:
      return {
        ...state,
        submittingMutation: true,
        mutation: action.meta,
      };
    case ACTION_TYPE.KOBO_MUTATION_ERR:
      return {
        ...state,
        submittingMutation: false,
        mutation: {
          ...state.mutation,
          error: formatServerError(action.payload),
        },
      };
    case ACTION_TYPE.KOBO_UPDATE_SYNC_CONFIG_RESP:
      return {
        ...state,
        submittingMutation: false,
        mutation: {
          ...state.mutation,
          updateSyncConfig: action.payload.data.updateSyncConfig,
        },
      };
    default:
      return state;
  }
}

export default reducer;