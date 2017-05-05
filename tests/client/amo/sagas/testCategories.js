import { hideLoading, showLoading } from 'react-redux-loading-bar';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import categoriesSaga, { fetchCategories } from 'amo/sagas/categories';
import { getApi } from 'amo/sagas/utils';
import * as actions from 'core/actions/categories';
import { categories as categoriesApi } from 'core/api';
import { CATEGORIES_FETCH } from 'core/constants';


const categories = {};

describe('categoriesSaga', () => {
  it('should get Api from state then make API request to categories', () => {
    const fetchCategoriesGenerator = fetchCategories();

    let next = fetchCategoriesGenerator.next();
    assert.deepEqual(
      next.value, put(showLoading()), 'should dispatch show loading bar');

    next = fetchCategoriesGenerator.next();
    const api = next.value;
    assert.deepEqual(api, select(getApi), 'must yield getApi');

    next = fetchCategoriesGenerator.next();
    assert.deepEqual(next.value, call(categoriesApi, { api: undefined }),
      'must yield categoriesApi');

    next = fetchCategoriesGenerator.next(categories);
    assert.deepEqual(next.value, put(actions.categoriesLoad(categories)),
      'must yield categoriesLoad(categories)');

    next = fetchCategoriesGenerator.next();
    assert.deepEqual(next.value, put(hideLoading()),
      'must yield hideLoading()');
  });

  it('should dispatch fail if API request fails', () => {
    const fetchCategoriesGenerator = fetchCategories();

    let next = fetchCategoriesGenerator.next();
    assert.deepEqual(
      next.value, put(showLoading()), 'should dispatch show loading bar');

    next = fetchCategoriesGenerator.next();
    const api = next.value;
    assert.deepEqual(api, select(getApi), 'must yield getApi');

    next = fetchCategoriesGenerator.next();
    assert.deepEqual(next.value, call(categoriesApi, { api: undefined }),
      'must yield categoriesApi');

    // Make the response undefined so an error is encountered and the saga
    // encounters an error.
    const error = new Error('response is undefined');
    next = fetchCategoriesGenerator.next(undefined);
    assert.deepEqual(next.value,
      put(actions.categoriesFail(error)),
      'must yield categoriesFail(error)');

    next = fetchCategoriesGenerator.next();
    assert.deepEqual(next.value, put(hideLoading()),
      'must yield hideLoading()');
  });

  it('should yield takeEvery() for the main generator', () => {
    assert.deepEqual(categoriesSaga().next().value,
      takeEvery(CATEGORIES_FETCH, fetchCategories));
  });
});
