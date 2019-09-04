/**
* RouterContainer.jsx
* Created by Kevin Li 3/16/15
*/

import React from 'react';
import PropTypes from 'prop-types';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from "history";

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ReactGA from 'react-ga';

import { kGlobalConstants } from '../../GlobalConstants';
import * as sessionActions from '../../redux/actions/sessionActions';
import * as LoginHelper from '../../helpers/loginHelper';
import RouterRoutes from './RouterRoutes';

const GA_OPTIONS = { debug: false };
const isProd = process.env.NODE_ENV === 'production';

const propTypes = {
    session: PropTypes.object
};

const defaultProps = {
    session: {}
};

const Routes = new RouterRoutes();
const history = createBrowserHistory();

let sessionChecker;

class RouterContainer extends React.Component {
    componentDidMount() {
        if (isProd && kGlobalConstants.GA_TRACKING_ID !== '') {
            ReactGA.initialize(kGlobalConstants.GA_TRACKING_ID, GA_OPTIONS);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.session.login !== prevProps.session.login) {
            if (this.props.session.login === "loggedIn") {
                // we've switched from either a logged out state to logged in or
                // we've received session data back from the backend
                // so we should auto-relogin
                Routes.autoLogin(this.router.state.location);
                this.monitorSession();
            }
            else if (this.props.session.login === "loggedOut" && prevProps.session.login === "loggedIn") {
                this.logout();
            }
        }
    }

    logout() {
        LoginHelper.performLogout()
            .then(() => {
                history.push('/login');
            });
    }

    handleRouteChange() {
        this.logPageView(window.location.hash);
    }

    logPageView(path) {
        if (isProd && kGlobalConstants.GA_TRACKING_ID !== '') {
            ReactGA.pageview(path);
        }
    }

    monitorSession() {
        // start a timer to periodically check the user's session state every 15 minutes
        sessionChecker = setInterval(() => {
            LoginHelper.checkSession()
                .catch(() => {
                    // session expired, stop checking if it's active any more
                    clearInterval(sessionChecker);
                });
        }, 15 * 60 * 1000);
    }

    render() {
        return (
            <Router
                routes={Routes.routes()}
                history={history}
                onUpdate={this.handleRouteChange.bind(this)}
                ref={(c) => {
                    this.router = c;
                }} />
        );
    }
}

RouterContainer.propTypes = propTypes;
RouterContainer.defaultProps = defaultProps;

export default connect(
    (state) => ({
        session: state.session
    }),
    (dispatch) => bindActionCreators(sessionActions, dispatch)
)(RouterContainer);
