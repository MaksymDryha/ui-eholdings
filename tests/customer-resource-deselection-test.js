/* global describe, beforeEach, afterEach */
import { expect } from 'chai';
import it from './it-will';

import { describeApplication } from './helpers';
import ResourcePage from './pages/customer-resource-show';

describeApplication('CustomerResourceShow Deselection', () => {
  let vendor,
    title,
    vendorPackage,
    resource;

  beforeEach(function () {
    vendor = this.server.create('vendor', {
      name: 'Cool Vendor'
    });

    title = this.server.create('title', {
      publicationType: 'Streaming Video'
    });

    vendorPackage = this.server.create('package', {
      vendor,
      name: 'Cool Package',
      contentType: 'E-Book',
      titleCount: 1,
      selectedCount: 1
    });

    resource = this.server.create('customer-resource', {
      package: vendorPackage,
      isSelected: true,
      title
    });
  });

  describe('visiting the customer resource page', () => {
    describe('part of a package with only one selected title', () => {
      beforeEach(function () {
        return this.visit(`/eholdings/customer-resources/${resource.id}`, () => {
          expect(ResourcePage.$root).to.exist;
        });
      });

      it('indicates that the resource is selected', () => {
        expect(ResourcePage.isSelected).to.equal(true);
      });

      describe('deselecting', () => {
        beforeEach(() => {
          ResourcePage.toggleIsSelected();
        });

        it('warns the user they are deselecting the final title in the package', () => {
          expect(ResourcePage.$deselectFinalTitleWarning).to.exist;
        });
      });
    });

    describe('part of a package with several selected titles', () => {
      beforeEach(function () {
        vendorPackage.titleCount = 5;
        vendorPackage.selectedCount = 2;

        return this.visit(`/eholdings/customer-resources/${resource.id}`, () => {
          expect(ResourcePage.$root).to.exist;
        });
      });

      it('indicates that the resource is selected', () => {
        expect(ResourcePage.isSelected).to.equal(true);
      });

      describe('deselecting', () => {
        beforeEach(() => {
          return ResourcePage.toggleIsSelected();
        });

        it('warns the user they are deselecting', () => {
          expect(ResourcePage.$deselectTitleWarning).to.exist;
        });

        it('reflects the desired state (not selected)', () => {
          expect(ResourcePage.isSelected).to.equal(false);
        });

        describe('canceling the deselection', () => {
          beforeEach(() => {
            return ResourcePage.cancelDeselection();
          });

          it('reverts back to the selected state', () => {
            expect(ResourcePage.isSelected).to.equal(true);
          });
        });

        describe('confirming the deselection', () => {
          beforeEach(function () {
            this.server.timing = 50;
            ResourcePage.confirmDeselection();
          });

          afterEach(function () {
            this.server.timing = 0;
          });

          it('reflects the desired state (not selected)', () => {
            expect(ResourcePage.isSelected).to.equal(false);
          });

          it('indicates it is working to get to desired state', () => {
            expect(ResourcePage.isSelecting).to.equal(true);
          });

          it('cannot be interacted with while the request is in flight', () => {
            expect(ResourcePage.isSelectedToggleable).to.equal(false);
          });

          describe('when the request succeeds', () => {
            it('reflects the desired state was set', () => {
              expect(ResourcePage.isSelected).to.equal(false);
            });

            it('indicates it is no longer working', () => {
              expect(ResourcePage.isSelecting).to.equal(false);
            });
          });
        });
      });
    });
  });
});