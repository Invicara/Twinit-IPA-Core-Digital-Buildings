import React from "react";

function withGenericComponentErrorBoundary(WrappedComponent) {

    return class GenericComponentErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                hasError: false
            };
        }

        static getDerivedStateFromError(error) {
            // Update state so the next render will show the fallback UI.
            return {hasError: true};
        }

        componentDidCatch(error, errorInfo) {
            // You can also do more with the error here
            console.error(error);
            console.error(errorInfo);
        }

        render() {
            return this.state.hasError ?
                <div className="inv-error-boundary-container">
                    <span>
                        <i className="fas fa-exclamation-circle point-icon point-error"></i>
                        Something went wrong
                    </span>
                </div>
             : <WrappedComponent {...this.props} />;
        }
    }
}

export default withGenericComponentErrorBoundary;