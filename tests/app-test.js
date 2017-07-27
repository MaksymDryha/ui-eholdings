/* global describe, beforeEach */
import { expect } from 'chai';
import $ from 'jquery';
import sinon from 'sinon';
import it from './it-will';

import { describeApplication } from './helpers';
import AppPage from './pages/app';

describeApplication('eHoldings', function() {
  beforeEach(function() {
    this.server.createList('vendor', 3, {
      vendorName: (i) => `Vendor${i + 1}`
    });
  });

  it('has a searchbox with options to search for vendor, package and title', function() {
    expect(AppPage.searchField).to.exist;
  });

  describe("searching for a vendor", function() {
    beforeEach(function() {
      AppPage.search('Vendor');
    });

    it("displays vendor entries related to 'Vendor'", function() {
      expect(AppPage.searchResultsItems).to.have.lengthOf(3);
    });

    it("displays the name, number of packages available, and packages subscribed to for each vendor");

    describe("filtering the search results further", function() {
      beforeEach(function() {
        AppPage.search('Vendor1');
      });

      it("only shows a single result", function() {
        expect(AppPage.searchResultsItems).to.have.lengthOf(1);
      });
    });

    describe("clicking on a result", function() {
      it("shows vendor details");
      it("shows packages for vendor");
    });

    describe("sorting by name", function() {
      it("sorts by name");
    });
  });

  describe("searching for the vendor 'fhqwhgads'", function() {
    it("displays 'no results' message");
  });

  describe("encountering a server error", function() {
    it("dies with dignity");
  });
});
