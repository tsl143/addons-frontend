import { shallow } from 'enzyme';
import React from 'react';

import { SearchBase, mapStateToProps } from 'amo/components/Search';
import SearchResults from 'amo/components/SearchResults';
import SearchSort from 'amo/components/SearchSort';
import { setViewContext } from 'amo/actions/viewContext';
import { searchStart } from 'core/actions/search';
import Paginate from 'core/components/Paginate';
import { ADDON_TYPE_EXTENSION, VIEW_CONTEXT_EXPLORE } from 'core/constants';
import ErrorList from 'ui/components/ErrorList';
import {
  dispatchClientMetadata,
  dispatchSearchResults,
} from 'tests/unit/amo/helpers';
import { createStubErrorHandler, getFakeI18nInst } from 'tests/unit/helpers';

describe('Search', () => {
  let props;

  function render(extra = {}) {
    return shallow(<SearchBase {...{ ...props, ...extra }} />);
  }

  beforeEach(() => {
    props = {
      count: 80,
      dispatch: sinon.stub(),
      errorHandler: createStubErrorHandler(),
      filters: { page: 3, query: 'foo' },
      pathname: '/search/',
      handleSearch: sinon.spy(),
      i18n: getFakeI18nInst(),
      loading: false,
      results: [{ name: 'Foo', slug: 'foo' }, { name: 'Bar', slug: 'bar' }],
    };
  });

  it('renders the results', () => {
    const root = render();
    const results = root.find(SearchResults);
    expect(results.prop('count')).toEqual(props.count);
    expect(results.prop('filters')).toEqual(props.filters);
    expect(results.prop('loading')).toEqual(props.loading);
    expect(results.prop('pathname')).toEqual(props.pathname);
    expect(results.prop('results')).toEqual(props.results);
    expect(Object.keys(results.props()).sort()).toEqual([
      'count',
      'filters',
      'loading',
      'pathname',
      'results',
    ].sort());
  });

  it('renders a Paginate', () => {
    const root = render();
    const paginator = root.find(Paginate);
    expect(paginator.prop('count')).toEqual(80);
    expect(paginator.prop('currentPage')).toEqual(3);
    expect(paginator.prop('pathname')).toEqual('/search/');
    expect(paginator.prop('queryParams')).toEqual({ page: 3, q: 'foo' });
  });

  it('does not render a Paginate when there is no search term', () => {
    const { store } = dispatchSearchResults({
      addons: {},
      filters: { query: null },
    });
    const root = render(mapStateToProps(store.getState()));
    const paginators = root.find(Paginate);

    expect(paginators.length).toEqual(0);
  });

  it('does render a SearchSort when there are filters and results', () => {
    const root = render();
    const sort = root.find(SearchSort);

    expect(sort.prop('filters')).toEqual(props.filters);
    expect(sort.prop('pathname')).toEqual(props.pathname);
  });

  it('does not render a SearchSort when there are no results', () => {
    const { store } = dispatchSearchResults({ addons: {} });
    const root = render(mapStateToProps(store.getState()));

    expect(root.find(SearchSort)).toHaveLength(0);
  });

  it('does not render SearchSort when enableSearchSort is false', () => {
    const root = render({ enableSearchSort: false });
    const searchSort = root.find(SearchSort);

    expect(searchSort.length).toEqual(0);
  });

  it('dispatches the search on mount', () => {
    render();

    sinon.assert.calledWith(props.dispatch, searchStart({
      errorHandlerId: props.errorHandler.id,
      filters: props.filters,
    }));
  });

  it('does not dispatch on mount if filters/results are loaded', () => {
    render({ filtersUsedForResults: props.filters });

    sinon.assert.neverCalledWith(props.dispatch, searchStart({
      errorHandlerId: props.errorHandler.id,
      filters: props.filters,
    }));
  });

  it('dispatches the search on props change', () => {
    const root = render();

    const newFilters = { query: 'I am a new query', page: 1 };
    root.setProps({ filters: newFilters });

    sinon.assert.calledWith(props.dispatch, searchStart({
      errorHandlerId: props.errorHandler.id,
      filters: newFilters,
    }));
  });

  it('sets the viewContext to the addonType if addonType exists', () => {
    const fakeDispatch = sinon.stub();
    const filters = { addonType: ADDON_TYPE_EXTENSION, query: 'test' };

    render({ count: 0, dispatch: fakeDispatch, filters });

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
  });

  it('sets the viewContext to exploring if no addonType found', () => {
    const fakeDispatch = sinon.stub();
    const filters = { query: 'test' };

    render({ count: 0, dispatch: fakeDispatch, filters });

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(VIEW_CONTEXT_EXPLORE));
  });

  it('should render an error', () => {
    const errorHandler = createStubErrorHandler(
      new Error('example of an error')
    );
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('should render an error message on empty search', () => {
    const root = render({ filters: { query: null } });

    expect(root.find('.SearchContextCard-header')).toHaveText('Enter a search term and try again.');
  });

  describe('mapStateToProps()', () => {
    const { state } = dispatchClientMetadata();

    it('returns count, loading, and results', () => {
      expect(mapStateToProps(state)).toEqual({
        count: state.search.count,
        filtersUsedForResults: state.search.filters,
        loading: state.search.loading,
        results: state.search.results,
      });
    });
  });
});
