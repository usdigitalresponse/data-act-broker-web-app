/**
* CrossFileContentContainer.jsx
* Created by Kevin Li 6/14/16
*/

import React, { PropTypes } from 'react';
import { hashHistory } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as uploadActions from '../../redux/actions/uploadActions';
import { kGlobalConstants } from '../../GlobalConstants';
import * as UploadHelper from '../../helpers/uploadHelper';
import * as ReviewHelper from '../../helpers/reviewHelper';

import CrossFileContent from '../../components/crossFile/CrossFileContent';
import PublishedSubmissionWarningBanner from '../../components/SharedComponents/PublishedSubmissionWarningBanner';
import Banner from '../../components/SharedComponents/Banner';

const propTypes = {
    resetSubmission: PropTypes.func,
    setCrossFile: PropTypes.func,
    setSubmissionState: PropTypes.func,
    showError: PropTypes.func,
    submission: PropTypes.object,
    submissionID: PropTypes.string
};

const defaultProps = {
    resetSubmission: () => {},
    setCrossFile: () => {},
    setSubmissionState: () => {},
    showError: () => {},
    submission: {},
    submissionID: ""
};

const timerDuration = 10;

class CrossFileContentContainer extends React.Component {
    constructor(props) {
        super(props);

        this.dataTimer = null;
        this.isUnmounted = false;

        this.state = {
            agencyName: ""
        };
    }

    componentDidMount() {
        this.isUnmounted = false;
        this.setAgencyName(this.props);
        this.loadData();
        this.startTimer();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.submissionID !== nextProps.submissionID) {
            this.setAgencyName(nextProps);
        }
    }

    componentWillUnmount() {
        this.isUnmounted = true;
        // stop the timer
        if (this.dataTimer) {
            window.clearInterval(this.dataTimer);
            this.dataTimer = null;
        }
    }

    setAgencyName(givenProps) {
        if (givenProps.submissionID !== null) {
            ReviewHelper.fetchSubmissionMetadata(givenProps.submissionID)
                .then((data) => {
                    if (!this.isUnmounted) {
                        this.setState({ agencyName: data.agency_name });
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }

    uploadFiles() {
        if (kGlobalConstants.LOCAL === true) {
            UploadHelper.performLocalCorrectedUpload(this.props.submission)
                .then(() => {
                    this.props.resetSubmission();
                    // reload the data
                    this.loadData();
                    this.startTimer();
                });
        }
        else {
            UploadHelper.performRemoteCorrectedUpload(this.props.submission)
                .then(() => {
                    this.props.resetSubmission();
                    // reload the data
                    this.loadData();
                    this.startTimer();
                });
        }
    }

    hasEarlierErrors(data) {
        let errors = '';
        if (data.appropriations.has_errors || data.program_activity.has_errors || data.award_financial.has_errors) {
            errors = 'validation';
        }
        else if (data.award_procurement.has_errors || data.award.has_errors) {
            errors = 'generation';
        }
        return errors;
    }

    loadData() {
        this.props.setSubmissionState('empty');
        ReviewHelper.fetchStatus(this.props.submissionID)
            .then((data) => {
                const crossInfo = data.cross;
                if (crossInfo.status === 'ready') {
                    const earlierErrors = this.hasEarlierErrors(data);
                    if (earlierErrors) {
                        if (this.dataTimer) {
                            window.clearInterval(this.dataTimer);
                            this.dataTimer = null;
                        }

                        if (earlierErrors === 'validation') {
                            hashHistory.push(`/validateData/${this.props.submissionID}`);
                        }
                        else {
                            hashHistory.push(`/generateFiles/${this.props.submissionID}`);
                        }
                    }
                }
                // individual files are done and valid
                if (crossInfo.status === 'finished' || crossInfo.status === 'failed') {
                    // stop the timer once the validations are complete
                    ReviewHelper.fetchSubmissionData(this.props.submissionID, 'cross')
                        .then((response) => {
                            // there is only ever one job returned when the type is specified, simply use that one
                            const crossFile = {
                                errors: ReviewHelper.getCrossFileData(response.jobs[0], 'errors'),
                                warnings: ReviewHelper.getCrossFileData(response.jobs[0], 'warnings')
                            };
                            this.props.setSubmissionState('crossFile');
                            this.props.setCrossFile(crossFile);
                        });

                    if (this.dataTimer) {
                        window.clearInterval(this.dataTimer);
                        this.dataTimer = null;
                    }
                }
            })
            .catch((err) => {
                // check if the error has an associated user-displayable message
                if (Object.prototype.hasOwnProperty.call(err, 'detail') && err.detail !== '') {
                    if (!this.isUnmounted) {
                        this.props.showError(err.detail);
                    }
                }
                else {
                    console.error(err);
                }

                // stop the timer
                if (this.dataTimer) {
                    window.clearInterval(this.dataTimer);
                    this.dataTimer = null;
                }
            });
    }

    startTimer() {
        // keep checking the data every 5 seconds until it has finished loaded;
        this.dataTimer = window.setInterval(() => {
            this.loadData();
        }, timerDuration * 1000);
    }

    reloadData() {
        this.props.resetSubmission();
        this.loadData();
        this.startTimer();
    }

    render() {
        let warningMessage = null;
        if (this.props.submission.publishStatus !== "unpublished") {
            warningMessage = <PublishedSubmissionWarningBanner />;
        }

        return (
            <div>
                {warningMessage}
                <Banner type="dabs" />
                <CrossFileContent
                    {...this.props}
                    uploadFiles={this.uploadFiles.bind(this)}
                    reloadData={this.reloadData.bind(this)}
                    agencyName={this.state.agencyName} />
            </div>
        );
    }
}

CrossFileContentContainer.propTypes = propTypes;
CrossFileContentContainer.defaultProps = defaultProps;

export default connect(
    (state) => ({
        submission: state.submission,
        session: state.session
    }),
    (dispatch) => bindActionCreators(uploadActions, dispatch)
)(CrossFileContentContainer);
