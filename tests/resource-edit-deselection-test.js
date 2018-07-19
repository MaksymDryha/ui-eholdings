import { beforeEach, describe, it } from '@bigtest/mocha';
import { expect } from 'chai';

import { describeApplication } from './helpers';
import ResourceShowPage from './pages/resource-show';
import ResourceEditPage from './pages/resource-edit';

describeApplication('ResourceEditDeselection', () => {
  let provider,
    title,
    providerPackage,
    resource;

  beforeEach(function () {
    provider = this.server.create('provider', {
      name: 'Neat Provider'
    });

    title = this.server.create('title', {
      publicationType: 'Streaming Video',
    });

    providerPackage = this.server.create('package', {
      provider,
      name: 'Awesome Package',
      contentType: 'EJournal',
      titleCount: 1,
      selectedCount: 1
    });

    resource = this.server.create('resource', {
      package: providerPackage,
      isSelected: true,
      title
    });
  });

  describe('visiting the resource page', () => {
    beforeEach(function () {
      return this.visit(`/eholdings/resources/${resource.id}/edit`, () => {
        expect(ResourceEditPage.$root).to.exist;
      });
    });

    it('indicates that the resource is selected', () => {
      expect(ResourceEditPage.isResourceSelected).to.equal('Selected');
    });

    describe('deselecting the resource', () => {
      beforeEach(() => {
        return ResourceShowPage
          .dropDown.clickDropDownButton()
          .dropDownMenu.clickRemoveFromHoldings();
      });


      it('should show a confirmation modal', () => {
        expect(ResourceEditPage.modal.isPresent).to.equal(true);
      });

      describe('confirming to continue deselection', () => {
        /**
         * We want to control when this endpoints resolves.
         * Returning a unresolved promise from the endpoint within
         * the beforeEach gives us the control to resolve the request
         * later in tests.
         */
        let resolveRequest;

        beforeEach(function () {
          this.server.put('/resources/:id', () => {
            return new Promise((resolve) => {
              resolveRequest = resolve;
            });
          });

          return ResourceEditPage.modal.confirmDeselection();
        });

        it('should keep confirmation modal on screen until requests responds', () => {
          expect(ResourceEditPage.modal.isPresent).to.equal(true);
          resolveRequest();
        });

        it('confirmation button now reads "removing"', () => {
          expect(ResourceEditPage.modal.confirmButtonText).to.equal('Removing...');
          resolveRequest();
        });

        it('confirmation button is disabled', () => {
          expect(ResourceEditPage.modal.confirmButtonIsDisabled).to.equal(true);
          resolveRequest();
        });

        describe('when request resolves', () => {
          beforeEach(() => {
            resolveRequest();
          });

          it('goes to the resource show page', () => {
            expect(ResourceShowPage.isUrlPresent).to.equal(true);
          });

          it('reflects that the resource is deselected', () => {
            expect(ResourceShowPage.isResourceSelected).to.equal('Not selected');
          });
        });
      });
    });
  });
});
