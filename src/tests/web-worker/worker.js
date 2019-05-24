/**
 * {Object} - data
 */
self.onmessage = ({data}) => {
    postMessage(data.size === 0 ?
        'terminate'
    :
        data
    );
}
