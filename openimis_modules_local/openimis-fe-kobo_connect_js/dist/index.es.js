import { formatServerError, formatGraphQLError, parseData, pageInfo, withModulesManager, formatMessage, MainMenuContribution, FormattedMessage, PublishedComponent, TextInput, journalize } from '@openimis/fe-core';
import _extends from '@babel/runtime/helpers/extends';
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { ListAlt, AddCircleOutline, Save } from '@material-ui/icons';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import '@material-ui/core/styles';
import { bindActionCreators } from 'redux';
import { Grid, Paper, Typography, Divider, IconButton } from '@material-ui/core';

var mainMenuKoboConnect = "Kobo Connect";
var messages_en = {
	"menu.koboConnect": "Kobo Connect",
	"menu.koboConfig": "Kobo Configuration",
	"page.koboConfig.title": "Kobo Synchronization Configuration",
	"menu.koboConnect.config": "Kobo Connect Configuration",
	"menu.koboConnect.keylist": "list of Connect Configuration",
	mainMenuKoboConnect: mainMenuKoboConnect
};

const ACTION_TYPE = {
  KOBO_FORMS_REQ: 'KOBO_FORMS_REQ',
  KOBO_FORMS_RESP: 'KOBO_FORMS_RESP',
  KOBO_FORMS_ERR: 'KOBO_FORMS_ERR',
  SYNC_CONFIG_REQ: 'SYNC_CONFIG_REQ',
  SYNC_CONFIG_RESP: 'SYNC_CONFIG_RESP',
  SYNC_CONFIG_ERR: 'SYNC_CONFIG_ERR',
  KOBO_MUTATION_REQ: 'KOBO_MUTATION_REQ',
  KOBO_MUTATION_ERR: 'KOBO_MUTATION_ERR',
  KOBO_UPDATE_SYNC_CONFIG_RESP: 'KOBO_UPDATE_SYNC_CONFIG_RESP'
};
const initialState = {
  fetchingKoboForms: false,
  fetchedKoboForms: false,
  errorKoboForms: null,
  koboForms: [],
  koboFormsPageInfo: {
    totalCount: 0
  },
  fetchingSyncConfig: false,
  fetchedSyncConfig: false,
  errorSyncConfig: null,
  syncConfig: null,
  submittingMutation: false,
  mutation: {}
};
function reducer() {
  let state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
  let action = arguments.length > 1 ? arguments[1] : undefined;
  switch (action.type) {
    case ACTION_TYPE.KOBO_FORMS_REQ:
      return {
        ...state,
        fetchingKoboForms: true,
        fetchedKoboForms: false,
        koboForms: [],
        errorKoboForms: null
      };
    case ACTION_TYPE.KOBO_FORMS_RESP:
      return {
        ...state,
        fetchingKoboForms: false,
        fetchedKoboForms: true,
        koboForms: parseData(action.payload.data.koboForms),
        koboFormsPageInfo: pageInfo(action.payload.data.koboForms),
        errorKoboForms: formatGraphQLError(action.payload)
      };
    case ACTION_TYPE.KOBO_FORMS_ERR:
      return {
        ...state,
        fetchingKoboForms: false,
        errorKoboForms: formatServerError(action.payload)
      };
    case ACTION_TYPE.SYNC_CONFIG_REQ:
      return {
        ...state,
        fetchingSyncConfig: true,
        fetchedSyncConfig: false,
        syncConfig: null,
        errorSyncConfig: null
      };
    case ACTION_TYPE.SYNC_CONFIG_RESP:
      return {
        ...state,
        fetchingSyncConfig: false,
        fetchedSyncConfig: true,
        syncConfig: action.payload.data.syncConfig,
        errorSyncConfig: formatGraphQLError(action.payload)
      };
    case ACTION_TYPE.SYNC_CONFIG_ERR:
      return {
        ...state,
        fetchingSyncConfig: false,
        errorSyncConfig: formatServerError(action.payload)
      };
    case ACTION_TYPE.KOBO_MUTATION_REQ:
      return {
        ...state,
        submittingMutation: true,
        mutation: action.meta
      };
    case ACTION_TYPE.KOBO_MUTATION_ERR:
      return {
        ...state,
        submittingMutation: false,
        mutation: {
          ...state.mutation,
          error: formatServerError(action.payload)
        }
      };
    case ACTION_TYPE.KOBO_UPDATE_SYNC_CONFIG_RESP:
      return {
        ...state,
        submittingMutation: false,
        mutation: {
          ...state.mutation,
          updateSyncConfig: action.payload.data.updateSyncConfig
        }
      };
    default:
      return state;
  }
}

