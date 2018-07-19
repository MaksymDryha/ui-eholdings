import React, { Component } from 'react';
import { Field, FieldArray } from 'redux-form';
import PropTypes from 'prop-types';
import moment from 'moment';
import { injectIntl, intlShape, FormattedDate } from 'react-intl';

import {
  Button,
  Datepicker,
  IconButton
} from '@folio/stripes-components';

import styles from './resource-coverage-fields.css';

class ResourceCoverageFields extends Component {
  static propTypes = {
    initialValue: PropTypes.array,
    intl: intlShape.isRequired
  };

  static defaultProps = {
    initialValue: []
  };

  renderCoverageFields = ({ fields }) => {
    let { initialValue, intl } = this.props;
    return (
      <div className={styles['coverage-fields']}>
        {fields.length === 0
          && initialValue.length > 0
          && initialValue[0].beginCoverage
          && (
          <p data-test-eholdings-coverage-fields-saving-will-remove>
            No date ranges set. Saving will remove custom coverage.
          </p>
        )}

        {fields.length > 0 && (
          <ul className={styles['coverage-fields-date-range-rows']}>
            {fields.map((dateRange, index) => (
              <li
                data-test-eholdings-coverage-fields-date-range-row
                key={index}
                className={styles['coverage-fields-date-range-row']}
              >
                <div
                  data-test-eholdings-coverage-fields-date-range-begin
                  className={styles['coverage-fields-datepicker']}
                >
                  <Field
                    name={`${dateRange}.beginCoverage`}
                    type="text"
                    component={Datepicker}
                    label="Start date"
                    id="begin-coverage"
                    format={(value) => (value ? intl.formatDate(value, { timeZone: 'UTC' }) : '')}
                  />
                </div>
                <div
                  data-test-eholdings-coverage-fields-date-range-end
                  className={styles['coverage-fields-datepicker']}
                >
                  <Field
                    name={`${dateRange}.endCoverage`}
                    type="text"
                    component={Datepicker}
                    label="End date"
                    id="end-coverage"
                    format={(value) => (value ? intl.formatDate(value, { timeZone: 'UTC' }) : '')}
                  />
                </div>

                <div
                  data-test-eholdings-coverage-fields-remove-row-button
                  className={styles['coverage-fields-date-range-clear-row']}
                >
                  <IconButton
                    icon="hollowX"
                    onClick={() => fields.remove(index)}
                    size="small"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div
          className={styles['coverage-fields-add-row-button']}
          data-test-eholdings-coverage-fields-add-row-button
        >
          <Button
            type="button"
            onClick={() => fields.push({})}
          >
            + Add date range
          </Button>
        </div>
      </div>
    );
  };

  render() {
    return (
      <FieldArray name="customCoverages" component={this.renderCoverageFields} />
    );
  }
}

export default injectIntl(ResourceCoverageFields);

/**
 * Validator to ensure start date comes before end date chronologically
 * @param {} dateRange - coverage date range to validate
 * @returns {} - an error object if errors are found, or `false` otherwise
 */
const validateStartDateBeforeEndDate = (dateRange) => {
  const message = 'Start date must be before end date';

  if (dateRange.endCoverage && moment(dateRange.beginCoverage).isAfter(moment(dateRange.endCoverage))) {
    return { beginCoverage: message };
  }

  return false;
};

/**
 * Validator to ensure begin date is present and entered dates are valid
 * @param {} dateRange - coverage date range to validate
 * @returns {} - an error object if errors are found, or `false` otherwise
 */
const validateDateFormat = (dateRange, locale) => {
  moment.locale(locale);
  let dateFormat = moment.localeData()._longDateFormat.L;
  const message = `Enter date in ${dateFormat} format.`;

  if (!dateRange.beginCoverage || !moment(dateRange.beginCoverage).isValid()) {
    return { beginCoverage: message };
  }

  return false;
};

/**
 * Validator to ensure all coverage ranges are within the parent package's
 * custom coverage range if one is present
 * @param {} dateRange - coverage date range to validate
 * @param {} packageCoverage - parent package's custom coverage range
 * @returns {} - an error object if errors are found, or `false` otherwise
 */
const validateWithinPackageRange = (dateRange, packageCoverage) => {
  // javascript/moment has no mechanism for "infinite", so we
  // use an absurd future date to represent the concept of "present"
  let present = moment('9999-09-09T05:00:00.000Z');
  if (packageCoverage && packageCoverage.beginCoverage) {
    let {
      beginCoverage: packageBeginCoverage,
      endCoverage: packageEndCoverage
    } = packageCoverage;

    let beginCoverageDate = moment(dateRange.beginCoverage);
    let endCoverageDate = dateRange.endCoverage ? moment(dateRange.endCoverage) : present;

    let packageBeginCoverageDate = moment(packageBeginCoverage);
    let packageEndCoverageDate = packageEndCoverage ? moment(packageEndCoverage) : moment();
    let packageRange = moment.range(packageBeginCoverageDate, packageEndCoverageDate);

    let startDate = (
      <FormattedDate
        value={packageBeginCoverageDate}
        timeZone="UTC"
        year="numeric"
        month="numeric"
        day="numeric"
      />
    );

    let endDate = packageEndCoverage ? (
      <FormattedDate
        value={packageEndCoverageDate}
        timeZone="UTC"
        year="numeric"
        month="numeric"
        day="numeric"
      />
    ) : 'Present';

    const message = (
      <span>
        Dates must be within package&apos;s date range ({startDate} - {endDate}).
      </span>
    );

    let beginDateOutOfRange = !packageRange.contains(beginCoverageDate);
    let endDateOutOfRange = !packageRange.contains(endCoverageDate);
    if (beginDateOutOfRange || endDateOutOfRange) {
      return {
        beginCoverage: beginDateOutOfRange ? message : false,
        endCoverage: endDateOutOfRange ? message : false
      };
    }
  }
  return false;
};


/**
 * Validator to check that no date ranges overlap or are identical
 * @param {} dateRange - coverage date range to validate
 * @param {} customCoverages - all custom coverage ranges present in edit form
 * @param {} index - index in the field array indicating which coverage range is
 * presently being considered
 * @returns {} - an error object if errors are found, or `false` otherwise
 */
const validateNoRangeOverlaps = (dateRange, customCoverages, index) => {
  let present = moment('9999-09-09T05:00:00.000Z');

  let beginCoverageDate = moment(dateRange.beginCoverage);
  let endCoverageDate = dateRange.endCoverage ? moment(dateRange.endCoverage) : present;
  let coverageRange = moment.range(beginCoverageDate, endCoverageDate);

  for (let overlapIndex = 0, len = customCoverages.length; overlapIndex < len; overlapIndex++) {
    let overlapRange = customCoverages[overlapIndex];

    // don't compare range to itself or to empty rows
    if (index === overlapIndex || !overlapRange.beginCoverage) {
      continue; // eslint-disable-line no-continue
    }

    let overlapCoverageBeginDate = moment(overlapRange.beginCoverage);
    let overlapCoverageEndDate = overlapRange.endCoverage ? moment(overlapRange.endCoverage) : present;
    let overlapCoverageRange = moment.range(overlapCoverageBeginDate, overlapCoverageEndDate);

    let startDate = (
      <FormattedDate
        value={overlapRange.beginCoverage}
        timeZone="UTC"
        year="numeric"
        month="numeric"
        day="numeric"
      />
    );

    let endDate = overlapRange.endCoverage ? (
      <FormattedDate
        value={overlapRange.endCoverage}
        timeZone="UTC"
        year="numeric"
        month="numeric"
        day="numeric"
      />
    ) : 'Present';

    const message = (
      <span>
        Date range overlaps with {startDate} - {endDate}.
      </span>
    );

    if (overlapCoverageRange.overlaps(coverageRange)
        || overlapCoverageRange.isEqual(coverageRange)
        || overlapCoverageRange.contains(coverageRange)) {
      // set endCoverage: true to make box red without message
      return { beginCoverage: message, endCoverage: true };
    }
  }

  return false;
};

export function validate(values, props) {
  let errors = [];
  let { intl, model } = props;

  let packageCoverage = model.package.customCoverage;

  values.customCoverages.forEach((dateRange, index) => {
    let dateRangeErrors = {};

    dateRangeErrors =
      validateDateFormat(dateRange, intl.locale) ||
      validateStartDateBeforeEndDate(dateRange) ||
      validateNoRangeOverlaps(dateRange, values.customCoverages, index) ||
      validateWithinPackageRange(dateRange, packageCoverage);

    errors[index] = dateRangeErrors;
  });

  return { customCoverages: errors };
}
