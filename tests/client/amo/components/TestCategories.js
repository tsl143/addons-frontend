import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import Categories, { mapStateToProps } from 'amo/components/Categories';
import { setClientApp, setLang } from 'core/actions';
import {
  categoriesFail,
  categoriesFetch,
  categoriesLoad,
} from 'core/actions/categories';
import { ADDON_TYPE_THEME } from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { visibleAddonType } from 'core/utils';
import { getFakeI18nInst } from 'tests/client/helpers';


const categoriesResponse = {
  result: [
    {
      id: 1,
      application: 'android',
      misc: false,
      name: 'Games & Fun',
      slug: 'Games-fun',
      type: 'extension',
      weight: 0,
    },
    {
      id: 2,
      application: 'android',
      misc: false,
      name: 'Travel',
      slug: 'travel',
      type: 'extension',
      weight: 0,
    },
  ]
};

describe('Categories', () => {
  function render({ ...props }) {
    // const baseProps = { clientApp: 'android', categories };
    const store = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
    store.dispatch(categoriesLoad(categoriesResponse));
    // console.error('CATESTATE2', store.getState().categories);
    const ownProps = { params: {
      visibleAddonType: visibleAddonType(props.addonType),
    }};

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={props.store || store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <Categories {...ownProps} {...props} />
        </I18nProvider>
      </Provider>
    ), Categories));
  }

  it('renders Categories', () => {
    const root = render({
      addonType: 'extension',
      error: false,
      loading: false,
    });

    assert.deepEqual(root.querySelectorAll('.Categories-list').map((item) => {
      return item.textContent;
    }), ['Games & Fun', 'Travel']);
  });

  it('renders loading when loading', () => {
    const root = render({
      addonType: 'extension',
      error: false,
      loading: true,
    });

    assert.include(root.textContent, 'Loading');
  });

  it('renders placeholders when loading', () => {
    const root = render({
      addonType: 'extension',
      error: false,
      loading: true,
    });

    assert.equal(
      root.querySelectorAll('.Categories-list-item .LoadingText').length, 10);
  });

  it('dispatches categoriesFetch() on first render (empty categories)', () => {
    const store = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
    const fakeDispatch = sinon.stub();

    const root = render({
      addonType: 'extension',
      dispatch: fakeDispatch,
      store,
    });

    assert.deepEqual(fakeDispatch.firstCall.args[0],
      categoriesFetch({ addonType: 'extension', clientApp: 'android' }));
  });

  it('dispatches nothing on first render (if categories exist)', () => {
    const store = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
    store.dispatch(categoriesLoad(categoriesResponse));
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({
      addonType: 'extension',
      loading: false,
      store,
    });

    assert.isFalse(dispatchSpy.calledWith(categoriesFetch({
      addonType: 'extension',
      clientApp: 'android',
    })));
  });

  it('renders a message when there are no categories', () => {
    const store = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
    store.dispatch(categoriesLoad({ result: [] }));

    const root = render({
      addonType: 'extension',
      error: false,
      loading: false,
      store,
    });

    assert.equal(root.textContent, 'No categories found.');
  });

  it('renders an error', () => {
    const store = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
    store.dispatch(categoriesFail(new Error('Foo')));

    const root = render({
      addonType: 'extension',
      error: true,
      loading: false,
      store,
    });

    assert.equal(root.textContent, 'Failed to load categories.');
  });
});

describe('mapStateToProps', () => {
  it('maps state to props', () => {
    const props = mapStateToProps({
      api: { clientApp: 'android', lang: 'pt' },
      categories: {
        categories: {
          android: {
            [ADDON_TYPE_THEME]: {
              nature: {
                name: 'Nature',
                slug: 'nature',
              },
            },
          },
          firefox: {},
        },
        error: false,
        loading: true,
      },
    }, {
      params: { visibleAddonType: 'themes' },
    });

    assert.deepEqual(props, {
      addonType: ADDON_TYPE_THEME,
      categories: {
        nature: {
          name: 'Nature',
          slug: 'nature',
        },
      },
      clientApp: 'android',
      error: false,
      loading: true,
    });
  });
});
