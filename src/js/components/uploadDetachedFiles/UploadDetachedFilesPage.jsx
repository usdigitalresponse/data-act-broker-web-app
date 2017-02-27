/**
* UploadDetachedFilesPage.jsx
* Created by MichaelHess
**/

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import React from 'react';
import moment from 'moment';

import Navbar from '../SharedComponents/navigation/NavigationComponent.jsx';
import Footer from '../SharedComponents/FooterComponent.jsx';
import SubTierAgencyListContainer from '../../containers/SharedContainers/SubTierAgencyListContainer.jsx';
import ValidateValuesFileContainer from '../../containers/validateData/ValidateValuesFileContainer.jsx';
import ValidateDataFileContainer from '../../containers/validateData/ValidateDataFileContainer.jsx';
import UploadDetachedFilesBox from './UploadDetachedFilesBox.jsx';
import DateRangeWrapper from './DateRangeWrapper.jsx';
import UploadDetachedFileMeta from './uploadDetachedFileMeta.jsx';
import UploadDetachedFileValidation from './uploadDetachedFileValidation.jsx';

import * as Icons from '../SharedComponents/icons/Icons.jsx';

import * as UploadHelper from '../../helpers/uploadHelper.js';
import * as GenerateFilesHelper from '../../helpers/generateFilesHelper.js';
import * as ReviewHelper from '../../helpers/reviewHelper.js';
import { kGlobalConstants } from '../../GlobalConstants.js';

const timerDuration = 5;

export default class UploadDetachedFilesPage extends React.Component {
	constructor(props) {
		super(props);

		this.isUnmounted = false;
		

		this.state = {
			agency: "",
			agencyError: false,
			showMeta: true,
			showUploadFilesBox: false,
			showValidationBox: false,
			detachedAward: {
				startDate: null,
				endDate: null,
				error: {
					show: false,
					header: '',
					description: ''
				},
				valid: false,
				status: ""
			},
			jobResults: {detached_award: {}},
			notAllowed: false,
			errorMessage: "",
			headerErrors: false,
			validationFinished: false,
			error: 0,
			rep_start: '',
			rep_end: '',
			submit: true
		};
	}

