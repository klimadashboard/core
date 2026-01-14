import * as Types from '../../../../../../types';

import client from "@/apolloClient";
import type {
        ApolloQueryResult, ObservableQuery, WatchQueryOptions, QueryOptions
      } from "@apollo/client";
import { readable } from "svelte/store";
import type { Readable } from "svelte/store";
import gql from "graphql-tag"
export type GetSolarPotentialDeQueryVariables = Types.Exact<{
  limit?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  offset?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  search?: Types.InputMaybe<Types.Scalars['String']['input']>;
  sort?: Types.InputMaybe<Array<Types.InputMaybe<Types.Scalars['String']['input']>> | Types.InputMaybe<Types.Scalars['String']['input']>>;
}>;


export type GetSolarPotentialDeQuery = { __typename?: 'Query', solar_potential_de: Array<{ __typename?: 'solar_potential_de', id: string, AGS?: number | null, ARS?: any | null, GEN?: string | null, BEZ?: string | null, netPotentialShare?: number | null, buildingsWithPVShare?: number | null, MStRInstalledNetPower?: number | null, SolarPotentialInMWhPerYear?: number | null, NumberOfBuildingsWithPV?: number | null, NumberOfBuildings?: number | null }> };


export const GetSolarPotentialDeDoc = gql`
    query GetSolarPotentialDe($limit: Int, $offset: Int, $search: String, $sort: [String]) {
  solar_potential_de(limit: $limit, offset: $offset, search: $search, sort: $sort) {
    id
    AGS
    ARS
    GEN
    BEZ
    netPotentialShare
    buildingsWithPVShare
    MStRInstalledNetPower
    SolarPotentialInMWhPerYear
    NumberOfBuildingsWithPV
    NumberOfBuildings
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
            