import $ from 'jquery';

export default {
  get $root() {
    return $('[data-test-eholdings-title-show]');
  },

  get titleName() {
    return $('[data-test-eholdings-title-show-title-name]').text();
  },

  get publisherName() {
    return $('[data-test-eholdings-title-show-publisher-name]').text();
  },

  get hasErrors() {
    return $('[data-test-eholdings-title-show-error]').length > 0;
  },

  get packageList() {
    return $('[data-test-eholdings-title-show-package]').toArray().map(createPackageObject);
  }
};

function createPackageObject(element) {
  let $scope = $(element);

  return {
    get name() {
      return $scope.find('[data-test-eholdings-title-show-package-name]').text();
    },

    get isSelected() {
      return $scope.find('[data-test-eholdings-title-show-package-selected]').text() === 'Selected';
    }
  };
}