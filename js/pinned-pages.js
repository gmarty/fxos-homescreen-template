'use strict';

var PinnedPage = function(icons) {
  this.icons = icons;
};

/**
 * Get the list of pinned pages and respond to set, removed and cleared events.
 * When a page is pinned, look for its pinned property to determine if it's
 * being pinned (otherwise it's just an entry in the history).
 *
 * @returns {Promise}
 */
PinnedPage.prototype.getPinnedPages = function() {
  var pagesStore = new PagesStore('places');

  return pagesStore.init().then(() => {
    // A new page is pinned.
    document.addEventListener('places-set', (e) => {
      var id = e.detail.id;
      pagesStore.get(id).then((pinnedPage) => {
        var existing = false;
        for (var child of this.icons.childNodes) {
          if (child.dataset.id === id && child.dataset.type === 'page') {
            // Look to see if this page is not already displayed.
            if (!pinnedPage.data.pinned) {
              // If it's not pinned anymore, let's remove it.
              this.icons.removeChild(child);
            } else {
              // If it's still pinned, let's update the element.
              this.updateDOMElement(child, pinnedPage.data);
            }
            existing = true;
          }
        }
        if (existing) {
          return;
        }

        if (!pinnedPage.data.pinned) {
          return;
        }

        // A new page was pinned.
        this.addPinnedPage(pinnedPage.data);
      });
    });

    // A pinned page is unpinned.
    document.addEventListener('places-removed', (e) => {
      for (var child of this.icons) {
        if (child.dataset.id === e.detail.id && child.dataset.type === 'page') {
          this.icons.removeChild(child);
          return;
        }
      }
    });

    // All pinned pages are unpinned.
    document.addEventListener('places-cleared', () => {
      for (var child of this.icons) {
        if (child.dataset.type === 'page') {
          this.icons.removeChild(child);
        }
      }
    });

    // Get the list of all pinned pages.
    return pagesStore.getAll().then((pinnedPages) => {
      for (var pinnedPage of pinnedPages) {
        this.addPinnedPage(pinnedPage.data);
      }
    });
  });
};

/**
 * Given a pinned page object containing the details of a web page,
 * load an appropriate icon and create a DOM element, then append it to the
 * home screen.
 *
 * @param {Object} pinnedPage
 */
PinnedPage.prototype.addPinnedPage = function(pinnedPage) {
  this.makeDOMElement(pinnedPage);
};

/**
 * Create a DOM element and append it to the list of items in the home screen.
 *
 * @param {Object} pinnedPage
 */
PinnedPage.prototype.makeDOMElement = function(pinnedPage) {
  var domElement = document.createElement('div');
  domElement.dataset.id = pinnedPage.url;
  domElement.dataset.type = 'page';

  var img = document.createElement('img');
  img.src = DEFAULT_ICON_SRC;
  domElement.appendChild(img);

  var label = document.createElement('span');
  domElement.appendChild(label);

  this.updateDOMElement(domElement, pinnedPage);

  domElement.addEventListener('click', () => {
    var features = {
      name: pinnedPage.title,
      remote: true
    };

    window.open(pinnedPage.url, '_samescope', Object.keys(features)
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
 * @param {Object} pinnedPage
 */
PinnedPage.prototype.updateDOMElement = function(domElement, pinnedPage) {
  domElement.querySelector('span').textContent = pinnedPage.title || DEFAULT_NAME;

  IconsHelper.getIconBlob(pinnedPage.url, ICON_IMG_SIZE, pinnedPage)
    .then(blob => {
      domElement.querySelector('img').src = URL.createObjectURL(blob);
    })
    .catch(e => {
      console.error('Cannot load the icon:', e);
    });
};
