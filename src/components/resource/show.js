import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { intlShape, injectIntl, FormattedMessage } from 'react-intl';


import {
  Accordion,
  Button,
  IconButton,
  Icon,
  KeyValue,
  Modal,
  ModalFooter
} from '@folio/stripes-components';

import DetailsView from '../details-view';
import Link from '../link';
import ExternalLink from '../external-link/external-link';
import IdentifiersList from '../identifiers-list';
import ContributorsList from '..//contributors-list';
import CoverageDateList from '../coverage-date-list';
import { isBookPublicationType, isValidCoverageList, processErrors } from '../utilities';
import Toaster from '../toaster';

class ResourceShow extends Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    toggleSelected: PropTypes.func.isRequired,
    intl: intlShape.isRequired // eslint-disable-line react/no-unused-prop-types
  };

  static contextTypes = {
    router: PropTypes.object
  };

  state = {
    showSelectionModal: false,
    resourceSelected: this.props.model.isSelected
  };

  static getDerivedStateFromProps({ model }, prevState) {
    return !model.isSaving ?
      { ...prevState, resourceSelected: model.isSelected } :
      prevState;
  }

  handleHoldingStatus = () => {
    if (this.props.model.isSelected) {
      this.setState({ showSelectionModal: true });
    } else {
      this.props.toggleSelected();
    }
  };

  commitSelectionToggle = () => {
    this.setState({
      showSelectionModal: false,
      resourceSelected: false
    });
    this.props.toggleSelected();
  };

  cancelSelectionToggle = () => {
    this.setState({
      showSelectionModal: false,
      resourceSelected: this.props.model.isSelected
    });
  };

  render() {
    let { model, intl } = this.props;
    let { router } = this.context;
    let {
      showSelectionModal,
      resourceSelected
    } = this.state;

    let isSelectInFlight = model.update.isPending && 'isSelected' in model.update.changedAttributes;
    let visibilityMessage = model.package.visibilityData.isHidden
      ? '(All titles in this package are hidden)'
      : model.visibilityData.reason && `(${model.visibilityData.reason})`;

    let hasManagedCoverages = model.managedCoverages.length > 0 &&
      isValidCoverageList(model.managedCoverages);
    let hasManagedEmbargoPeriod = model.managedEmbargoPeriod &&
      model.managedEmbargoPeriod.embargoUnit &&
      model.managedEmbargoPeriod.embargoValue;
    let customEmbargoValue = model.customEmbargoPeriod && model.customEmbargoPeriod.embargoValue;
    let customEmbargoUnit = model.customEmbargoPeriod && model.customEmbargoPeriod.embargoUnit;
    let hasCustomEmbargoPeriod = model.customEmbargoPeriod &&
      model.customEmbargoPeriod.embargoUnit &&
      model.customEmbargoPeriod.embargoValue;
    let hasCustomCoverages = model.customCoverages.length > 0 &&
    isValidCoverageList(model.customCoverages);

    let actionMenuItems = [
      {
        label: <FormattedMessage id="ui-eholdings.actionMenu.edit" />,
        to: {
          pathname: `/eholdings/resources/${model.id}/edit`,
          state: { eholdings: true }
        }
      }
    ];

    let toasts = processErrors(model);

    // if coming from updating any value on managed title in a managed package
    // show a success toast
    if (router.history.action === 'PUSH' &&
        router.history.location.state &&
        router.history.location.state.isFreshlySaved) {
      toasts.push({
        id: `success-package-creation-${model.id}`,
        message: <FormattedMessage id="ui-eholdings.resource.toast.isFreshlySaved" />,
        type: 'success'
      });
    }

    if (resourceSelected === true) {
      actionMenuItems.push({
        'label': <FormattedMessage id="ui-eholdings.resource.actionMenu.removeHolding" />,
        'state': { eholdings: true },
        'onClick': this.handleHoldingStatus,
        'data-test-eholdings-remove-resource-from-holdings': true
      });
    } else if (resourceSelected === false) {
      actionMenuItems.push({
        'label': <FormattedMessage id="ui-eholdings.resource.actionMenu.addHolding" />,
        'state': { eholdings: true },
        'onClick': this.handleHoldingStatus,
        'data-test-eholdings-add-resource-to-holdings': true
      });
    }

    return (
      <div>
        <Toaster toasts={toasts} position="bottom" />

        <DetailsView
          type="resource"
          model={model}
          paneTitle={model.title.name}
          paneSub={model.package.name}
          actionMenuItems={actionMenuItems}
          lastMenu={(
            <IconButton
              data-test-eholdings-resource-edit-link
              icon="edit"
              ariaLabel={`Edit ${model.title.name}`}
              to={{
                pathname: `/eholdings/resources/${model.id}/edit`,
                state: { eholdings: true }
              }}
            />
          )}
          bodyContent={(
            <div>
              <Accordion label={<FormattedMessage id="ui-eholdings.label.holdingStatus" />}>
                <label
                  data-test-eholdings-resource-show-selected
                  htmlFor="resource-show-toggle-switch"
                >
                  {
                    model.update.isPending ? (
                      <Icon icon='spinner-ellipsis' />
                    ) : (
                      <h4>{resourceSelected ?
                        (<FormattedMessage id="ui-eholdings.selected" />)
                          :
                        (<FormattedMessage id="ui-eholdings.notSelected" />)}
                      </h4>
                    )
                  }
                  <br />
                  { ((!resourceSelected && !isSelectInFlight) || (!this.props.model.isSelected && isSelectInFlight)) && (
                    <Button
                      buttonStyle="primary"
                      onClick={this.handleHoldingStatus}
                      disabled={model.destroy.isPending || isSelectInFlight}
                      data-test-eholdings-resource-add-to-holdings-button
                    >
                      <FormattedMessage id="ui-eholdings.addToHoldings" />
                    </Button>)}
                </label>
              </Accordion>

              <Accordion label={<FormattedMessage id="ui-eholdings.resource.resourceInformation" />}>
                <KeyValue label={<FormattedMessage id="ui-eholdings.label.title" />}>
                  <Link to={`/eholdings/titles/${model.titleId}`}>
                    {model.title.name}
                  </Link>
                </KeyValue>

                {model.title.edition && (
                  <KeyValue label={<FormattedMessage id="ui-eholdings.label.edition" />}>
                    <div data-test-eholdings-resource-show-edition>
                      {model.title.edition}
                    </div>
                  </KeyValue>
                )}

                <ContributorsList data={model.title.contributors} />

                {model.title.publisherName && (
                  <KeyValue label={<FormattedMessage id="ui-eholdings.label.publisher" />}>
                    <div data-test-eholdings-resource-show-publisher-name>
                      {model.title.publisherName}
                    </div>
                  </KeyValue>
                )}

                {model.title.publicationType && (
                  <KeyValue label={<FormattedMessage id="ui-eholdings.label.publicationType" />}>
                    <div data-test-eholdings-resource-show-publication-type>
                      {model.title.publicationType}
                    </div>
                  </KeyValue>
                )}

                <IdentifiersList data={model.title.identifiers} />

                {model.title.subjects.length > 0 && (
                  <KeyValue label={<FormattedMessage id="ui-eholdings.label.subjects" />}>
                    <div data-test-eholdings-resource-show-subjects-list>
                      {model.title.subjects.map(subjectObj => subjectObj.subject).join('; ')}
                    </div>
                  </KeyValue>
                )}

                <KeyValue label={<FormattedMessage id="ui-eholdings.label.peerReviewed" />}>
                  <div data-test-eholdings-peer-reviewed-field>
                    {model.title.isPeerReviewed ? 'Yes' : 'No'}
                  </div>
                </KeyValue>

                <KeyValue label={<FormattedMessage id="ui-eholdings.label.titleType" />}>
                  <div data-test-eholdings-package-details-type>
                    {model.title.isTitleCustom ? 'Custom' : 'Managed'}
                  </div>
                </KeyValue>

                {model.title.description && (
                  <KeyValue label={<FormattedMessage id="ui-eholdings.label.description" />}>
                    <div data-test-eholdings-description-field>
                      {model.title.description}
                    </div>
                  </KeyValue>
                )}

                <KeyValue label={<FormattedMessage id="ui-eholdings.label.package" />}>
                  <div data-test-eholdings-resource-show-package-name>
                    <Link to={`/eholdings/packages/${model.packageId}`}>{model.package.name}</Link>
                  </div>
                </KeyValue>

                <KeyValue label={<FormattedMessage id="ui-eholdings.label.provider" />}>
                  <div data-test-eholdings-resource-show-provider-name>
                    <Link to={`/eholdings/providers/${model.providerId}`}>{model.package.providerName}</Link>
                  </div>
                </KeyValue>

                {model.package.contentType && (
                  <KeyValue label="Package content type">
                    <div data-test-eholdings-resource-show-content-type>
                      {model.package.contentType}
                    </div>
                  </KeyValue>
                )}
              </Accordion>

              <Accordion label={<FormattedMessage id="ui-eholdings.resource.resourceSettings" />}>
                <KeyValue label={<FormattedMessage id="ui-eholdings.label.showToPatrons" />}>
                  <div data-test-eholdings-resource-show-visibility>
                    {model.visibilityData.isHidden || !resourceSelected
                      ? `No ${visibilityMessage}`
                      : 'Yes'}
                  </div>
                </KeyValue>

                {model.url && (
                  <KeyValue label={`${model.title.isTitleCustom ? (<FormattedMessage id="ui-eholdings.custom" />) : (<FormattedMessage id="ui-eholdings.managed" />)} URL`}>
                    <div data-test-eholdings-resource-show-url>
                      <ExternalLink
                        href={model.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    </div>
                  </KeyValue>
                )}
              </Accordion>

              <Accordion
                label={<FormattedMessage id="ui-eholdings.label.coverageSettings" />}
                closedByDefault={!resourceSelected}
              >
                {(resourceSelected && !isSelectInFlight) ? (
                  <Fragment>
                    <h4>Coverage dates</h4>
                    {!hasManagedCoverages && !hasCustomCoverages && (
                      <p data-test-eholdings-resource-no-coverage-date-label>
                        <FormattedMessage id="ui-eholdings.resource.coverageDates.notSet" />
                      </p>
                    )}

                    {hasManagedCoverages && (
                      <KeyValue label={<FormattedMessage id="ui-eholdings.label.managed.coverageDates" />}>
                        <div data-test-eholdings-resource-show-managed-coverage-list>
                          <CoverageDateList
                            coverageArray={model.managedCoverages}
                            isYearOnly={isBookPublicationType(model.publicationType)}
                          />
                        </div>
                      </KeyValue>
                    )}

                    {(resourceSelected && !isSelectInFlight) && (
                    <div>
                      {hasCustomCoverages && (
                      <KeyValue label={<FormattedMessage id="ui-eholdings.label.custom.coverageDates" />}>
                        <span data-test-eholdings-resource-show-custom-coverage-list>
                          <CoverageDateList
                            coverageArray={model.customCoverages}
                            isYearOnly={isBookPublicationType(model.publicationType)}
                          />
                        </span>
                      </KeyValue>
                      )}
                    </div>)}

                    <h4><FormattedMessage id="ui-eholdings.label.coverageStatement" /></h4>
                    <div>
                      {model.coverageStatement ? (
                        <span data-test-eholdings-resource-coverage-statement-display>
                          {model.coverageStatement}
                        </span>
                     ) : (
                       <p data-test-eholdings-resource-no-coverage-label>
                         <FormattedMessage id="ui-eholdings.resource.coverageStatement.notSet" />
                       </p>
                     )}
                    </div>

                    <h4>Embargo period</h4>
                    {hasManagedEmbargoPeriod && (
                      <KeyValue label={<FormattedMessage id="ui-eholdings.label.managed.embargoPeriod" />}>
                        <div data-test-eholdings-resource-show-managed-embargo-period>
                          {model.managedEmbargoPeriod.embargoValue} {model.managedEmbargoPeriod.embargoUnit}
                        </div>
                      </KeyValue>
                    )}

                    {(resourceSelected && !isSelectInFlight) && (
                      <div>
                        {hasCustomEmbargoPeriod && (
                          <KeyValue label={<FormattedMessage id="ui-eholdings.custom" />}>
                            <span data-test-eholdings-resource-custom-embargo-display>
                              {customEmbargoValue} {customEmbargoUnit}
                            </span>
                          </KeyValue>
                       )}
                      </div>
                     )}

                    {!hasManagedEmbargoPeriod && !hasCustomEmbargoPeriod && (
                    <p data-test-eholdings-resource-no-embargo-label>
                      <FormattedMessage id="ui-eholdings.resource.embargoPeriod.notSet" />
                    </p>
                    )}
                  </Fragment>
                ) : (
                  <p data-test-eholdings-resource-not-selected-coverage-message>Add the resource to holdings to customize coverage.</p>
                )}
              </Accordion>
            </div>
          )}
        />

        <Modal
          open={showSelectionModal}
          size="small"
          label={intl.formatMessage({ id: 'ui-eholdings.resource.show.modal.header' })}
          id="eholdings-resource-deselection-confirmation-modal"
          footer={(
            <ModalFooter
              primaryButton={{
                'label': <FormattedMessage id="ui-eholdings.resource.modal.buttonConfirm" />,
                'onClick': this.commitSelectionToggle,
                'data-test-eholdings-resource-deselection-confirmation-modal-yes': true
              }}
              secondaryButton={{
                'label': <FormattedMessage id="ui-eholdings.resource.modal.buttonCancel" />,
                'onClick': this.cancelSelectionToggle,
                'data-test-eholdings-resource-deselection-confirmation-modal-no': true
              }}
            />
          )}
        >
          {
            /*
               we use <= here to account for the case where a user
               selects and then immediately deselects the
               resource
            */
            (model.title.resources.length <= 1 && model.title.isTitleCustom) ? (
              <span data-test-eholdings-deselect-final-title-warning>
                <FormattedMessage id="ui-eholdings.resource.modal.body.isCustom.lastTitle" />
              </span>
            ) : (
              <span data-test-eholdings-deselect-title-warning>
                <FormattedMessage id="ui-eholdings.resource.show.modal.body" />
              </span>
            )
          }
        </Modal>
      </div>
    );
  }
}

export default injectIntl(ResourceShow);
