import { ApolloClient, InMemoryCache } from '@apollo/client/core';

const client = new ApolloClient({
	uri: 'https://base.klimadashboard.org/graphql',
	cache: new InMemoryCache()
});

export default client;
