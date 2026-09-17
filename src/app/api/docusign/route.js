export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import docusign from 'docusign-esign';
import { PDFDocument } from 'pdf-lib';
import { NextResponse } from 'next/server';
import { fillInvestigatorAgreement } from '../../../utils/fillPDF';
import {
  createAuthenticatedDocuSignClient,
  docuSignErrorResponse,
  getAppBaseUrl,
} from '../../lib/docusignClient';

function splitLegalName(legalName) {
  const name = String(legalName || '').trim();
  if (!name) return { firstName: '', lastName: '' };

  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: '', lastName: parts[0] };
  }

  return {
    firstName: parts[parts.length - 1],
    lastName: parts.slice(0, -1).join(' '),
  };
}

export async function POST(req) {
  try {
    const {
      firstName: rawFirstName,
      lastName: rawLastName,
      email,
      searchResults: rawResults,
      userAgreement: rawData,
    } = await req.json();

    let searchResults;
    let userAgreement;
    try {
      if (typeof rawResults === 'string') {
        const onceParsed = JSON.parse(rawResults);
        searchResults =
          typeof onceParsed === 'string' ? JSON.parse(onceParsed) : onceParsed;
      } else {
        searchResults = rawResults;
      }

      if (typeof rawData === 'string') {
        const onceParsed = JSON.parse(rawData);
        userAgreement =
          typeof onceParsed === 'string' ? JSON.parse(onceParsed) : onceParsed;
      } else {
        userAgreement = rawData;
      }
    } catch (err) {
      console.error('Failed to parse searchResults:', err);
      searchResults = [];
    }

    const fallbackName = splitLegalName(userAgreement?.legal_name);
    const firstName = rawFirstName || fallbackName.firstName;
    const lastName = rawLastName || fallbackName.lastName;
    console.log('----', {
      firstName,
      lastName,
      email,
      searchResults,
      userAgreement,
    });
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }
    const allProperty = searchResults;
    const property = searchResults?.[0];
    const claimantAddress = [
      property?.owner_street_1,
      property?.owner_city,
      property?.owner_state,
      property?.owner_zip,
    ]
      .filter(Boolean)
      .join(' ');

    const filledPdfBytes = await fillInvestigatorAgreement({
      claimantName: `${firstName} ${lastName}`,
      claimantNameInitial: `${firstName.charAt(0).toUpperCase()}${lastName
        .charAt(0)
        .toUpperCase()}*`,
      investigatorNameInitial: 'EC',
      investigatorName: 'Platform Builders LLC',
      claimantEmail: email,
      claimantAddress,
      percentage: '10%',
      propertyId: property?.property_id,
      propertyType: property?.property_type,
      date: new Date().toLocaleDateString(),
      contactNo: userAgreement?.contact_no,
      ssnId: userAgreement?.ssn_id,
      allProperty: allProperty,
    });
    const { envelopesApi, accountId } =
      await createAuthenticatedDocuSignClient();
    console.log('--109--');
    // Load PDF and determine last page
    const pdfPath = path.join(
      process.cwd(),
      'src',
      'app',
      'pdf',
      filledPdfBytes?.fileName,
    );
    if (!fs.existsSync(pdfPath)) throw new Error('PDF file not found');

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const numberOfPages = pdfDoc.getPageCount();
    console.log(numberOfPages, '--123--', pdfPath);
    const pdfBase64 = pdfBytes.toString('base64');
    // Create envelope definition
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = 'Please sign this document';
    envelopeDefinition.documents = [
      {
        documentBase64: pdfBase64,
        name: 'Agreement',
        fileExtension: 'pdf',
        documentId: '1',
      },
    ];

    const signer = new docusign.Signer();
    signer.email = email;
    signer.name = `${firstName} ${lastName}`;
    signer.recipientId = '1';
    signer.routingOrder = '1';
    signer.clientUserId = '1234';

    const signHere = new docusign.SignHere();
    signHere.documentId = '1';
    signHere.pageNumber = '1'; //numberOfPages.toString();
    signHere.xPosition = '180';
    signHere.yPosition = '520';

    const initialHere1 = new docusign.InitialHere();
    initialHere1.documentId = '1';
    initialHere1.pageNumber = '1';
    initialHere1.xPosition = '80';
    initialHere1.yPosition = '270';

    const initialHere2 = new docusign.InitialHere();
    initialHere2.documentId = '1';
    initialHere2.pageNumber = '1';
    initialHere2.xPosition = '330';
    initialHere2.yPosition = '370';

    // One InitialHere per claimed property, laid out down page 2 onwards.
    //
    // These used to be stacked unconditionally at 180 + index * 170 on page 2,
    // so the 5th property landed at y=860 on a 792pt page and DocuSign rejected
    // the envelope with "Tab InitialHere is located off of page 2". Measure the
    // real page height and flow onto the next page instead of running off the
    // bottom.
    const dynamicInitialTabs = [];
    if (numberOfPages >= 2 && allProperty?.length) {
      const INITIAL_START_Y = 180;
      const INITIAL_ROW_SPACING = 170;
      // Leaves room for the tab glyph itself so it cannot clip the page edge.
      const INITIAL_BOTTOM_MARGIN = 60;

      // pdf-lib pages are zero-indexed; page 2 is index 1.
      const { height: pageHeight } = pdfDoc.getPage(1).getSize();
      const usableHeight = pageHeight - INITIAL_START_Y - INITIAL_BOTTOM_MARGIN;
      const rowsPerPage = Math.max(
        1,
        Math.floor(usableHeight / INITIAL_ROW_SPACING) + 1,
      );

      allProperty.forEach((property, index) => {
        const pageOffset = Math.floor(index / rowsPerPage);
        const targetPage = 2 + pageOffset;

        // Never address a page the document does not have.
        if (targetPage > numberOfPages) {
          console.warn(
            `[docusign] Skipping InitialHere for property ${index + 1}: page ${targetPage} exceeds document length ${numberOfPages}`,
          );
          return;
        }

        const initialHere = new docusign.InitialHere();
        initialHere.documentId = '1';
        initialHere.pageNumber = String(targetPage);
        initialHere.xPosition = '80';
        initialHere.yPosition = String(
          INITIAL_START_Y + (index % rowsPerPage) * INITIAL_ROW_SPACING,
        );
        dynamicInitialTabs.push(initialHere);
      });
    }

    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    tabs.initialHereTabs = [initialHere1, initialHere2, ...dynamicInitialTabs];
    signer.tabs = tabs;

    envelopeDefinition.recipients = { signers: [signer] };
    envelopeDefinition.status = 'sent';

    // Create envelope
    const envelopeResponse = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });
    const envelopeId = envelopeResponse.envelopeId;

    const returnUrl = `${getAppBaseUrl()}/signed?envelopeId=${envelopeId}`;

    // Create recipient view (embedded signing)
    const viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = returnUrl;
    viewRequest.authenticationMethod = 'none';
    viewRequest.email = email;
    viewRequest.userName = `${firstName} ${lastName}`;
    viewRequest.clientUserId = '1234';

    const recipientView = await envelopesApi.createRecipientView(
      accountId,
      envelopeId,
      {
        recipientViewRequest: viewRequest,
      },
    );
    return NextResponse.json({
      success: true,
      signingUrl: recipientView.url,
      envelopeId,
    });
  } catch (err) {
    return docuSignErrorResponse(err, 'Failed to create envelope');
  }
}
