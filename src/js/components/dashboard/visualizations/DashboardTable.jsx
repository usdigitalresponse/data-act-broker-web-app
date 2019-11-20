/**
 * DashboardTable.jsx
 * Created by Alisa Burdeyny 11/13/19
 */

import React from 'react';
import PropTypes from 'prop-types';
import { uniqueId } from 'lodash';

import DashboardTableHeader from 'components/dashboard/visualizations/DashboardTableHeader';

const propTypes = {
    results: PropTypes.array,
    inFlight: PropTypes.bool
};

const defaultProps = {
    results: [],
    inFlight: false
};

const tableHeaders = [
    {
        text: 'File',
        class: 'dashboard-table__file-column'
    },
    {
        text: 'Fiscal Year/ Quarter',
        class: 'dashboard-table__fyq-column'
    },
    {
        text: 'Warning Rule',
        class: 'dashboard-table__label-column'
    },
    {
        text: 'Number of Instances',
        class: 'dashboard-table__instances-column'
    },
    {
        text: 'Rule Description',
        class: null
    }
];

export default class DashboardTable extends React.Component {
    render() {
        const tableRows = this.props.results.map((row) => (
            <tr key={`dashboard-table-row-cell-${uniqueId()}`}>
                <td>
                    {row.fileLabel}
                </td>
                <td>
                    {row.period}
                </td>
                <td>
                    {row.rule_label}
                </td>
                <td>
                    {row.instance_count}
                </td>
                <td>
                    <div className="ellipse-box">
                        {row.rule_description}
                    </div>
                </td>
            </tr>
        ));

        let contentMessage = null;
        if (this.props.inFlight) {
            contentMessage = 'Gathering data';
        }
        else if (this.props.results.length === 0) {
            contentMessage = 'No data';
        }
        return (
            <div className="dashboard-table">
                <h3 className="dashboard-viz__heading">Table</h3>
                <table>
                    <DashboardTableHeader headers={tableHeaders} />
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
                {contentMessage}
            </div>
        );
    }
}

DashboardTable.defaultProps = defaultProps;
DashboardTable.propTypes = propTypes;
