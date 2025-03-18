import { graphql, formatPageQueryWithCount, formatMutation } from '@openimis/fe-core';
import { ACTION_TYPE } from './reducer';

const KOBO_FORMS_PROJECTION = () => [
  'id', 'title', 'description', 'status', 'dateCreated', 'dateModified'
  // Add more fields as needed
];

const SYNC_CONFIG_PROJECTION = () => [
  'id', 'lastSyncDate', 'syncInterval', 'koboServerUrl'
  // Add more fields as needed
];

export function fetchKoboForms(mm, filters) {
  const payload = formatPageQueryWithCount('koboForms', filters, KOBO_FORMS_PROJECTION());
  return graphql(payload, ACTION_TYPE.FETCH_KOBO_FORMS);
}

export function fetchSyncConfig(mm) {
  const payload = formatPageQueryWithCount('syncConfig', null, SYNC_CONFIG_PROJECTION());
  return graphql(payload, ACTION_TYPE.FETCH_SYNC_CONFIG);
}

export function updateSyncConfig(mm, syncConfig) {
  const mutation = formatMutation("updateSyncConfig", syncConfig);
  return graphql(mutation, ACTION_TYPE.UPDATE_SYNC_CONFIG);
}

export const koboFormsReq = () => ({ type: ACTION_TYPE.KOBO_FORMS_REQ });
export const koboFormsResp = (data) => ({ type: ACTION_TYPE.KOBO_FORMS_RESP, payload: { data } });
export const koboFormsErr = (error) => ({ type: ACTION_TYPE.KOBO_FORMS_ERR, payload: error });

export const syncConfigReq = () => ({ type: ACTION_TYPE.SYNC_CONFIG_REQ });
export const syncConfigResp = (data) => ({ type: ACTION_TYPE.SYNC_CONFIG_RESP, payload: { data } });
export const syncConfigErr = (error) => ({ type: ACTION_TYPE.SYNC_CONFIG_ERR, payload: error });

export const koboMutationReq = (meta) => ({ type: ACTION_TYPE.KOBO_MUTATION_REQ, meta });
export const koboMutationErr = (payload) => ({ type: ACTION_TYPE.KOBO_MUTATION_ERR, payload });
export const koboUpdateSyncConfigResp = (data) => ({ type: ACTION_TYPE.KOBO_UPDATE_SYNC_CONFIG_RESP, payload: { data } });