'use strict';

var PinnedSite = function(icons) {
  this.icons = icons;
};

/**
 * Get the list of pinned sites and responds to set, removed and clear events.
 *
 * @returns {Promise}
 */
PinnedSite.prototype.getPinnedSites = function() {
  var siteStore = new Datastore('bookmarks_store');

  return siteStore.init().then(() => {
    // A new site is pinned.
    document.addEventListener('bookmarks_store-set', (e) => {
      // Update element if site is already pinned...
      var id = e.detail.id;
      siteStore.get(id).then((pinnedSite) => {
        var existing = false;
        for (var child of this.icons) {
          if (child.dataset.id === id && child.dataset.type === 'site') {
            // Update the app element.
            this.updateDOMElement(child, pinnedSite.data);
            existing = true;
          }
        }
        if (existing) {
          return;
        }

        // ... otherwise, add it to the list.
        this.addPinnedSite(pinnedSite.data);
      });
    });

    // A site is unpinned.
    document.addEventListener('bookmarks_store-removed', (e) => {
      for (var child of this.icons) {
        if (child.dataset.id === e.detail.id && child.dataset.type === 'site') {
          this.icons.removeChild(child);
        }
      }
    });

    // All pinned sites are unpinned.
    document.addEventListener('bookmarks_store-cleared', () => {
      for (var child of this.icons) {
        if (child.dataset.type === 'site') {
          this.icons.removeChild(child);
        }
      }
    });

    // Get the list of all pinned sites.
    return siteStore.getAll().then((pinnedSites) => {
      for (var pinnedSite of pinnedSites) {
        this.addPinnedSite(pinnedSite.data);
      }
    });
  });
};

/**
 * Given a pinned site object containing the details of a website,
 * load an appropriate icon and create a DOM element, then append it to the
 * home screen.
 *
 * @param {Object} pinnedSite
 */
PinnedSite.prototype.addPinnedSite = function(pinnedSite) {
  this.makeDOMElement(pinnedSite);
};

/**
 * Create a DOM element and append it to the list of items in the home screen.
 *
 * @param {Object} pinnedSite
 */
PinnedSite.prototype.makeDOMElement = function(pinnedSite) {
  var domElement = document.createElement('div');
  domElement.dataset.id = pinnedSite.url;
  domElement.dataset.type = 'site';

  var img = document.createElement('img');
  img.src = DEFAULT_ICON_SRC;
  domElement.appendChild(img);

  var label = document.createElement('span');
  domElement.appendChild(label);

  this.updateDOMElement(domElement, pinnedSite);

  domElement.addEventListener('click', () => {
    var features = {
      name: pinnedSite.name,
      remote: true
    };

    if (pinnedSite.scope) {
      features.scope = pinnedSite.scope;
    }

    window.open(pinnedSite.url, '_samescope', Object.keys(features)
      .map(
        key => encodeURIComponent(key) + '=' + encodeURIComponent(features[key])
      ).join(','));
  });

  this.icons.appendChild(domElement);
};

/**
 * Update an element of the home screen when its details change.
 *
 * @param {HTMLElement} domElement
 * @param {Object} pinnedSite
 */
PinnedSite.prototype.updateDOMElement = function(domElement, pinnedSite) {
  domElement.querySelector('span').textContent = pinnedSite.name || DEFAULT_NAME;

  IconsHelper.getIconBlob(pinnedSite.url, ICON_IMG_SIZE, pinnedSite)
    .then(blob => {
      domElement.querySelector('img').src = URL.createObjectURL(blob);
    })
    .catch(e => {
      console.error('Cannot load the icon:', e);
    });
};
