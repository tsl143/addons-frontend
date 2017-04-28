import { fork } from 'redux-saga/effects';

import rootSagas from 'amo/sagas';
import categoriesSaga from 'amo/sagas/categories';


describe('amo rootSagas', () => {
  it('should get Api from state then make API request to categories', () => {
    const sagaGenerator = rootSagas();

    assert.deepEqual(sagaGenerator.next().value, [
      fork(categoriesSaga),
    ], 'must yield [fork(saga), [...]]');
  });
});
