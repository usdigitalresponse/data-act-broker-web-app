/**
* GTASWarningBanner.jsx
* Created by Minahm Kim 07/07/17
**/

import React from 'react';
import * as Icons from '../SharedComponents/icons/Icons.jsx';
import * as ReviewHelper from '../../helpers/reviewHelper.js';

const defaultProps = {
    type: 'all'
};

export default class Banner extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            type: this.props.type,
            app_window: []
        };
    }

    componentDidMount() {
        this.isWindow();
    }

    componentWillReceiveProps(nextProps) {
        let type = null;
        if (this.state.type !== nextProps.type) {
            type = nextProps.type;
        }
        if (type && type !== this.state.type) {
            this.setState({
                'type': type
            });
            this.isWindow();
        }
    }

    getRows() {
        let msg = [];
        for (let i = 0; i < this.state.app_window.length; i++) {
            msg.push(
                <div key={'banner'+i} className="published-submission-warning-banner">
                    <div className='container'>
                        <div className='row'>
                            <div className="col-xs-1">
                                <i className="usa-da-icon"><Icons.ExclamationTriangle /> </i>
                            </div>
                            <div className="col-xs-11">
                                <p>{this.state.app_window[i].message}</p>
                            </div>
                        </div>
                    </div>
                </div>
                );
        }
        return msg;
    }

    isWindow() {
        ReviewHelper.isWindow()
            .then((res) => {
                if (!res.data) {
                    return;
                }
                let app_window = [];
                for (let i = 0; i < res.data.length; i++) {
                    if (res.data[i].type.toLowerCase() === this.state.type.toLowerCase() ||
                        res.data[i].type.toLowerCase() === 'all') {
                        app_window.push(res.data[i]);
                    }
                }
                if (app_window.length !== 0) {
                    this.setState({ app_window: app_window });
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }

    render() {
        let message = this.getRows();
        return (
            <div>
                {message}
            </div>
        );
    }
}

Banner.defaultProps = defaultProps;