const MODULE_NAME = 'kobo_connect';
const EMPTY_STRING = '';
const KOBO_CONNECT_MAIN_MENU_CONTRIBUTION_KEY = 'koboConnect.MainMenu';

function KoboConnectMainMenu(props) {
  const ROUTE_KOBO_CONNECT_CONFIG = '/kobo_connect/config';
  const entries = [{
    text: formatMessage(props.intl, MODULE_NAME, 'menu.koboConnect.config'),
    icon: /*#__PURE__*/React.createElement(ListAlt, null),
    route: `/${ROUTE_KOBO_CONNECT_CONFIG}`
  }, {
    text: formatMessage(props.intl, MODULE_NAME, 'menu.koboConnect.keylist'),
    icon: /*#__PURE__*/React.createElement(AddCircleOutline, null),
    route: `/${ROUTE_KOBO_CONNECT_CONFIG}`
  }];
  entries.push(...props.modulesManager.getContribs(KOBO_CONNECT_MAIN_MENU_CONTRIBUTION_KEY).filter(c => !c.filter || c.filter(props.rights)));
  return /*#__PURE__*/React.createElement(MainMenuContribution, _extends({}, props, {
    header: formatMessage(props.intl, MODULE_NAME, 'mainMenuKoboConnect'),
    entries: entries
  }));
}
const mapStateToProps$1 = state => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : []
});
var KoboConnectMainMenu$1 = injectIntl(withModulesManager(connect(mapStateToProps$1)(KoboConnectMainMenu)));

const koboFormsReq = () => ({
  type: ACTION_TYPE.KOBO_FORMS_REQ
});
const koboFormsResp = data => ({
  type: ACTION_TYPE.KOBO_FORMS_RESP,
  payload: {
    data
  }
});
const koboFormsErr = error => ({
  type: ACTION_TYPE.KOBO_FORMS_ERR,
  payload: error
});
const syncConfigReq = () => ({
  type: ACTION_TYPE.SYNC_CONFIG_REQ
});
const syncConfigResp = data => ({
  type: ACTION_TYPE.SYNC_CONFIG_RESP,
  payload: {
    data
  }
});

