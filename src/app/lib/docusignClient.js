import fs from 'fs';
import path from 'path';
import docusign from 'docusign-esign';
import { NextResponse } from 'next/server';

export function getDocuSignConfig() {
  const integrationKey =
    process.env.DOCU_SIGN_INTEGRATION_KEY || process.env.INTEGRATION_KEY || '';
  const userId = process.env.DOCU_SIGN_USER_ID || process.env.USER_ID || '';
  const accountId =
    process.env.DOCU_SIGN_API_ACCOUNT_ID || process.env.API_ACCOUNT_ID || '';
  const accountBaseUri =
    process.env.DOCU_SIGN_ACCOUNT_BASE_URI ||
    process.env.ACCOUNT_BASE_URI ||
    'https://na4.docusign.net';

  const missing = [];
  if (!integrationKey.trim()) missing.push('DOCU_SIGN_INTEGRATION_KEY');
  if (!userId.trim()) missing.push('DOCU_SIGN_USER_ID');
  if (!accountId.trim()) missing.push('DOCU_SIGN_API_ACCOUNT_ID');

  if (missing.length > 0) {
    throw new Error(
      `Missing DocuSign environment variables: ${missing.join(', ')}`,
    );
  }

  const normalizedBase = accountBaseUri.replace(/\/$/, '');
  const restApiBase = normalizedBase.includes('/restapi')
    ? normalizedBase
    : `${normalizedBase}/restapi`;

  const isDemo = /demo\.docusign\.net/i.test(normalizedBase);
  const oauthBasePath = isDemo ? 'account-d.docusign.com' : 'account.docusign.com';

  return {
    integrationKey: integrationKey.trim(),
    userId: userId.trim(),
    accountId: accountId.trim(),
    restApiBase,
    oauthBasePath,
    isDemo,
  };
}

export function getDocuSignPrivateKey() {
  const privateKeyPath = path.join(process.cwd(), 'private.pem');

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(
      `DocuSign private key not found at ${privateKeyPath}. Upload private.pem to the server.`,
    );
  }

  return fs.readFileSync(privateKeyPath, 'utf8');
}

export async function createAuthenticatedDocuSignClient() {
  const config = getDocuSignConfig();
  const privateKey = getDocuSignPrivateKey();

  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(config.oauthBasePath);
  apiClient.setBasePath(config.restApiBase);

  const results = await apiClient.requestJWTUserToken(
    config.integrationKey,
    config.userId,
    ['signature', 'impersonation'],
    privateKey,
    3600,
  );

  const accessToken = results.body.access_token;
  if (!accessToken) {
    throw new Error('Failed to obtain DocuSign access token');
  }

  apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

  return {
    apiClient,
    envelopesApi: new docusign.EnvelopesApi(apiClient),
    accountId: config.accountId,
    config,
  };
}

export function buildDocuSignConsentUrl(config) {
  const oauthHost = config.isDemo
    ? 'account-d.docusign.com'
    : 'account.docusign.com';
  const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_BASE_URL || '');

  return `https://${oauthHost}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${config.integrationKey}&redirect_uri=${redirectUri}`;
}

export function docuSignErrorResponse(err, fallbackMessage) {
  console.error(
    'DocuSign error:',
    err.response?.body || err.message || err,
  );

  const body = err.response?.body;

  if (
    body?.error === 'invalid_grant' &&
    body?.error_description?.includes('consent')
  ) {
    let config;
    try {
      config = getDocuSignConfig();
    } catch {
      config = { integrationKey: process.env.DOCU_SIGN_INTEGRATION_KEY, isDemo: false };
    }

    return NextResponse.json(
      {
        error: 'JWT consent required',
        consentUrl: buildDocuSignConsentUrl(config),
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: err.message || fallbackMessage,
      details: body?.message || body?.errorCode || undefined,
    },
    { status: 500 },
  );
}
