function withTelemetry(ViewerComponent) {
    return class extends React.Component {
        componentDidUpdate(prevProps) {
            console.log('Current props: ', this.props);
            console.log('Previous props: ', prevProps);
        }
        render() {
            // Wraps the input component in a container, without mutating it. Good!
            return <ViewerComponent {...this.props} />;
        }
    }
}