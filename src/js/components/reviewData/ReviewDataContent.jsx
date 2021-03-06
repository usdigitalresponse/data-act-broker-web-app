/**
 * ReviewDataContent.jsx
 * Created by Mike Bray 3/28/16
 */

import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { formatMoneyWithPrecision } from 'helpers/moneyFormatter';
import { checkAffiliations } from 'helpers/permissionsHelper';
import * as Icons from 'components/SharedComponents/icons/Icons';
import RevertToCertifiedContainer from 'containers/reviewData/RevertToCertifiedContainer';
import ReviewDataContentRow from './ReviewDataContentRow';
import ReviewDataButton from './ReviewDataButton';
import ReviewDataNotifyModal from './ReviewDataNotifyModal';
import ReviewDataCertifyModal from './CertificationModal/ReviewDataCertifyModal';
import RevalidateDataModal from './CertificationModal/RevalidateDataModal';
import ReviewDataNarrative from './ReviewDataNarrative';

import { formatSize } from '../../helpers/util';

const propTypes = {
    data: PropTypes.object,
    session: PropTypes.object,
    submissionID: PropTypes.string,
    testSubmission: PropTypes.bool,
    loadData: PropTypes.func
};

const defaultProps = {
    data: null,
    session: null,
    submissionID: ''
};

