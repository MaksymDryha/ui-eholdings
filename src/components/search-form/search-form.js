import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import Link from 'react-router-dom/Link';
import capitalize from 'lodash/capitalize';
import {
  Button,
  SearchField
} from '@folio/stripes/components';
import ProviderSearchFilters from '../provider-search-filters';
import PackageSearchFilters from '../package-search-filters';
import TitleSearchFilters from '../title-search-filters';

import styles from './search-form.css';

const validSearchTypes = ['providers', 'packages', 'titles'];

class SearchForm extends Component {
  static propTypes = {
    displaySearchButton: PropTypes.bool,
    displaySearchTypeSwitcher: PropTypes.bool,
    intl: intlShape.isRequired,
    isLoading: PropTypes.bool,
    onFilterChange: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    onSearchFieldChange: PropTypes.func,
    searchField: PropTypes.string,
    searchFilter: PropTypes.shape({
      filter: PropTypes.object,
      q: PropTypes.string,
      searchfield: PropTypes.string,
    }),
    searchString: PropTypes.string,
    searchType: PropTypes.oneOf(validSearchTypes).isRequired,
    searchTypeUrls: PropTypes.shape({
      packages: PropTypes.string.isRequired,
      providers: PropTypes.string.isRequired,
      titles: PropTypes.string.isRequired
    }),
    sort: PropTypes.string
  };

  static defaultProps = {
    displaySearchTypeSwitcher: true,
    displaySearchButton: true,
    searchString: '',
  };

  handleSearchSubmit = (e) => {
    e.preventDefault();
    this.props.onSearch();
  };

  handleChangeSearch = (e) => {
    this.props.onSearchChange(e.target.value);
  };

  handleClearSearch = () => {
    this.props.onSearchChange('');
  };

  handleUpdateFilter = (filter) => {
    let { sort, ...searchFilter } = filter;

    this.props.onFilterChange(sort, searchFilter);
  };

  handleChangeIndex = (e) => {
    this.props.onSearchFieldChange(e.target.value);
  };

  /**
   * Returns the component that is responsible for rendering filters
   * for the current searchType
   */
  getFiltersComponent = (searchType) => {
    if (searchType === 'titles') {
      return TitleSearchFilters;
    } else if (searchType === 'packages') {
      return PackageSearchFilters;
    } else if (searchType === 'providers') {
      return ProviderSearchFilters;
    }

    return null;
  };

  render() {
    let {
      searchType,
      searchTypeUrls,
      displaySearchTypeSwitcher,
      isLoading,
      displaySearchButton,
      searchField,
      searchFilter,
      searchString,
      sort,
      intl
    } = this.props;
    let Filters = this.getFiltersComponent(searchType);
    // sort is treated separately from the rest of the filters on submit,
    // but treated together when rendering the filters.
    let combinedFilters = { sort, ...searchFilter };

    const searchableIndexes = [
      { label: intl.formatMessage({ id: 'ui-eholdings.label.title' }), value: 'title' },
      { label: intl.formatMessage({ id: 'ui-eholdings.label.isxn' }), value: 'isxn' },
      { label: intl.formatMessage({ id: 'ui-eholdings.label.publisher' }), value: 'publisher' },
      { label: intl.formatMessage({ id: 'ui-eholdings.label.subject' }), value: 'subject' }
    ];

    return (
      <div className={styles['search-form-container']} data-test-search-form={searchType}>
        { displaySearchTypeSwitcher && (
          <div className={styles['search-switcher']} data-test-search-form-type-switcher>
            {validSearchTypes.map(type => (
              <Link
                key={type}
                title={intl.formatMessage({ id: 'ui-eholdings.search.searchLink' }, { type })}
                to={searchTypeUrls[type]}
                className={searchType === type ? styles['is-active'] : undefined}
                data-test-search-type-button={type}
              >
                {capitalize(type)}
              </Link>
            ))}
          </div>
        )}
        <form onSubmit={this.handleSearchSubmit}>
          {(searchType === 'titles') ? (
            <div data-test-title-search-field>
              <SearchField
                name="search"
                searchableIndexes={searchableIndexes}
                selectedIndex={searchField}
                onChangeIndex={this.handleChangeIndex}
                onChange={this.handleChangeSearch}
                onClear={this.handleClearSearch}
                value={searchString}
                placeholder={intl.formatMessage({ id: 'ui-eholdings.search.searchType' }, { searchType })}
                ariaLabel={intl.formatMessage({ id: 'ui-eholdings.search.searchType' }, { searchType })}
                loading={isLoading}
              />
            </div>
          ) : (
            <div data-test-search-field>
              <SearchField
                name="search"
                onChange={this.handleChangeSearch}
                onClear={this.handleClearSearch}
                value={searchString}
                placeholder={intl.formatMessage({ id: 'ui-eholdings.search.searchType' }, { searchType })}
                ariaLabel={intl.formatMessage({ id: 'ui-eholdings.search.searchType' }, { searchType })}
                loading={isLoading}
              />
            </div>
          )}
          { displaySearchButton && (
            <Button
              type="submit"
              buttonStyle="primary"
              fullWidth
              disabled={!searchString}
              data-test-search-submit
            >
              <FormattedMessage id="ui-eholdings.label.search" />
            </Button>
          )}
          {Filters && (
            <div>
              <hr />
              <Filters
                activeFilters={combinedFilters}
                onUpdate={this.handleUpdateFilter}
              />
            </div>
          )}
        </form>
      </div>
    );
  }
}
export default injectIntl(SearchForm);