	componentDidMount() {
		this.isUnmounted = false;
		if(this.props.params.submissionID){
			this.props.setSubmissionId(this.props.params.submissionID);
			this.checkFileStatus(this.props.params.submissionID);
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	checkFileStatus(submissionID) {
		// callback to check file status
		GenerateFilesHelper.fetchSubmissionMetadata(submissionID)
			.then((response) => {
				if (this.isUnmounted) {
					return;
				}
				var submission = true;
				if(response.publish_status=='published'){
					submission = false;
				}
				const job = Object.assign({}, this.state.jobResults);
				job.detached_award = response.jobs[0];
				this.setState({
					showMeta: false,
					jobResults: job,
					agency: response.agency_name,
					rep_start: response.reporting_period_start_date,
					rep_end: response.reporting_period_end_date,
					submit: submission
				}, () => {
					this.parseJobStates(response);
				});	
				console.log(this.state.showMeta)			
			})
			.catch((err)=>{
				if(err.status == 400){
					this.setState({error: 2, submit: false});
				}
			});
	}

	submitFabs(){
		UploadHelper.submitFabs({'submission_id': this.props.submission.id})
			.then((response)=>{
				this.setState({submit: false})
			})
			.catch((error)=>{
				if(error.httpStatus == 400){
					this.setState({error: 1, submit: false});
				}else if(error.httpStatus == 500){
					this.setState({error: 3, submit: false});
				}
			})
	}

	validate(){
		this.setState({
			showMeta: false
		})

	}

	// ERRORS
	// 1: Submission is already published
	// 2: Fetching file metadata failed
	// 3: File already has been submitted in another submission

	render() {
		let subTierAgencyIcon = <Icons.Building />;
		let subTierAgencyClass = '';
		let contentSize = 'col-lg-offset-2 col-lg-8 mt-60 mb-60';
		let agencyClass = 'select-agency-holder';
		let validationButton = null;
		let validationBox = null;
		let datePicker = null;
		let uploadFilesBox = null;
		let validationContent = 'hidden';
		let validationContentClass = '';
		let agency = this.state.agency;
		let startDate = this.state.rep_start;
		let endDate = this.state.rep_end;

		let headerDate = null;
		if(this.state.agency != '' && this.state.rep_start != '' && this.state.rep_end != ''){
			headerDate = <div className="col-md-2 ">
										<div className = 'header-box'>
												<span>
												Agency: {this.state.agency}
												</span>
												<br/>
												<span>
												Date: {startDate} - {endDate}
												</span>
											</div>
									</div>;
		}

		let header = <div className="usa-da-content-dark">
							<div className="container">
								<div className="row usa-da-page-title">
									<div className="col-md-10 mt-40 mb-20">
										<div className="display-2">
											Upload Bi-Monthly Financial Assistance Data
										</div>
									</div>
									{headerDate}
								</div>
							</div>
						</div>; 

		let title = <h5>Please begin by telling us about files you would like to upload</h5>;

		if (this.state.agencyError) {
			subTierAgencyIcon = <Icons.Building />;
			subTierAgencyClass = ' error usa-da-form-icon';
		}

		if (this.state.showDatePicker) {
			let value = {
				datePlaceholder: "Action",
				endDate: this.state.detachedAward.endDate, 
				label: "File D2: Financial Assistance",
				startDate: this.state.detachedAward.startDate
			}
			datePicker = <DateRangeWrapper {...this.state} 
								handleDateChange={this.handleDateChange.bind(this, "detachedAward")} 
								hideError={this.hideError.bind(this)} 
								showError={this.showError.bind(this)} 
								value={value}
								disabled={this.state.showValidationBox} />;
		}

		
		if (this.state.detachedAward.valid && this.state.showUploadFilesBox) {
			uploadFilesBox = <UploadDetachedFilesBox {...this.state} 
								hideError={this.hideError.bind(this)}
								showError={this.showError.bind(this)}
								submission={this.props.submission}  
								uploadFile={this.uploadFile.bind(this)} />;
		}

		if(this.state.showValidationBox) {
			uploadFilesBox = null;
			datePicker = null;
			subTierAgencyIcon = null;
			agencyClass = '';
			title = null;
			contentSize = 'hidden';
			validationContent = 'col-xs-12 mt-60 mb-60';
			validationContentClass = 'validation-holder'

			const type = {
				fileTitle: 'Upload',
				fileTemplateName: 'detached_award.csv',
				requestName: 'detached_award',
				progress: '0'
			}
			validationBox = <ValidateDataFileContainer type={type} data={this.state.jobResults}/>;
			if(!this.state.headerErrors && this.state.validationFinished) {
				validationBox = <ValidateValuesFileContainer type={type} data={this.state.jobResults} />;
				if(this.state.submit) {
					validationButton = <button className='pull-right col-xs-3 us-da-button' onClick={this.submitFabs.bind(this)}>Publish</button>;
				}
				else {
					validationButton = <button className='pull-right col-xs-3 us-da-disabled-button' onClick={this.submitFabs.bind(this)} disabled>File Already Published</button>;
				}
			}
		}

		let errorMessage = null;
		let errorText = null;
		let errorDesc = null;
		if (this.state.detachedAward.error.show || this.state.error != 0) {
			if(this.state.detachedAward.error.show){
				errorText = this.state.detachedAward.error.header;
				errorDesc = this.state.detachedAward.error.description;
			}else if(this.state.error == 1){
				errorText = 'This submission has already been published';
			}else if(this.state.error == 2){
				errorText = 'This file has already been submitted';
			}else if(this.state.error == 3){
				errorText = 'This file has already been submitted in another submission';
			}
			errorMessage = <div className="alert alert-error text-left" role="alert">
								<span className="usa-da-icon error-icon"><Icons.ExclamationCircle /></span>
								<div className="alert-header-text">{errorText}</div>
								<p>{errorDesc}</p>
							</div>;
		}

		let subtierAgency = null;

		let content = null;
		if(!this.state.showMeta){
			content = <UploadDetachedFileValidation submission={this.props.submission} setSubmissionId={this.props.setSubmissionId.bind(this)} ></UploadDetachedFileValidation>
		}else{
			content = <UploadDetachedFileMeta setSubmissionState={this.props.setSubmissionState} setSubmissionId={this.props.setSubmissionId.bind(this)} 
				history={this.props.history} submission={this.props.submission} validate={this.validate.bind(this)}></UploadDetachedFileMeta>;
		}

		return (
			<div className="usa-da-upload-detached-files-page">
				<div className="usa-da-site_wrap">
				{content}
				</div>
				<Footer />
			</div>
		);
		
		return (
			<div className="usa-da-upload-detached-files-page">
				<div className="usa-da-site_wrap">
					<div className="usa-da-page-content">
						<Navbar activeTab="submissionGuide" />
						{header}

						<div className="container center-block">
							<div className="row usa-da-select-agency">
								<div className={contentSize}>
									{title}
									<div className={agencyClass}>
										
										{subtierAgency}

										<ReactCSSTransitionGroup transitionName="usa-da-meta-fade" transitionEnterTimeout={600} transitionLeaveTimeout={200}>
											{datePicker}
										</ReactCSSTransitionGroup>

										<ReactCSSTransitionGroup transitionName="usa-da-meta-fade" transitionEnterTimeout={600} transitionLeaveTimeout={200}>
											{uploadFilesBox}
										</ReactCSSTransitionGroup>
										{errorMessage}
									</div>
								</div>
							</div>
							
						</div>
						<div className='container'>
						<div className = {validationContent}>
							<div className = {validationContentClass}>


								<ReactCSSTransitionGroup transitionName="usa-da-meta-fade" transitionEnterTimeout={600} transitionLeaveTimeout={200}>
									{validationBox}
								</ReactCSSTransitionGroup>

								<ReactCSSTransitionGroup transitionName="usa-da-meta-fade" transitionEnterTimeout={600} transitionLeaveTimeout={200}>
									{validationButton}
								</ReactCSSTransitionGroup>

								{errorMessage}
							</div>
						</div>
						</div>
					</div>
				</div>
				<Footer />
			</div>
		);
	}
}