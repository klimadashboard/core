import * as Types from '../../../../../../types';

import client from "@/apolloClient";
import type {
        ApolloQueryResult, ObservableQuery, WatchQueryOptions, QueryOptions
      } from "@apollo/client";
import { readable } from "svelte/store";
import type { Readable } from "svelte/store";
import gql from "graphql-tag"
export type GetSolarPotentialDeQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetSolarPotentialDeQuery = { __typename?: 'Query', solar_potential_de: Array<{ __typename?: 'solar_potential_de', id: string, BEZ?: string | null, GEN?: string | null }> };


export const GetSolarPotentialDeDoc = gql`
    query GetSolarPotentialDe {
  solar_potential_de(limit: 100) {
    id
    BEZ
    GEN
  }
}
    `;
export const GetSolarPotentialDe = (
            options: Omit<
              WatchQueryOptions<GetSolarPotentialDeQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetSolarPotentialDeQuery> & {
              query: ObservableQuery<
                GetSolarPotentialDeQuery,
                GetSolarPotentialDeQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetSolarPotentialDeDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetSolarPotentialDeQuery> & {
                query: ObservableQuery<
                  GetSolarPotentialDeQuery,
                  GetSolarPotentialDeQueryVariables
                >;
              }
            >(
              { data: {} as any, loading: true, error: undefined, networkStatus: 1, query: q },
              (set) => {
                q.subscribe((v: any) => {
                  set({ ...v, query: q });
                });
              }
            );
            return result;
          }
        
              export const AsyncGetSolarPotentialDe = (
                options: Omit<
                  QueryOptions<GetSolarPotentialDeQueryVariables>,
                  "query"
                >
              ) => {
                return client.query<GetSolarPotentialDeQuery>({query: GetSolarPotentialDeDoc, ...options})
              }
            