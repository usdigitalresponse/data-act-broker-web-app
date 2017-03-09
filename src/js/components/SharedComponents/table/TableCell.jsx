/**
 * TableCell.jsx
 * Created by Kyle Fox 2/19/16
 */

import React, { PropTypes } from 'react';

const propTypes = {
    data: PropTypes.node
};

const defaultProps = {
	cellClass: '',
	data: '',
	colSpan: '1'
};

export default class TableCell extends React.Component {
    render() {
        return (
            <td colSpan={this.props.colspan} className={this.props.cellClass}>{this.props.data}</td>
        );
    }
}

TableCell.propTypes = propTypes;
TableCell.defaultProps = defaultProps;