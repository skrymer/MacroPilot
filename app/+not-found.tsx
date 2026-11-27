/**
 * A link that matches no page: the router's own page, declared here so that the root stack lays it
 * out and its `screenLayout` can send a release build to Today. The router's generated one skips it.
 */
export { Unmatched as default } from 'expo-router';
