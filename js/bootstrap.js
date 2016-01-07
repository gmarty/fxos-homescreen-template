'use strict';

// The size in pixels of the icon.
const ICON_IMG_SIZE = 128;

// The default app name to show if anything goes wrong.
const DEFAULT_NAME = 'Unknown app';

// The path to the default icon image if it's not available.
const DEFAULT_ICON_SRC = '/img/default-icon.svg';

/**
 * App roles that will be skipped on the home screen.
 */
const HIDDEN_ROLES = [
  'system', 'input', 'homescreen', 'theme', 'addon', 'langpack'
];

var Homescreen = function() {
  var icons = document.querySelector('#icons');
  this.openWebApp = new OpenWebApp(icons);
  this.pinnedSite = new PinnedSite(icons);
  this.pinnedPage = new PinnedPage(icons);
};

Homescreen.prototype.start = function() {
  Promise
    .all([
      this.openWebApp.getInstalledApps(),
      this.pinnedSite.getPinnedSites(),
      this.pinnedPage.getPinnedPages()
    ])
    .then(() => {
      console.log('All icons installed');
    })
    .catch((e) => {
      console.error('Something went wrong', e);
    });
};

var homescreen = new Homescreen();
homescreen.start();
