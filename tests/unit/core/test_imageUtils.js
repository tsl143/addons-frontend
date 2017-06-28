
import { getAddonIconUrl } from 'core/imageUtils';
import { fakeAddon } from 'tests/unit/amo/helpers';
import fallbackIcon from 'amo/img/icons/default-64.png';

describe('getAddonIconUrl', () => {
  const allowedIcon = 'https://addons.cdn.mozilla.net/webdev-64.png';

  it('throw error when empty addon', () => {
    expect(() => { getAddonIconUrl(null); }).toThrowError(/addon cannot be empty/);
  });

  it('return icon url as in fake addon', () => {
    expect(getAddonIconUrl({ ...fakeAddon, icon_url: allowedIcon })).toEqual(allowedIcon);
  });

  it('return fallback icon in case of non allowed origin', () => {
    expect(getAddonIconUrl({ ...fakeAddon, icon_url: 'https://xyz.com/a.png' })).toEqual(fallbackIcon);
  });
});
