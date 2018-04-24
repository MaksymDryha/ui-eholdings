import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { reduxForm } from 'redux-form';
import isEqual from 'lodash/isEqual';

import {
  Button,
  Icon
} from '@folio/stripes-components';

import DetailsView from '../../details-view';
import NameField, { validate as validateName } from '../_fields/name';
import PublisherNameField, { validate as validatePublisher } from '../_fields/publisher-name';
import PublicationTypeField from '../_fields/publication-type';
import DescriptionField, { validate as validateDescription } from '../_fields/description';
import PeerReviewedField from '../_fields/peer-reviewed';
import DetailsViewSection from '../../details-view-section';
import NavigationModal from '../../navigation-modal';
import Toaster from '../../toaster';
import styles from './title-edit.css';

class TitleEdit extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    initialValues: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool,
    updateRequest: PropTypes.object.isRequired
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  };

  componentWillReceiveProps(nextProps) {
    let wasPending = this.props.model.update.isPending && !nextProps.model.update.isPending;
    let needsUpdate = !isEqual(this.props.initialValues, nextProps.initialValues);

    if (wasPending && needsUpdate) {
      this.context.router.history.push(
        `/eholdings/titles/${this.props.model.id}`,
        { eholdings: true }
      );
    }
  }

  handleCancel = () => {
    this.context.router.history.push(
      `/eholdings/titles/${this.props.model.id}`,
      { eholdings: true }
    );
  }

  render() {
    let {
      model,
      handleSubmit,
      onSubmit,
      pristine,
      updateRequest
    } = this.props;

    let actionMenuItems = [
      {
        label: 'Cancel editing',
        to: {
          pathname: `/eholdings/titles/${model.id}`,
          state: { eholdings: true }
        }
      }
    ];

    return (
      <div>
        <Toaster
          position="bottom"
          toasts={updateRequest.errors.map(({ title }, index) => ({
            id: `error-${updateRequest.timestamp}-${index}`,
            message: title,
            type: 'error'
          }))}
        />

        <DetailsView
          type="title"
          model={model}
          paneTitle={model.name}
          actionMenuItems={actionMenuItems}
          bodyContent={(
            <form onSubmit={handleSubmit(onSubmit)}>
              <DetailsViewSection
                label="Title information"
              >
                <NameField />
                <PublisherNameField />
                <PublicationTypeField />
                <DescriptionField />
                <PeerReviewedField />
              </DetailsViewSection>
              <div className={styles['title-edit-action-buttons']}>
                <div
                  data-test-eholdings-title-cancel-button
                >
                  <Button
                    disabled={updateRequest.isPending}
                    type="button"
                    onClick={this.handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
                <div
                  data-test-eholdings-title-save-button
                >
                  <Button
                    disabled={pristine || model.update.isPending}
                    type="submit"
                    buttonStyle="primary"
                  >
                    {model.update.isPending ? 'Saving' : 'Save'}
                  </Button>
                </div>
                {updateRequest.isPending && (
                  <Icon icon="spinner-ellipsis" />
                )}
              </div>
              <NavigationModal when={!pristine && !updateRequest.isResolved} />
            </form>
          )}
        />
      </div>
    );
  }
}

const validate = (values) => {
  return Object.assign({},
    validateName(values),
    validatePublisher(values),
    validateDescription(values));
};

export default reduxForm({
  validate,
  enableReinitialize: true,
  form: 'TitleEdit',
  destroyOnUnmount: false,
})(TitleEdit);
