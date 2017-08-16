import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { clearError, setError } from 'core/actions/errors';
import log from 'core/logger';
import ErrorList from 'ui/components/ErrorList';

function generateHandlerId({ name = '' } = {}) {
  return `${name}-${Math.random().toString(36).substr(2, 9)}`;
}

/*
 * Error handling utility for components.
 *
 * This is a class that components can work with
 * to easily dispatch error actions or retrieve error
 * information from the Redux state.
 */
export class ErrorHandler {
  constructor({ id, dispatch, capturedError = null } = {}) {
    this.id = id;
    this.dispatch = dispatch;
    this.capturedError = capturedError;
  }

  clear() {
    const action = this.createClearingAction();
    this.dispatch(action);
  }

  createClearingAction() {
    return clearError(this.id);
  }

  hasError() {
    return Boolean(this.capturedError);
  }

  renderError() {
    const { code, messages } = this.capturedError;
    return <ErrorList messages={messages} code={code} />;
  }

  renderErrorIfPresent() {
    return this.hasError() ? this.renderError() : null;
  }

  createErrorAction(error) {
    return setError({ error, id: this.id });
  }

  handle(error) {
    const action = this.createErrorAction(error);
    this.dispatch(action);
  }
}

export type ErrorHandlerType = typeof ErrorHandler;

/*
 * For convenience, you can use `withRenderedErrorHandler()` which renders the
 * error automatically at the beginning of the component's output.
 *
 * Example:
 *
 * class SomeComponent extends React.Component {
 *   static propTypes = {
 *     errorHandler: PropTypes.object.isRequired,
 *   }
 *   render() {
 *     const { errorHandler } = this.props;
 *     return (
 *       <div>
 *         {errorHandler.hasErrorIfPresent()}
 *         <div>some content</div>
 *       </div>
 *     );
 *   }
 * }
 *
 * export default compose(
 *   withErrorHandler({ name: 'SomeComponent' }),
 * )(SomeComponent);
 */
export function withErrorHandler({ name, id }) {
  return (WrappedComponent) => {
    const mapStateToProps = () => {
      // Each component instance gets its own error handler ID.
      let instanceId = id;
      if (!instanceId) {
        instanceId = generateHandlerId({ name });
        log.debug(`Generated error handler ID: ${instanceId}`);
      }

      return (state) => ({
        error: state.errors[instanceId],
        instanceId,
      });
    };

    const mergeProps = (stateProps, dispatchProps, ownProps) => ({
      ...ownProps,
      errorHandler: new ErrorHandler({
        capturedError: stateProps.error,
        id: stateProps.instanceId,
        dispatch: dispatchProps.dispatch,
      }),
    });

    return compose(
      connect(mapStateToProps, undefined, mergeProps),
    )(WrappedComponent);
  };
}

/*
 * This is a decorator that automatically renders errors.
 *
 * It will render all errors at the top of the wrapped component's
 * content and it will pass an errorHandler property for the component
 * to use.
 *
 * Example:
 *
 * class SomeComponent extends React.Component {
 *   static propTypes = {
 *     // The decorator will assign an ErrorHandler instance to this.
 *     errorHandler: PropTypes.object.isRequired,
 *   }
 *   render() {
 *     // In the case of an error, the list of errors will be displayed
 *     // above this div.
 *     return <div>some content</div>;
 *   }
 * }
 *
 * export default compose(
 *   withRenderedErrorHandler({ name: 'SomeComponent' }),
 * )(SomeComponent);
 */
export function withRenderedErrorHandler({ name, id } = {}) {
  return (WrappedComponent) => {
    function ErrorBanner(props) {
      // eslint-disable-next-line react/prop-types
      const { errorHandler } = props;

      if (errorHandler.hasError()) {
        return (
          <div>
            {errorHandler.renderError()}
            <WrappedComponent {...props} />
          </div>
        );
      }

      return <WrappedComponent {...props} />;
    }

    return compose(
      withErrorHandler({ name, id }),
    )(ErrorBanner);
  };
}
