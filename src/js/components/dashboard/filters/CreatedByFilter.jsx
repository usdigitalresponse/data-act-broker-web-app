/**
 * CreatedByFilter.jsx
 * Created by Kwadwo Opoku-Debrah 8/25/18
 */

import React, { PropTypes } from 'react';

import CreatedByFilterContainer from '../../../containers/dashboard/CreatedByContainer';

const propTypes = {
  updateFilterList: PropTypes.func,
  type: PropTypes.string,
  table: PropTypes.string,
};

const defaultProps = {
  updateFilterList: null,
  type: '',
  table: '',
};

export default class CreatedByFilter extends React.Component {
  constructor(props) {
    super(props);

    this.createdBySelect = this.createdBySelect.bind(this);
  }

  createdBySelect(user, name) {
    if (user && name) {
      this.props.updateFilterList(
        'createdBy',
        {
          user: {
            name,
          },
        },
      );
    }
  }

  render() {
    return (
      <div className="dashboard-filters__filter dashboard-filters__filter_typeahead">
        <div className="typeahead-holder">
          <CreatedByFilterContainer
            type={this.props.type}
            table={this.props.table}
            placeholder="Created By"
            onSelect={this.createdBySelect}
          />
        </div>
      </div>
    );
  }
}

CreatedByFilter.propTypes = propTypes;
CreatedByFilter.defaultProps = defaultProps;
