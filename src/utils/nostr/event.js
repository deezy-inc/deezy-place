export function metadataFromEvent(event) {
    try {
        const metadata = JSON.parse(event.content);
        metadata.pubkey = event.pubkey;
        return metadata;
    } catch (_) {
        return {};
    }
}
