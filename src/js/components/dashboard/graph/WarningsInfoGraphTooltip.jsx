/**
 * WarningsInfoGraphTooltip.jsx
 * Created by Lizzie Salita 11/27/19
 */

import React from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { formatNumberWithPrecision } from 'helpers/moneyFormatter';

const propTypes = {
    data: PropTypes.object
};

export default class WarningsInfoGraphTooltip extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            windowWidth: 0,
            tooltipWidth: 0,
            xOffset: 0
        };
        this.measureDOM = throttle(this.measureDOM.bind(this), 50);
    }

    componentDidMount() {
        this.measureDOM();
        window.addEventListener('resize', this.measureDOM);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.measureDOM);
    }

    measureDOM() {
        // measure the window width
        const windowWidth = window.innerWidth;
        const tooltipWidth = this.div.offsetWidth;
        // measure where on the screen the tooltip's 0 x position is
        const xOffset = this.div.getBoundingClientRect().left;

        // save the measurements before updating the tooltip, this prevents layout thrashing
        this.setState({
            windowWidth,
            tooltipWidth,
            xOffset
        }, this.positionTooltip);
    }

    positionTooltip() {
        const position = this.props.data.position;
        // we need to wait for the tooltip to render before we can full position it due to its
        // dynamic width
        const tooltipWidth = this.state.tooltipWidth;
        // determine how far from the right edge of the window we are
        const distanceFromRight = this.state.windowWidth -
            (this.state.xOffset + position.x + tooltipWidth);

        // determine the tooltip direction
        let direction = 'left';
        // if we are less than 20px from the right edge, the arrow should point right (bc the
        // tooltip will be on the left of the bar)
        if (distanceFromRight <= 20) {
            direction = 'right';
        }

        // offset the tooltip position to account for its arrow/pointer
        let offset = 9 + 33;
        if (direction === 'right') {
            offset = -9 - tooltipWidth - 33;
        }

        this.div.style.transform =
            `translate(${position.x + offset}px,${position.y}px)`;
        this.div.className = `tooltip ${direction} warnings-info-graph__tooltip`;
        this.pointerDiv.className = `tooltip-pointer ${direction}`;
    }

    render() {
        const data = this.props.data;
        return (
            <div
                className="tooltip warnings-info-graph__tooltip"
                ref={(div) => {
                    this.div = div;
                }}>
                <div
                    className="tooltip-pointer"
                    ref={(div) => {
                        this.pointerDiv = div;
                    }} />
                <div className="tooltip__title">
                    {data.description}
                </div>
                <hr />
                <div className="tooltip__body">
                    <table>
                        <tbody>
                            <tr>
                                <th>Time Period</th>
                                <td>{data.xValue}</td>
                            </tr>
                            <tr>
                                <th># of Rule Instances</th>
                                <td>{formatNumberWithPrecision(data.value, 0)}</td>
                            </tr>
                            <tr>
                                <th>Total # of Warnings</th>
                                <td>{formatNumberWithPrecision(data.totalWarnings, 0)}</td>
                            </tr>
                            <tr>
                                <th>% of all Warnings</th>
                                <td>{data.percent}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

WarningsInfoGraphTooltip.propTypes = propTypes;
