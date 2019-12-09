/**
  * GenerateFilesPage.jsx
  * Created by Kevin Li 7/22/16
  */

import React from 'react';
import PropTypes from 'prop-types';

import GenerateFileBox from './components/GenerateFileBox';
import GenerateFilesOverlay from './GenerateFilesOverlay';
import RadioSection from '../generateDetachedFiles/RadioSection';

const propTypes = {
    clickedDownload: PropTypes.func,
    handleDateChange: PropTypes.func,
    updateError: PropTypes.func,
    d1: PropTypes.object,
    d2: PropTypes.object,
    updateFileProperty: PropTypes.func
};

const defaultProps = {
    clickedDownload: null,
    handleDateChange: null,
    updateError: null,
    d1: null,
    d2: null,
    updateFileProperty: null
};

export default class GenerateFilesContent extends React.Component {
    clickedDownload(fileType) {
        this.props.clickedDownload(fileType);
    }

    handleDateChange(file, date, dateType) {
        this.props.handleDateChange(file, date, dateType);
    }

    updateError(file, header = '', description = '') {
        this.props.updateError(file, header, description);
    }

    render() {
        const { d1, d2 } = this.props;

        return (
            <div>
                <div className="container center-block with-overlay">
                    <div className="row usa-da-submission-instructions">
                        <div className="col-md-12">
                            <p>
                                Select the durations for the generated D1 and D2 files. By default, this range is set to
                                the submission date range you selected in step one.
                            </p>
                        </div>
                    </div>

                    <div className="usa-da-generate-content">
                        <RadioSection
                            onChange={this.props.updateFileProperty}
                            active={this.props.d1.agencyType}
                            label="Generate File D1 from records where my agency is the:"
                            fileType="d1"
                            sectionType="agencyType" />
                        <RadioSection
                            onChange={this.props.updateFileProperty}
                            active={this.props.d1.fileFormat}
                            label="Determine the file format for your File D1 generation:"
                            fileType="d1"
                            sectionType="fileFormat" />
                        <GenerateFileBox
                            label="File D1: Procurement Awards (FPDS data)"
                            datePlaceholder="Action"
                            startingTab={1}
                            value={d1}
                            error={d1.error}
                            showDownload={d1.showDownload}
                            onDateChange={this.handleDateChange.bind(this, "d1")}
                            updateError={this.updateError.bind(this, "d1")}
                            clickedDownload={this.clickedDownload.bind(this, "D1")} />
                        <RadioSection
                            onChange={this.props.updateFileProperty}
                            active={this.props.d2.agencyType}
                            label="Generate File D2 from records where my agency is the:"
                            fileType="d2"
                            sectionType="agencyType" />
                        <RadioSection
                            onChange={this.props.updateFileProperty}
                            active={this.props.d2.fileFormat}
                            label="Determine the file format for your File D2 generation:"
                            fileType="d2"
                            sectionType="fileFormat" />
                        <GenerateFileBox
                            label="File D2: Financial Assistance"
                            datePlaceholder="Action"
                            startingTab={9}
                            value={d2}
                            error={d2.error}
                            showDownload={d2.showDownload}
                            onDateChange={this.handleDateChange.bind(this, "d2")}
                            updateError={this.updateError.bind(this, "d2")}
                            clickedDownload={this.clickedDownload.bind(this, "D2")} />
                    </div>
                </div>
                <GenerateFilesOverlay {...this.props} />
            </div>
        );
    }
}

GenerateFilesContent.propTypes = propTypes;
GenerateFilesContent.defaultProps = defaultProps;