class KoboConfigPage extends Component {
  constructor(props) {
    super(props);
    _defineProperty(this, "save", () => {
      this.props.createTicket(this.state.stateEdited, this.props.grievanceConfig, `Created Ticket ${this.state.stateEdited.title.firstName}`);
      this.setState({
        isSaved: true
      });
    });
    _defineProperty(this, "updateAttribute", (k, v) => {
      this.setState(state => ({
        stateEdited: {
          ...state.stateEdited,
          [k]: v
        },
        isSaved: false // Reset isSaved when form is modified
      }));
    });
    // eslint-disable-next-line class-methods-use-this
    _defineProperty(this, "extractFieldFromJsonExt", (stateEdited, field) => {
      if (stateEdited && stateEdited.reporter && stateEdited.reporter.jsonExt) {
        const jsonExt = JSON.parse(stateEdited.reporter.jsonExt || '{}');
        return jsonExt[field] || '';
      }
      return '';
    });
    _defineProperty(this, "updateTypeOfGrievant", (field, value) => {
      this.updateAttribute('reporter', null);
      this.updateAttribute('reporterType', value);
      this.setState(state => ({
        grievantType: value
      }));
    });
    _defineProperty(this, "updateBenefitPlan", (field, value) => {
      this.updateAttribute('reporter', null);
      this.setState(state => ({
        benefitPlan: value
      }));
    });
    this.state = {
      stateEdited: {},
      grievantType: null,
      benefitPlan: null,
      isSaved: false
    };
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevPops, prevState, snapshort) {
    if (prevPops.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
    }
  }
  render() {
    const {
      classes,
      titleone = ' Ticket.ComplainantInformation',
      titletwo = ' Ticket.DescriptionOfEvents',
      titleParams = {
        label: EMPTY_STRING
      }
    } = this.props;
    const {
      stateEdited,
      grievantType,
      benefitPlan,
      isSaved
    } = this.state;
    return /*#__PURE__*/React.createElement("div", {
      className: classes.page
    }, /*#__PURE__*/React.createElement(Grid, {
      container: true
    }, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 12
    }, /*#__PURE__*/React.createElement(Paper, {
      className: classes.paper
    }, /*#__PURE__*/React.createElement(Grid, {
      container: true,
      className: classes.tableTitle
    }, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 8,
      className: classes.tableTitle
    }, /*#__PURE__*/React.createElement(Typography, null, /*#__PURE__*/React.createElement(FormattedMessage, {
      module: MODULE_NAME,
      id: titleone,
      values: titleParams
    })))), /*#__PURE__*/React.createElement(Grid, {
      container: true,
      className: classes.item
    }, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 3,
      className: classes.item
    }, "commentaire"), grievantType === 'individual' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 3,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "socialProtection.BenefitPlanPicker",
      withNull: true,
      label: "socialProtection.benefitPlan",
      value: benefitPlan,
      onChange: v => this.updateBenefitPlan('benefitPlan', v),
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 3,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "individual.IndividualPicker",
      value: stateEdited.reporter,
      label: "Complainant",
      onChange: v => this.updateAttribute('reporter', v),
      benefitPlan: benefitPlan,
      readOnly: isSaved
    }))), grievantType === 'beneficiary' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 3,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "socialProtection.BenefitPlanPicker",
      withNull: true,
      label: "socialProtection.benefitPlan",
      value: benefitPlan,
      onChange: v => this.updateBenefitPlan('benefitPlan', v),
      readOnly: isSaved
    })), benefitPlan && /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 3,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "socialProtection.BeneficiaryPicker",
      value: stateEdited.reporter,
      label: "Complainant",
      onChange: v => this.updateAttribute('reporter', v),
      benefitPlan: benefitPlan,
      readOnly: isSaved
    })))), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(Grid, {
      container: true,
      className: classes.item
    }, grievantType === 'individual' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 4,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      module: MODULE_NAME,
      label: "ticket.name",
      value: !!stateEdited && !!stateEdited.reporter
      // eslint-disable-next-line max-len
      ? `${stateEdited.reporter.firstName} ${stateEdited.reporter.lastName} ${stateEdited.reporter.dob}` : EMPTY_STRING,
      onChange: v => this.updateAttribute('name', v),
      required: false,
      readOnly: true
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 4,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      module: MODULE_NAME,
      label: "ticket.phone",
      value: !!stateEdited && !!stateEdited.reporter ? this.extractFieldFromJsonExt(stateEdited, 'phone') : EMPTY_STRING,
      onChange: v => this.updateAttribute('phone', v),
      required: false,
      readOnly: true
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 4,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      module: MODULE_NAME,
      label: "ticket.email",
      value: !!stateEdited && !!stateEdited.reporter ? this.extractFieldFromJsonExt(stateEdited, 'email') : EMPTY_STRING,
      onChange: v => this.updateAttribute('email', v),
      required: false,
      readOnly: true
    }))), grievantType === 'beneficiary' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 4,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      module: MODULE_NAME,
      label: "ticket.name",
      value: !!stateEdited && !!stateEdited.reporter
      // eslint-disable-next-line max-len
      ? `${stateEdited.reporter.individual.firstName} ${stateEdited.reporter.individual.lastName} ${stateEdited.reporter.individual.dob}` : EMPTY_STRING,
      onChange: v => this.updateAttribute('name', v),
      required: false,
      readOnly: true
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 4,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      module: MODULE_NAME,
      label: "ticket.phone",
      value: !!stateEdited && !!stateEdited.reporter ? this.extractFieldFromJsonExt(stateEdited, 'phone') : EMPTY_STRING,
      onChange: v => this.updateAttribute('phone', v),
      required: false,
      readOnly: true
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 4,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      module: MODULE_NAME,
      label: "ticket.email",
      value: !!stateEdited && !!stateEdited.reporter ? this.extractFieldFromJsonExt(stateEdited, 'email') : EMPTY_STRING,
      onChange: v => this.updateAttribute('email', v),
      required: false,
      readOnly: true
    }))))))), /*#__PURE__*/React.createElement(Grid, {
      container: true
    }, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 12
    }, /*#__PURE__*/React.createElement(Paper, {
      className: classes.paper
    }, /*#__PURE__*/React.createElement(Grid, {
      container: true,
      className: classes.tableTitle
    }, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 12,
      className: classes.tableTitle
    }, /*#__PURE__*/React.createElement(Typography, null, /*#__PURE__*/React.createElement(FormattedMessage, {
      module: MODULE_NAME,
      id: titletwo,
      values: titleParams
    })))), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(Grid, {
      container: true,
      className: classes.item
    }, /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 6,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      label: "ticket.title",
      value: stateEdited.title,
      onChange: v => this.updateAttribute('title', v),
      required: true,
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 6,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "core.DatePicker",
      label: "ticket.dateOfIncident",
      value: stateEdited.dateOfIncident,
      required: false,
      onChange: v => this.updateAttribute('dateOfIncident', v),
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 6,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "grievanceSocialProtection.DropDownCategoryPicker",
      value: stateEdited.category,
      onChange: v => this.updateAttribute('category', v),
      required: true,
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 6,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "grievanceSocialProtection.FlagPicker",
      value: stateEdited.flags,
      onChange: v => this.updateAttribute('flags', v),
      required: true,
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 6,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "grievanceSocialProtection.ChannelPicker",
      value: stateEdited.channel,
      onChange: v => this.updateAttribute('channel', v),
      required: true,
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 6,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "grievanceSocialProtection.TicketPriorityPicker",
      value: stateEdited.priority,
      onChange: v => this.updateAttribute('priority', v),
      required: false,
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 6,
      className: classes.item
    }, /*#__PURE__*/React.createElement(PublishedComponent, {
      pubRef: "admin.UserPicker",
      value: stateEdited.attendingStaff,
      module: "core",
      onChange: v => this.updateAttribute('attendingStaff', v),
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 12,
      className: classes.item
    }, /*#__PURE__*/React.createElement(TextInput, {
      label: "ticket.ticketDescription",
      value: stateEdited.description,
      onChange: v => this.updateAttribute('description', v),
      required: false,
      readOnly: isSaved
    })), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 11,
      className: classes.item
    }), /*#__PURE__*/React.createElement(Grid, {
      item: true,
      xs: 1,
      className: classes.item
    }, /*#__PURE__*/React.createElement(IconButton, {
      variant: "contained",
      component: "label",
      color: "primary",
      onClick: this.save
      // eslint-disable-next-line max-len
      ,
      disabled: !stateEdited.channel || !stateEdited.flags || !stateEdited.channel || !stateEdited.title || isSaved
    }, /*#__PURE__*/React.createElement(Save, null))))))));
  }
}

