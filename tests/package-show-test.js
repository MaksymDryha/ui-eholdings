/* global describe, beforeEach */
import { expect } from 'chai';
import it from './it-will';

import { describeApplication } from './helpers';
import PackageShowPage from './pages/package-show';

describeApplication('PackageShow', () => {
  let provider,
    providerPackage,
    customerResources;

  beforeEach(function () {
    provider = this.server.create('provider', {
      name: 'Cool Provider'
    });

    providerPackage = this.server.create('package', 'withTitles', {
      provider,
      name: 'Cool Package',
      contentType: 'E-Book',
      isSelected: false,
      titleCount: 5
    });

    customerResources = this.server.schema.where('customer-resource', { packageId: providerPackage.id }).models;
  });

  describe('visiting the package details page', () => {
    beforeEach(function () {
      return this.visit(`/eholdings/packages/${providerPackage.id}`, () => {
        expect(PackageShowPage.$root).to.exist;
      });
    });

    it('displays the package name', () => {
      expect(PackageShowPage.name).to.equal('Cool Package');
    });

    it('displays whether or not the package is selected', () => {
      expect(PackageShowPage.isSelected).to.equal(false);
    });

    it('displays the content type', () => {
      expect(PackageShowPage.contentType).to.equal('E-Book');
    });

    it('displays the total number of titles', () => {
      expect(PackageShowPage.numTitles).to.equal('5');
    });

    it('displays the number of selected titles', () => {
      expect(PackageShowPage.numTitlesSelected).to.equal(`${providerPackage.selectedCount}`);
    });

    it('displays a list of titles', () => {
      expect(PackageShowPage.titleList).to.have.lengthOf(5);
    });

    it('displays name of a title in the title list', () => {
      expect(PackageShowPage.titleList[0].name).to.equal(customerResources[0].title.name);
    });

    it('displays whether the first title is selected', () => {
      expect(PackageShowPage.titleList[0].isSelected).to.equal(customerResources[0].isSelected);
    });

    it.still('should not display a back button', () => {
      expect(PackageShowPage.$backButton).to.not.exist;
    });
  });

  describe('visiting the package details page for a large package', () => {
    beforeEach(function () {
      providerPackage.selectedCount = 9000;
      providerPackage.titleCount = 10000;

      return this.visit(`/eholdings/packages/${providerPackage.id}`, () => {
        expect(PackageShowPage.$root).to.exist;
      });
    });

    describe('viewing large packages', () => {
      it('correctly formats the number for selected title count', () => {
        expect(PackageShowPage.numTitlesSelected).to.equal('9,000');
      });

      it('correctly formats the number for total title count', () => {
        expect(PackageShowPage.numTitles).to.equal('10,000');
      });
    });
  });

  describe('navigating to package show page', () => {
    beforeEach(function () {
      return this.visit({
        pathname: `/eholdings/packages/${providerPackage.id}`,
        // our internal link component automatically sets the location state
        state: { eholdings: true }
      }, () => {
        expect(PackageShowPage.$root).to.exist;
      });
    });

    it('should display the back button in UI', () => {
      expect(PackageShowPage.$backButton).to.exist;
    });
  });


  describe('encountering a server error', () => {
    beforeEach(function () {
      this.server.get('/packages/:packageId', {
        errors: [{
          title: 'There was an error'
        }]
      }, 500);

      return this.visit(`/eholdings/packages/${providerPackage.id}`, () => {
        expect(PackageShowPage.$root).to.exist;
      });
    });

    it('dies with dignity', () => {
      expect(PackageShowPage.hasErrors).to.be.true;
    });
  });
});
