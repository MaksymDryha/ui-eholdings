import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';

import { createResolver } from '../redux';
import Package from '../redux/package';
import CustomerResource from '../redux/customer-resource';

import View from '../components/package-show';

class PackageShowRoute extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        packageId: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,
    model: PropTypes.object.isRequired,
    getPackage: PropTypes.func.isRequired,
    getPackageTitles: PropTypes.func.isRequired,
    unloadCustomerResources: PropTypes.func.isRequired,
    updatePackage: PropTypes.func.isRequired
  };

  componentWillMount() {
    let { packageId } = this.props.match.params;
    this.props.getPackage(packageId);
  }

  componentWillReceiveProps(nextProps) {
    let { model: next, match, getPackage, unloadCustomerResources } = nextProps;
    let { model: old, match: oldMatch } = this.props;
    let { packageId } = match.params;

    if (packageId !== oldMatch.params.packageId) {
      getPackage(packageId);

    // if an update just resolved, unfetch the package titles
    } else if (next.update.isResolved && old.update.isPending) {
      unloadCustomerResources(next.customerResources);
    }
  }

  toggleSelected = () => {
    let { model, updatePackage } = this.props;
    model.isSelected = !model.isSelected;
    model.selectedCount = model.isSelected ? model.titleCount : 0;

    // If package is selected, allowKbToAddTitles should be true
    if (model.isSelected) {
      model.allowKbToAddTitles = true;
    }
    // clear out any customizations before sending to server
    if (!model.isSelected) {
      model.visibilityData.isHidden = false;
      model.customCoverage = {};
      model.allowKbToAddTitles = false;
    }

    updatePackage(model);
  };

  toggleHidden = () => {
    let { model, updatePackage } = this.props;
    model.visibilityData.isHidden = !model.visibilityData.isHidden;
    updatePackage(model);
  };

  fetchPackageTitles = (page) => {
    let { match, getPackageTitles } = this.props;
    let { packageId } = match.params;

    getPackageTitles(packageId, { page });
  };

  customCoverageSubmitted = (values) => {
    let { model, updatePackage } = this.props;
    model.customCoverage.beginCoverage = !values.beginCoverage ? null : moment(values.beginCoverage).format('YYYY-MM-DD');
    model.customCoverage.endCoverage = !values.endCoverage ? null : moment(values.endCoverage).format('YYYY-MM-DD');
    updatePackage(model);
  };

  toggleAllowKbToAddTitles = () => {
    let { model, updatePackage } = this.props;
    model.allowKbToAddTitles = !model.allowKbToAddTitles;
    updatePackage(model);
  };

  render() {
    return (
      <View
        model={this.props.model}
        fetchPackageTitles={this.fetchPackageTitles}
        toggleSelected={this.toggleSelected}
        toggleHidden={this.toggleHidden}
        customCoverageSubmitted={this.customCoverageSubmitted}
        toggleAllowKbToAddTitles={this.toggleAllowKbToAddTitles}
      />
    );
  }
}

export default connect(
  ({ eholdings: { data } }, { match }) => ({
    model: createResolver(data).find('packages', match.params.packageId)
  }), {
    getPackage: id => Package.find(id),
    getPackageTitles: (id, params) => Package.queryRelated(id, 'customerResources', params),
    unloadCustomerResources: collection => CustomerResource.unload(collection),
    updatePackage: model => Package.save(model)
  }
)(PackageShowRoute);