// eslint-disable-next-line no-unused-vars
const mapStateToProps = (state, props) => ({
  submittingMutation: state.koboConnect.submittingMutation,
  mutation: state.koboConnect.mutation
  //grievanceConfig: state.koboConnect.grievanceConfig,
});
const mapDispatchToProps = dispatch => bindActionCreators({
  koboFormsReq,
  koboFormsResp,
  koboFormsErr,
  syncConfigReq,
  syncConfigResp,
  journalize
}, dispatch);

//export default withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(KoboConfigPage)));

var KoboConfigPage$1 = connect(mapStateToProps, mapDispatchToProps)(KoboConfigPage);

//export default KoboConfigPage;

const ROUTE_KOBO_CONFIG = 'kobo_connect/config';
const DEFAULT_CONFIG = {
  translations: [{
    key: 'en',
    messages: messages_en
  }],
  reducers: [{
    key: 'koboConnect',
    reducer
  }],
  'core.MainMenu': [KoboConnectMainMenu$1],
  'core.Router': [{
    path: ROUTE_KOBO_CONFIG,
    component: KoboConfigPage$1
  }],
  refs: [{
    key: 'koboConnect.route.koboConfig',
    ref: ROUTE_KOBO_CONFIG
  }]
};
const KoboConnectModule = cfg => ({
  ...DEFAULT_CONFIG,
  ...cfg
});

export { KoboConnectModule };
//# sourceMappingURL=index.es.js.map
