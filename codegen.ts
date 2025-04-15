import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: 'https://base.klimadashboard.org/graphql',
	documents: './src/**/*.gql',

	// Single file config
	// generates: {
	// 	'./src/graphql/generated.ts': {
	// 		plugins: ['typescript', 'typescript-operations', 'graphql-codegen-svelte-apollo']
	// 	}
	// },

	// Colocation config
	generates: {
		'src/types.ts': {
			plugins: ['typescript']
		},
		'src/': {
			preset: 'near-operation-file',
			presetConfig: {
				extension: '.generated.ts',
				baseTypesPath: 'types.ts',
				folder: '__generated__'
			},
			plugins: ['typescript-operations', 'graphql-codegen-svelte-apollo']
		}
	},
	config: {
		clientPath: '@/apolloClient',
		asyncQuery: true
	}
};
export default config;
