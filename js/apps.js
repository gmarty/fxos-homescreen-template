'use strict';

var OpenWebApp = function(icons) {
  this.icons = icons;
};

/**
 * Get the list of installed apps and listen to install and uninstall events.
 *
 * @returns {Promise}
 */
OpenWebApp.prototype.getInstalledApps = function() {
  // A new app is installed.
  navigator.mozApps.mgmt.addEventListener('install', (e) => {
    // Check if the app already exists, and if so, update it.
    // This happens when reinstalling an app via WebIDE.
    var existing = false;
    for (var child of this.icons) {
      if (child.dataset.id === e.application.manifestURL) {
        // Update the app element.
        this.updateDOMElement(child, e.application);
        existing = true;
      }
    }
    if (existing) {
      return;
    }

    this.addApp(e.application);
  });

  // A app is uninstalled.
  navigator.mozApps.mgmt.addEventListener('uninstall', () => {
    for (child of this.icons) {
      if (child.dataset.id === e.application.manifestURL) {
        this.icons.removeChild(child);
      }
    }
  });

  // Get the list of all apps.
  return navigator.mozApps.mgmt.getAll().then((apps) => {
      for (var app of apps) {
        if (typeof app.manifest.entry_points === 'object') {
          for (var entrypoint in app.manifest.entry_points) {
            this.addApp(app, entrypoint);
          }
        } else {
          this.addApp(app);
        }
      }
    })
    .catch((e) => {
      console.error('Error calling getAll: ' + e);
    });
};

/**
 * Given a DOMApplication object containing the details of an Open Web App,
 * load an appropriate icon and create a DOM element, then append it to the
 * home screen.
 *
 * @param {DOMApplication} app
 * @param {string} entrypoint
 */
OpenWebApp.prototype.addApp = function(app, entrypoint = '') {
  this.makeDOMElement(app, entrypoint);
};

/**
 * Create a DOM element and append it to the list of items in the home screen.
 *
 * @param {DOMApplication} app
 * @param {string} entrypoint
 */
OpenWebApp.prototype.makeDOMElement = function(app, entrypoint = '') {
  var domElement = document.createElement('div');
  domElement.dataset.id = app.manifestURL;
  domElement.dataset.type = 'app';
  domElement.tabindex = 0;
  domElement.setAttribute('role', 'link'); // Accessibility

  var img = document.createElement('img');
  img.src = DEFAULT_ICON_SRC;
  img.setAttribute('role', 'presentation'); // Accessibility
  domElement.appendChild(img);

  var label = document.createElement('span');
  domElement.appendChild(label);

  this.updateDOMElement(domElement, app, entrypoint);

  domElement.addEventListener('click', () => {
    app.launch(entrypoint);
  });

  this.icons.appendChild(domElement);
};

/**
 * Update an element of the home screen when its details change.
 *
 * @param {HTMLElement} domElement
 * @param {DOMApplication} app
 * @param {string} entrypoint
 */
OpenWebApp.prototype.updateDOMElement = function(domElement, app,
                                                 entrypoint = '') {
  // Not all apps are user facing. If so, hide the app element.
  // The app role can change on update.
  var manifest = app.manifest || app.updateManifest;
  if (manifest && manifest.role && HIDDEN_ROLES.includes(manifest.role)) {
    domElement.style.display = 'none';
    return;
  }
  domElement.style.display = '';

  // Set the label.
  var userLang = navigator.languages[0];
  app.getLocalizedValue('short_name', userLang, entrypoint)
    .then((shortName) => {
      domElement.querySelector('span').textContent = shortName;
    })
    .catch(() => {
      app.getLocalizedValue('name', userLang, entrypoint)
        .then((name) => {
          domElement.querySelector('span').textContent = name;
        })
        .catch((e) => {
          // Try to fall back to manifest app name
          domElement.querySelector('span').textContent =
            app.manifest.short_name || app.manifest.name || DEFAULT_NAME;
        });
    });

  // Set the icon image source.
  navigator.mozApps.mgmt.getIcon(app, ICON_IMG_SIZE, entrypoint)
    .then(blob => {
      domElement.querySelector('img').src = URL.createObjectURL(blob);
    })
    .catch(e => {
      console.error('Cannot load the icon:', e);
    });
};
