import * as Types from '../../../../../../types';

import client from "@/apolloClient";
import type {
        ApolloQueryResult, ObservableQuery, WatchQueryOptions, QueryOptions
      } from "@apollo/client";
import { readable } from "svelte/store";
import type { Readable } from "svelte/store";
import gql from "graphql-tag"
export type GetMobilityRenewableShareQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetMobilityRenewableShareQuery = { __typename?: 'Query', mobility: Array<{ __typename?: 'mobility', period?: string | null, region?: string | null, value?: number | null }> };

export type GetCountriesQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetCountriesQuery = { __typename?: 'Query', countries: Array<{ __typename?: 'countries', id: string, name_de?: string | null }> };


export const GetMobilityRenewableShareDoc = gql`
    query GetMobilityRenewableShare {
  mobility(filter: {category: {_eq: "share_renewable"}}, limit: -1) {
    period
    region
    value
  }
}
    `;
export const GetCountriesDoc = gql`
    query GetCountries {
  countries(limit: -1) {
    id
    name_de
  }
}
    `;
export const GetMobilityRenewableShare = (
            options: Omit<
              WatchQueryOptions<GetMobilityRenewableShareQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetMobilityRenewableShareQuery> & {
              query: ObservableQuery<
                GetMobilityRenewableShareQuery,
                GetMobilityRenewableShareQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetMobilityRenewableShareDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetMobilityRenewableShareQuery> & {
                query: ObservableQuery<
                  GetMobilityRenewableShareQuery,
                  GetMobilityRenewableShareQueryVariables
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
        
              export const AsyncGetMobilityRenewableShare = (
                options: Omit<
                  QueryOptions<GetMobilityRenewableShareQueryVariables>,
                  "query"
                >
              ) => {
                return client.query<GetMobilityRenewableShareQuery>({query: GetMobilityRenewableShareDoc, ...options})
              }
            
export const GetCountries = (
            options: Omit<
              WatchQueryOptions<GetCountriesQueryVariables>, 
              "query"
            >
          ): Readable<
            ApolloQueryResult<GetCountriesQuery> & {
              query: ObservableQuery<
                GetCountriesQuery,
                GetCountriesQueryVariables
              >;
            }
          > => {
            const q = client.watchQuery({
              query: GetCountriesDoc,
              ...options,
            });
            var result = readable<
              ApolloQueryResult<GetCountriesQuery> & {
                query: ObservableQuery<
                  GetCountriesQuery,
                  GetCountriesQueryVariables
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
        
              export const AsyncGetCountries = (
                options: Omit<
                  QueryOptions<GetCountriesQueryVariables>,
                  "query"
                >
              ) => {
                return client.query<GetCountriesQuery>({query: GetCountriesDoc, ...options})
              }
            