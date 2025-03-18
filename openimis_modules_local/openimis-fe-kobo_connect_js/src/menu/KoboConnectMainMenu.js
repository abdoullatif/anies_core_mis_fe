/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { ListAlt, AddCircleOutline } from '@material-ui/icons';
import { formatMessage, MainMenuContribution, withModulesManager } from '@openimis/fe-core';
import {
  KOBO_CONNECT_MAIN_MENU_CONTRIBUTION_KEY,
  MODULE_NAME,
} from '../constants';


function KoboConnectMainMenu(props) {
  const ROUTE_KOBO_CONNECT_CONFIG = '/kobo_connect/config';
  const entries = [
    {
      text: formatMessage(props.intl, MODULE_NAME, 'menu.koboConnect.config'),
      icon: <ListAlt />,
      route: `/${ROUTE_KOBO_CONNECT_CONFIG}`,
    },
    {
      text: formatMessage(props.intl, MODULE_NAME, 'menu.koboConnect.keylist'),
      icon: <AddCircleOutline />,
      route: `/${ROUTE_KOBO_CONNECT_CONFIG}`,
    },
  ];
  entries.push(
    ...props.modulesManager
      .getContribs(KOBO_CONNECT_MAIN_MENU_CONTRIBUTION_KEY)
      .filter((c) => !c.filter || c.filter(props.rights)),
  );

  return (
    <MainMenuContribution
      {...props}
      header={formatMessage(props.intl, MODULE_NAME, 'mainMenuKoboConnect')}
      entries={entries}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export default injectIntl(withModulesManager(connect(mapStateToProps)(KoboConnectMainMenu)));