/**
 * HelpSidebar.jsx
 * Created by Mike Bray 4/1/16
 */

import React, { PropTypes } from 'react';
import HelpSidebarItem from './helpSidebarItem';
import { generateProtectedUrls } from '../../helpers/util';

const propTypes = {
    changeSections: PropTypes.array,
    technicalSections: PropTypes.array,
    type: PropTypes.string,
    helpOnly: PropTypes.bool
};

const defaultProps = {
    changeSections: [],
    technicalSections: [],
    type: '',
    helpOnly: false
};

export default class HelpSidebar extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            reportingWindowUrl: '#'
        };
    }

    componentDidMount() {
        // load the validation rules URL
        this.urlPromise = generateProtectedUrls();
        this.urlPromise.promise
            .then((urls) => {
                this.setState({
                    reportingWindowUrl: urls['FY18 DABS Reporting Window Schedule.xls']
                });

                this.urlPromise = null;
            });
    }

    render() {
        const clSectionList = this.props.changeSections.map((section, index) => (<HelpSidebarItem
            key={index}
            sectionName={section.name}
            sectionId={section.link}
            type={this.props.type} />));

        const tSectionList = this.props.technicalSections.map((section, index) => (
            <HelpSidebarItem
                key={index}
                sectionName={section.name}
                sectionId={section.link}
                type={this.props.type} />
        ));

        let membership = null;
        if (this.props.helpOnly) {
            membership = (
                <li>
                    <a href="/#/help?section=agencyAccess">Request Agency Access</a>
                </li>
            );
        }

        const help = this.props.type === 'fabs' ? "/#/FABSHelp" : '/#/help';
        const history = this.props.type === 'fabs' ? "/#/FABSHistory" : '/#/history';
        const technicalHistory = this.props.type === 'fabs' ? "/#/FABSTechnicalHistory" : '/#/technicalHistory';
        const resources = this.props.type === 'fabs' ? "/#/FABSResources" : '/#/resources';
        const validations = this.props.type === 'fabs' ? "/#/FABSValidations" : '/#/validations';
        let schedule = null;
        if (this.props.type === 'dabs') {
            schedule = (
                <div>
                    <h6>Submission Deadlines</h6>
                    <ul>
                        <li>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={this.state.reportingWindowUrl}>
                                    Fiscal Year 2018 DABS Reporting Schedule
                            </a>
                        </li>
                    </ul>
                </div>
            );
        }

        return (
            <div className="usa-da-help-sidebar">
                {schedule}
                <h6>What’s New in This Release</h6>
                <ul>
                    {clSectionList}
                    <li>
                        <a href={history}>Release Notes Archive</a>
                    </li>
                </ul>
                <h6>This Releases Technical Notes</h6>
                <ul>
                    {tSectionList}
                    <li>
                        <a href={technicalHistory}>Technical Notes Archive</a>
                    </li>
                </ul>
                <h6>Getting More Help</h6>
                <ul>
                    {membership}
                    <li>
                        <a href={`${help}?section=membership`}>Contact the Service Desk</a>
                    </li>
                    <li>
                        <a href={resources}>Resources - DAIMS</a>
                    </li>
                    <li>
                        <a href={validations}>Validations</a>
                    </li>
                </ul>
                <div className="usa-da-help-sidebar__signup">
                    <div className="usa-da-help-sidebar__signup-content">
                        <span
                            className="usa-da-help-sidebar__signup-header usa-da-help-sidebar__signup-header_bold">
                            Receive Data Act Broker Updates
                        </span>
                        <p>Subscribe to a list-serv for Broker updates as well as regular release notes.</p>
                        <a
                            className="usa-da-help-sidebar__signup-btn"
                            href="mailto:join-data-act-broker@lists.fiscal.treasury.gov?subject=
                            Sign%20Up%20for%20Broker%20Updates&body=Yes,%20sign%20me%20up%20for
                            %20Data%20Act%20Broker%20Updates!">

                            Sign Up
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}

HelpSidebar.propTypes = propTypes;
HelpSidebar.defaultProps = defaultProps;
