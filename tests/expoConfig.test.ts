import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * The config as the build will see it — after every config plugin has run, so
 * the values plugins write into Info.plist are checked where they land rather than where they are
 * asked for.
 */
const introspect = () => {
  const root = path.resolve(__dirname, '..');
  return JSON.parse(
    execFileSync(
      path.join(root, 'node_modules/.bin/expo'),
      ['config', '--type', 'introspect', '--json'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    ),
  );
};

let resolved: any;

beforeAll(() => {
  resolved = introspect();
});

describe('the resolved Expo config', () => {
  it('locks the app to portrait', () => {
    // Given the config after every plugin has run
    const config = resolved;

    // When its orientation is read
    const orientation = config.orientation;

    // Then it is portrait, the only layout the screens are designed for
    expect(orientation).toBe('portrait');
  });

  it('follows the system appearance, because the design has a light and a dark one', () => {
    // Given the config after every plugin has run
    const config = resolved;

    // When its interface style is read
    const style = config.userInterfaceStyle;

    // Then it is automatic, so the tokens switch with the system
    expect(style).toBe('automatic');
  });

  it('names the same app on iOS and Android', () => {
    // Given the config after every plugin has run
    const config = resolved;

    // When its identifiers are read
    const identifiers = [config.ios.bundleIdentifier, config.android.package];

    // Then both platforms are one app
    expect(identifiers).toEqual(['com.skrymer.macropilot', 'com.skrymer.macropilot']);
  });
});
