/**
 * ValidateDataFileComponent.jsx
 * Created by Mike Bray 3/28/16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import { validUploadFileChecker, createOnKeyDownHandler } from 'helpers/util';
import * as GenerateFilesHelper from 'helpers/generateFilesHelper';
import FileProgress from 'components/SharedComponents/FileProgress';
import * as Icons from 'components/SharedComponents/icons/Icons';
import * as PermissionsHelper from 'helpers/permissionsHelper';
import ValidateDataErrorReport from './ValidateDataErrorReport';
import ValidateDataUploadButton from './ValidateDataUploadButton';
import UploadFabsFileError from '../uploadFabsFile/UploadFabsFileError';


const propTypes = {
    onFileChange: PropTypes.func,
    item: PropTypes.object,
    session: PropTypes.object,
    submission: PropTypes.object,
    type: PropTypes.object,
    agencyName: PropTypes.string,
    publishing: PropTypes.bool
};

const defaultProps = {
    onFileChange: () => {},
    item: {},
    session: {},
    submission: {},
    type: {},
    agencyName: '',
    publishing: false
};

export default class ValidateDataFileComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showError: false,
            headerTitle: 'Validating...',
            errorReports: [],
            hasErrorReport: false,
            isError: false,
            signedUrl: '',
            signInProgress: false,
            error: null,
            canDownload: false
        };

        this.toggleErrorReport = this.toggleErrorReport.bind(this);
        this.clickedReport = this.clickedReport.bind(this);
    }

    componentDidMount() {
        this.determineErrors(this.props.item);
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(this.props.item, prevProps.item)) {
            this.determineErrors(this.props.item);
        }

        if ((prevProps.submission.state === 'uploading' || prevProps.submission.state === 'prepare') &&
            this.props.submission.state === 'review') {
            // we've finished uploading files, close any open error reports
            if (this.state.showError) {
                this.clearError();
            }
        }
    }

    toggleErrorReport() {
        this.setState({ showError: !this.state.showError });
    }

    isFileReady() {
        return (this.props.item.job_status === 'finished' || this.props.item.job_status === 'invalid');
    }

    isReplacingFile() {
        // check if the user is trying to replace a file
        return (Object.prototype.hasOwnProperty.call(this.props.submission.files, this.props.type.requestName));
    }

    clearError() {
        this.setState({
            showError: false
        });
    }

    determineErrors(item) {
        if (!item) {
            return;
        }

        let headerTitle = 'Validating...';
        let isError = false;
        let hasErrorReport = false;
        let canDownload = false;
        let errorData = [];

        // handle header errors
        const missingHeaders = item.missing_headers ? item.missing_headers.length : 0;
        const duplicatedHeaders = item.duplicated_headers ? item.duplicated_headers.length : 0;
        if (missingHeaders > 0 || duplicatedHeaders > 0) {
            let errorKeys = [];
            isError = true;
            canDownload = true;
            hasErrorReport = true;
            if (missingHeaders > 0 && duplicatedHeaders > 0) {
                headerTitle = 'Critical Errors: Missing fields in header row & duplicate fields in header row';
                errorKeys = ["missing_headers", "duplicated_headers"];
            }
            else if (missingHeaders > 0) {
                headerTitle = 'Critical Error: Missing fields in header row';
                errorKeys = ["missing_headers"];
            }
            else {
                headerTitle = 'Critical Error: Duplicate fields in header row';
                errorKeys = ["duplicated_headers"];
            }
            errorKeys.forEach((key) => {
                errorData.push({
                    header: (key === 'missing_headers') ? 'Missing Headers:' : 'Duplicate Headers:',
                    data: item[key]
                });
            });
        }
        else if (item.error_type === 'header_errors') {
            // special case where the header rows could not be read
            headerTitle = 'Critical Error: The header row could not be parsed.';
            isError = true;
            canDownload = true;
        }

        // handle file-level errors
        if (item.file_status !== 'complete') {
            hasErrorReport = item.file_status === 'header_error';
            isError = true;
            canDownload = true;

            switch (item.file_status) {
                case 'single_row_error':
                    headerTitle = 'Critical Error: File must have a header row and at least one record';
                    break;
                case 'encoding_error':
                    headerTitle = 'Critical Error: File contains invalid characters that could not be parsed';
                    break;
                case 'row_count_error':
                    headerTitle = 'Critical Error: Raw file row count does not match the number of rows validated';
                    break;
                case 'file_type_error':
                    headerTitle = 'Critical Error: Invalid file type. Valid file types include .csv and .txt';
                    canDownload = false;
                    break;
                case 'unknown_error':
                    isError = false;
                    break;
                default:
                    break;
            }
        }

        // handle failed job
        if (item.job_status === 'failed' || item.file_status === 'job_error' ||
            (item.job_status === 'invalid' && !isError)) {
            headerTitle = 'An error occurred while validating this file. Contact the Service Desk for assistance.';
            errorData = [];
            hasErrorReport = false;
            canDownload = true;
            isError = false;
        }

        // check if file is still validating
        if (item.file_status === 'incomplete' || !this.isFileReady()) {
            headerTitle = 'Validating...';
            hasErrorReport = false;
            isError = false;
            canDownload = false;
        }

        if (this.props.publishing) {
            headerTitle = 'Publishing...';
        }

        this.setState({
            headerTitle,
            errorReports: errorData,
            hasErrorReport,
            isError,
            canDownload
        });
    }

    displayFileMeta() {
        let size = '--';
        let rows = 0;

        if (this.isFileReady()) {
            if (this.props.item.number_of_rows) {
                rows = this.props.item.number_of_rows;
            }
            if (this.props.item.file_size) {
                size = `${(this.props.item.file_size / 1000000).toFixed(2)} MB`;
                if (this.props.item.file_size < 100000) {
                    size = `${(this.props.item.file_size / 1000).toFixed(2)} KB`;
                }
            }
        }

        return {
            size,
            rows
        };
    }

    displayIcon() {
        let icon = '';
        if (this.isReplacingFile()) {
            // user is attempting to replace a file
            icon = <Icons.CloudUpload />;
        }
        else if (this.isFileReady()) {
            if (this.props.item.file_status === 'complete') {
                icon = <Icons.CheckCircle />;
            }
            else {
                icon = <Icons.ExclamationCircle />;
            }
        }
        return icon;
    }

    signReport(item) {
        let type = null;
        switch (item.file_type) {
            case 'appropriations':
                type = 'A';
                break;
            case 'program_activity':
                type = 'B';
                break;
            case 'award_financial':
                type = 'C';
                break;
            case 'fabs':
                type = 'FABS';
                break;
            default:
                break;
        }
        if (type) {
            GenerateFilesHelper.fetchFile(type, this.props.submission.id)
                .then((result) => {
                    this.setState({
                        signInProgress: false,
                        signedUrl: result.url
                    }, () => {
                        this.openReport();
                    });
                })
                .catch(() => {
                    this.setState({
                        signInProgress: false,
                        error: {
                            header: `Invalid File Type Selected ${item.file_type}`,
                            body: ''
                        }
                    });
                });
        }
        else {
            this.setState({
                signInProgress: false,
                error: {
                    header: `Invalid File Type Selected ${item.file_type}`,
                    body: ''
                }
            });
        }
    }

    openReport() {
        window.open(this.state.signedUrl);
    }

    clickedReport() {
        if (this.state.canDownload && !this.state.signInProgress) {
            // check if the link is already signed
            if (this.state.signedUrl !== '') {
                // it is signed, open immediately
                this.openReport();
            }
            else {
                // not signed yet, sign
                this.setState({
                    signInProgress: true
                }, () => {
                    this.signReport(this.props.item);
                });
            }
        }
    }

    render() {
        const onKeyDownHandler = createOnKeyDownHandler(this.toggleErrorReport);

        let disabledCorrect = '';
        let isFileValid = 'unset';
        let messageClass = ' usa-da-validate-item-message';
        if (!this.state.isError && this.isFileReady()) {
            messageClass = '';
            disabledCorrect = ' hide';
        }
        else if (!this.isFileReady()) {
            messageClass = '';
            disabledCorrect = ' hide';
        }

        let showFooter = ' hide';
        if (this.state.hasErrorReport) {
            showFooter = '';
        }

        let chevronDirection = <Icons.AngleDown />;
        if (this.state.showError) {
            chevronDirection = <Icons.AngleUp />;
        }

        let footerStatus = '';
        if (this.state.showError) {
            footerStatus = 'active';
        }

        // override this data if a new file is dropped in
        let uploadProgress = '';
        let fileName = this.props.item.filename;

        const clickDownloadOnKeyDownHandler = createOnKeyDownHandler(this.clickedReport);
        const clickDownloadClass = this.state.canDownload ? 'file-download' : '';


        if (this.isReplacingFile()) {
            // also display the new file name
            const newFile = this.props.submission.files[this.props.type.requestName];

            isFileValid = validUploadFileChecker(newFile);
            fileName = newFile.file.name;

            if (newFile.state === 'uploading') {
                uploadProgress = <FileProgress fileStatus={newFile.progress} />;
            }
        }

        if (this.props.type.requestName === 'fabs') {
            if (!PermissionsHelper.checkFabsAgencyPermissions(this.props.session, this.props.agencyName)) {
                disabledCorrect = ' hide';
            }
        }
        else if (!PermissionsHelper.checkAgencyPermissions(this.props.session, this.props.agencyName)) {
            disabledCorrect = ' hide';
        }

        const errorMessage = this.state.error ? (<UploadFabsFileError error={this.state.error} />) : null;

        const { size, rows } = this.displayFileMeta();

        return (
            <div
                className="row center-block usa-da-validate-item"
                data-testid={`validate-wrapper-${this.props.type.requestName}`}>
                <div className="col-md-12">
                    {errorMessage}
                    <div className="row usa-da-validate-item-top-section">
                        <div className="col-md-9 usa-da-validate-item-status-section">
                            <div className="row usa-da-validate-item-header">
                                <div className="col-md-6">
                                    <h4>{this.props.type.fileTitle}</h4>
                                </div>
                                <div className="col-md-2">
                                    <p>File Size: {size}</p>
                                </div>
                                <div className="col-md-4">
                                    <p className="pr-20">Data Rows in File (excludes header): {rows}</p>
                                </div>
                            </div>
                            <div className="row usa-da-validate-item-body">
                                <div
                                    className={`col-md-12 usa-da-validate-txt-wrap${messageClass}`}
                                    data-testid="validate-message">
                                    {isFileValid ? this.state.headerTitle : `${fileName} must be CSV or TXT format`}
                                </div>
                            </div>
                            <div className="row usa-da-validate-item-footer-wrapper">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className={`usa-da-validate-item-footer usa-da-header-error${showFooter} ${
                                        footerStatus}`}
                                    onKeyDown={onKeyDownHandler}
                                    onClick={this.toggleErrorReport}>
                                    <div>View &amp; Download Header Error Report
                                        <span className="usa-da-icon">{chevronDirection}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3 file-container">
                            <div className="usa-da-validate-item-file-section">
                                <div className="usa-da-validate-item-file-section-result">
                                    <div
                                        className="usa-da-icon"
                                        data-testid="validate-icon">
                                        {isFileValid ? this.displayIcon() : <Icons.ExclamationCircle />}
                                    </div>
                                </div>
                                {uploadProgress}
                                <div className="row usa-da-validate-item-file-name">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className={clickDownloadClass}
                                        onKeyDown={clickDownloadOnKeyDownHandler}
                                        onClick={this.clickedReport}
                                        download={fileName}
                                        rel="noopener noreferrer">
                                        {fileName}
                                    </div>
                                </div>
                                {isFileValid ? '' : `${fileName} must be CSV or TXT format`}
                                <div
                                    className={`
                                        usa-da-validate-item-file-section-correct-button
                                        ${isFileValid ? disabledCorrect : ''}
                                        `}
                                    data-testid="validate-upload">
                                    <div className="row">
                                        <div className="col-md-12">
                                            <ValidateDataUploadButton onDrop={this.props.onFileChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {this.state.showError ? <ValidateDataErrorReport
                        submission={this.props.submission.id}
                        type={this.props.item.file_type}
                        data={this.state.errorReports} /> : null}
                </div>
            </div>
        );
    }
}

ValidateDataFileComponent.propTypes = propTypes;
ValidateDataFileComponent.defaultProps = defaultProps;
