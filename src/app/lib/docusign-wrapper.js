// This wrapper ensures docusign-esign works in both dev and production
let docusignModule = null;

function getDocuSignModule() {
  if (docusignModule) {
    return docusignModule;
  }

  try {
    // Use require to bypass ES module issues
    docusignModule = require('docusign-esign');
    return docusignModule;
  } catch (error) {
    console.error('Failed to load docusign-esign:', error);
    throw new Error('DocuSign module could not be loaded');
  }
}

module.exports = { getDocuSignModule };