export default class ReviewDataContent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            openNotify: false,
            openCertify: false,
            openRevalidate: false
        };
    }

    openModal(type, e) {
        e.preventDefault();

        this.setState({
            [`open${type}`]: true
        });
    }

    closeModal(type, e) {
        if (e) {
            e.preventDefault();
        }
        this.setState({
            [`open${type}`]: false
        });
    }

    windowBlocked() {
        if (!this.props.data.window) {
            return false;
        }
        let currentWindow = null;
        for (let i = 0; i < this.props.data.window.length; i++) {
            if (this.props.data.window[i].notice_block) {
                if (currentWindow === null) {
                    currentWindow = this.props.data.window[i];
                }
                else if (moment(this.props.data.window[i].end_date) > moment(currentWindow.end_date)) {
                    currentWindow = this.props.data.window[i];
                }
            }
        }
        if (currentWindow) {
            return currentWindow;
        }
        return false;
    }

    render() {
        // The first parameter in each of these arrays is the corresponding class for the SVG icon
        const buttonContent = [[<Icons.CheckCircle />, 'Publish this data to USAspending.gov'],
            [<Icons.ShareSquare />, 'Send this data to another Data Broker user'],
            [<Icons.CloudDownload />, 'Download this data to your computer'],
            [<Icons.Trash />, 'Delete this data from the Data Broker']];

        const buttons = [];
        for (let i = 0; i < buttonContent.length; i++) {
            buttons.push(<ReviewDataButton key={i} icon={buttonContent[i][0]} label={buttonContent[i][1]} />);
        }

        const reportLabels = ['Agency Name:', 'Report Start Date:', 'Report End Date:',
            'Award Obligations Incurred (file C):', 'Total Financial Assistance Obligations:',
            'Total Procurement Obligations:'];

        const reportData = [
            this.props.data.agency_name,
            this.props.data.reporting_period,
            this.props.data.reporting_period,
            formatMoneyWithPrecision(this.props.data.total_obligations, 2),
            formatMoneyWithPrecision(this.props.data.total_assistance_obligations, 2),
            formatMoneyWithPrecision(this.props.data.total_procurement_obligations, 2)
        ];

        const reportRows = [];

        for (let j = 0; j < reportLabels.length; j++) {
            reportRows.push(<ReviewDataContentRow key={j} label={reportLabels[j]} data={reportData[j]} />);
        }

        let certifyButtonText = 'You do not have permissions to certify';
        let revalidateButtonText = 'You do not have permission to revalidate';
        let buttonClass = ' btn-disabled';
        let certifyButtonAction;
        let revalidateButtonAction;
        let monthlySubmissionError = null;
        // TODO: I don't think we ever actually have window data to gather, we should look into this
        const blockedWindow = this.windowBlocked();

        if (this.props.data.publish_status === 'published') {
            certifyButtonText = 'Submission has already been certified';
        }
        else if (!this.props.data.quarterly_submission) {
            certifyButtonText = 'Monthly submissions cannot be certified';
            monthlySubmissionError = (
                <div
                    className="alert alert-danger text-center monthly-submission-error"
                    role="alert">
                    Monthly submissions cannot be certified
                </div>);
        }
        else if (blockedWindow) {
            certifyButtonText = `You cannot certify until ${
                moment(blockedWindow.end_date).format('dddd, MMMM D, YYYY')}`;
        }
        else if (this.props.testSubmission) {
            certifyButtonText = 'Test submissions cannot be certified';
        }
        else if (checkAffiliations(this.props.session, 'submitter', this.props.data.agency_name) || this.props.session.admin) {
            certifyButtonText = 'Certify & Publish';
            buttonClass = '';
            certifyButtonAction = this.openModal.bind(this, 'Certify');
        }
        if (checkAffiliations(this.props.session, 'writer', this.props.data.agency_name) || this.props.session.admin) {
            revalidateButtonText = 'Revalidate';
            revalidateButtonAction = this.openModal.bind(this, 'Revalidate');
        }

        return (
            <div className="container">
                <div className="row center-block mt-60">
                    <div className="col-md-12 text-center">
                        <h5 data-testid="review-header">
                            Congratulations your data has been successfully validated!
                            Now, what would you like to do with it?
                        </h5>
                    </div>
                </div>
                <div className="center-block usa-da-review-data-content-holder">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="usa-da-file-wrap">
                                <div className="usa-da-icon usa-da-icon-CheckCircle">
                                    <Icons.CheckCircle />
                                </div>
                                <div className="usa-da-submission-info">
                                    <ul className="no-bullet">
                                        <li>Total File Size:
                                            <strong> {formatSize(this.props.data.total_size)}</strong>
                                        </li>
                                        <li>Total Data Rows (excludes headers):
                                            <strong> {this.props.data.number_of_rows}</strong>
                                        </li>
                                        <li>Created on: <strong>{this.props.data.created_on}</strong></li>
                                        <li>Total Warnings: <strong>{this.props.data.number_of_warnings}</strong></li>
                                    </ul>
                                </div>
                                <RevertToCertifiedContainer loadData={this.props.loadData} />
                            </div>
                        </div>
                        <div className="right-side col-md-8">
                            <div className="usa-da-review-data-alternating-rows">
                                {reportRows}
                            </div>
                            <div className="row">
                                <ReviewDataNarrative
                                    narrative={this.props.data.file_narrative}
                                    submissionID={this.props.submissionID}
                                    loadData={this.props.loadData} />
                            </div>
                            <div className="row submission-button-holder">
                                <div className="submission-wrapper">
                                    <div className="left-link">
                                        <button
                                            onClick={revalidateButtonAction}
                                            disabled={!revalidateButtonAction}
                                            className="usa-da-button btn-primary btn-lg btn-full">
                                            <div className="button-wrapper">
                                                <div className="button-icon">
                                                    <Icons.Revalidate />
                                                </div>
                                                <div className="button-content">
                                                    {revalidateButtonText}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="left-link">
                                        <button
                                            onClick={certifyButtonAction}
                                            disabled={!certifyButtonAction}
                                            className={`usa-da-button btn-primary btn-lg btn-full ${buttonClass}`}>
                                            <div className="button-wrapper row">
                                                <div className="button-icon">
                                                    <Icons.Globe />
                                                </div>
                                                <div className="button-content">
                                                    {certifyButtonText}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="right-link">
                                        <button
                                            onClick={this.openModal.bind(this, 'Notify')}
                                            className="usa-da-button btn-primary btn-lg btn-full last">
                                            <div className="button-wrapper">
                                                <div className="button-icon">
                                                    <Icons.Bell />
                                                </div>
                                                <div className="button-content">
                                                    Notify Another User
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {monthlySubmissionError}
                        </div>
                    </div>
                    <div id="reviewDataNotifyModalHolder">
                        <ReviewDataNotifyModal
                            {...this.props}
                            closeModal={this.closeModal.bind(this, 'Notify')}
                            isOpen={this.state.openNotify} />
                    </div>
                    <div id="reviewDataCertifyModalHolder">
                        <ReviewDataCertifyModal
                            {...this.props}
                            closeModal={this.closeModal.bind(this, 'Certify')}
                            isOpen={this.state.openCertify}
                            warnings={this.props.data.number_of_warnings} />
                    </div>
                    <div id="revalidateDataModalHolder">
                        <RevalidateDataModal
                            {...this.props}
                            closeModal={this.closeModal.bind(this, 'Revalidate')}
                            isOpen={this.state.openRevalidate} />
                    </div>
                </div>
            </div>
        );
    }
}

ReviewDataContent.propTypes = propTypes;
ReviewDataContent.defaultProps = defaultProps;
