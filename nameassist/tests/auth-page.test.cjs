const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function renderAuth(mode, clientId) {
  const effects = [];
  let initializations = 0;
  const sdkReact = {
    ...React,
    useContext: () => ({ clientId, scriptLoadedSuccessfully: true }),
    useEffect: effect => effects.push(effect),
  };
  const oauth = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('@react-oauth/google'), 'utf8'), {
    exports: oauth.exports,
    require: () => sdkReact,
    window: { google: { accounts: { oauth2: { initTokenClient: ({ client_id }) => {
      initializations++;
      if (!client_id) throw new Error('Missing required parameter client_id.');
      return { requestAccessToken() {} };
    } } } } },
  });
  const source = fs.readFileSync('src/auth/AuthPage.tsx', 'utf8')
    .replaceAll('import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID', JSON.stringify(clientId));
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const page = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: page.exports,
    require: name => name === '@react-oauth/google' ? oauth.exports
      : name === './AuthContext' ? { useAuth: () => ({ completeAuth() {} }) }
      : name === './api' ? {} : require(name),
  });
  const html = renderToStaticMarkup(React.createElement(page.exports.AuthPage, { mode }));
  for (const effect of effects) effect();
  return { html, initializations };
}

for (const mode of ['login', 'signup']) {
  test(`${mode} renders email/password without Google configuration`, () => {
    const { html, initializations } = renderAuth(mode, '');
    assert.match(html, /name="email"/);
    assert.match(html, /name="password"/);
    assert.equal(initializations, 0);
    assert.doesNotMatch(html, /with Google/);
  });
  test(`${mode} offers Google login when configured`, () => {
    const { html, initializations } = renderAuth(mode, 'test-client-id');
    assert.match(html, /with Google/);
    assert.equal(initializations, 1);
  });
}
