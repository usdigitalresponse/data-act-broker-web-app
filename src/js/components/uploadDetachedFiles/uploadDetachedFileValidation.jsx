/**
* UploadDetachedFileValidation.jsx
* Created by Minahm Kim
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

import * as Icons from '../SharedComponents/icons/Icons.jsx';

import * as UploadHelper from '../../helpers/uploadHelper.js';
import * as GenerateFilesHelper from '../../helpers/generateFilesHelper.js';
import * as ReviewHelper from '../../helpers/reviewHelper.js';
import { kGlobalConstants } from '../../GlobalConstants.js';

const timerDuration = 5;

export default class UploadDetachedFileValidation extends React.Component {
	constructor(props) {
		super(props);

		this.isUnmounted = false;

		this.state = {
			agency: "",
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
			published: false,
			submit: true
		};

		this.checkFileStatus(this.props.submission.id);
	}

	componentDidMount() {
		this.isUnmounted = false;
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	showError(file, header, description) {
		// Show any error that occurs at any point during file upload
		const state = Object.assign({}, this.state[file], {
			error: {
				show: true,
				header: header,
				description: description
			}
		});
		
		this.setState({
			[file]: state
		});
	}

	hideError(file) {
		// Stop displaying the error for the given file
		const state = Object.assign({}, this.state[file], {
			error: {
				show: false,
				header: '',
				description: ''
			}
		});

		this.setState({
			[file]: state
		});
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
					jobResults: job,
					agency: response.agency_name,
					rep_start: response.reporting_period_start_date,
					rep_end: response.reporting_period_end_date,
					submit: submission
				}, () => {
					this.parseJobStates(response);
				});			
			})
			.catch((err)=>{
				if(err.status == 400){
					this.setState({error: 2, submit: false});
				}
			});
	}

	parseJobStates(data) {
		console.log(data);
		let runCheck = true;

		if (data.jobs[0].job_status == 'failed' || data.jobs[0].job_status == 'invalid') {
			// don't run the check again if it failed
			runCheck = false;

			let message = 'Error during D2 validation.';

			if (!data.jobs[0].error_data[0] && data.jobs[0].error_data[0].error_description != '') {
				message = data.jobs[0].error_data[0].error_description;
			}

			// make a clone of the file's react state
			const item = Object.assign({}, this.state.detachedAward);
			item.status = "failed";

			if(data.jobs[0].error_type == "header_errors") {
				this.setState({
					detachedAward: item,
					validationFinished: true,
					headerErrors: true
				});
			}
			else {
				ReviewHelper.validateDetachedSubmission(this.props.submission.id)
				.then((response) => {
					this.setState({
						detachedAward: item,
						validationFinished: true,
						headerErrors: false,
						jobResults: response
					});
				});
			}
		}
		else if (data.jobs[0].job_status == 'finished') {
			// don't run the check again if it's done
			runCheck = false;

			// display dowload buttons
			// make a clone of the file's react state
			const item = Object.assign({}, this.state.detachedAward);
			item.status = "done";

			ReviewHelper.validateDetachedSubmission(this.props.submission.id)
				.then((response) => {
					this.setState({
						detachedAward: item,
						validationFinished: true,
						headerErrors: false,
						jobResults: response,
						published: data.publish_status
					});
				});
		}

		if (this.isUnmounted) {
			return;
		}

		if (runCheck && !this.isUnmounted) {
			// wait 5 seconds and check the file status again
			window.setTimeout(() => {
				this.checkFileStatus(this.props.submission.id);
			}, timerDuration * 1000);
		}
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

	// ERRORS
	// 1: Submission is already published
	// 2: Fetching file metadata failed
	// 3: File already has been submitted in another submission

	render() {
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

		let header = null;
		if(headerDate){
			header = <div className="usa-da-content-dark">
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
		}

		validationContent = 'col-xs-12 mt-60 mb-60';
		validationContentClass = 'validation-holder'

		const type = {
			fileTitle: 'Upload',
			fileTemplateName: 'detached_award.csv',
			requestName: 'detached_award',
			progress: '0'
		}
		validationBox = <ValidateDataFileContainer type={type} data={this.state.jobResults}/>;
		console.log(this.state.jobResults)
		if(!this.state.headerErrors && this.state.validationFinished) {
			validationBox = <ValidateValuesFileContainer type={type} data={this.state.jobResults} />;
			if(this.state.jobResults.detached_award.error_type == "none" && this.state.error == 0) {
				validationButton = <button className='pull-right col-xs-3 us-da-button' onClick={this.submitFabs.bind(this)}>Publish</button>;
				if(this.state.published == 'published'){
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
		
		return (
			<div className="usa-da-upload-detached-files-page">
				<div className="usa-da-site_wrap">
					<div className="usa-da-page-content">
						<Navbar activeTab="submissionGuide" />
						{header}
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
			</div>
		);
	}
}