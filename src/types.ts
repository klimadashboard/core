export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  GraphQLBigInt: { input: any; output: any; }
  GraphQLStringOrFloat: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export enum EventEnum {
  Create = 'create',
  Delete = 'delete',
  Update = 'update'
}

export type Query = {
  __typename?: 'Query';
  at_geosphere_data: Array<At_Geosphere_Data>;
  at_geosphere_data_aggregated: Array<At_Geosphere_Data_Aggregated>;
  at_geosphere_data_by_id?: Maybe<At_Geosphere_Data>;
  at_geosphere_data_by_version?: Maybe<Version_At_Geosphere_Data>;
  at_geosphere_stations: Array<At_Geosphere_Stations>;
  at_geosphere_stations_aggregated: Array<At_Geosphere_Stations_Aggregated>;
  at_geosphere_stations_by_id?: Maybe<At_Geosphere_Stations>;
  at_geosphere_stations_by_version?: Maybe<Version_At_Geosphere_Stations>;
  biomasse_produktion: Array<Biomasse_Produktion>;
  biomasse_produktion_aggregated: Array<Biomasse_Produktion_Aggregated>;
  biomasse_produktion_by_id?: Maybe<Biomasse_Produktion>;
  biomasse_produktion_by_version?: Maybe<Version_Biomasse_Produktion>;
  biomasse_zielpfad: Array<Biomasse_Zielpfad>;
  biomasse_zielpfad_aggregated: Array<Biomasse_Zielpfad_Aggregated>;
  biomasse_zielpfad_by_id?: Maybe<Biomasse_Zielpfad>;
  biomasse_zielpfad_by_version?: Maybe<Version_Biomasse_Zielpfad>;
  block_chart: Array<Block_Chart>;
  block_chart_aggregated: Array<Block_Chart_Aggregated>;
  block_chart_by_id?: Maybe<Block_Chart>;
  block_chart_by_version?: Maybe<Version_Block_Chart>;
  block_chart_charts: Array<Block_Chart_Charts>;
  block_chart_charts_aggregated: Array<Block_Chart_Charts_Aggregated>;
  block_chart_charts_by_id?: Maybe<Block_Chart_Charts>;
  block_chart_charts_by_version?: Maybe<Version_Block_Chart_Charts>;
  block_donation: Array<Block_Donation>;
  block_donation_aggregated: Array<Block_Donation_Aggregated>;
  block_donation_by_id?: Maybe<Block_Donation>;
  block_donation_by_version?: Maybe<Version_Block_Donation>;
  block_donation_translations: Array<Block_Donation_Translations>;
  block_donation_translations_aggregated: Array<Block_Donation_Translations_Aggregated>;
  block_donation_translations_by_id?: Maybe<Block_Donation_Translations>;
  block_donation_translations_by_version?: Maybe<Version_Block_Donation_Translations>;
  block_gallery: Array<Block_Gallery>;
  block_gallery_aggregated: Array<Block_Gallery_Aggregated>;
  block_gallery_by_id?: Maybe<Block_Gallery>;
  block_gallery_by_version?: Maybe<Version_Block_Gallery>;
  block_gallery_files: Array<Block_Gallery_Files>;
  block_gallery_files_aggregated: Array<Block_Gallery_Files_Aggregated>;
  block_gallery_files_by_id?: Maybe<Block_Gallery_Files>;
  block_gallery_files_by_version?: Maybe<Version_Block_Gallery_Files>;
  block_grid: Array<Block_Grid>;
  block_grid_aggregated: Array<Block_Grid_Aggregated>;
  block_grid_blocks: Array<Block_Grid_Blocks>;
  block_grid_blocks_aggregated: Array<Block_Grid_Blocks_Aggregated>;
  block_grid_blocks_by_id?: Maybe<Block_Grid_Blocks>;
  block_grid_blocks_by_version?: Maybe<Version_Block_Grid_Blocks>;
  block_grid_by_id?: Maybe<Block_Grid>;
  block_grid_by_version?: Maybe<Version_Block_Grid>;
  block_items: Array<Block_Items>;
  block_items_aggregated: Array<Block_Items_Aggregated>;
  block_items_by_id?: Maybe<Block_Items>;
  block_items_by_version?: Maybe<Version_Block_Items>;
  block_items_translations: Array<Block_Items_Translations>;
  block_items_translations_aggregated: Array<Block_Items_Translations_Aggregated>;
  block_items_translations_by_id?: Maybe<Block_Items_Translations>;
  block_items_translations_by_version?: Maybe<Version_Block_Items_Translations>;
  block_news: Array<Block_News>;
  block_news_aggregated: Array<Block_News_Aggregated>;
  block_news_by_id?: Maybe<Block_News>;
  block_news_by_version?: Maybe<Version_Block_News>;
  block_panel: Array<Block_Panel>;
  block_panel_aggregated: Array<Block_Panel_Aggregated>;
  block_panel_by_id?: Maybe<Block_Panel>;
  block_panel_by_version?: Maybe<Version_Block_Panel>;
  block_panel_translations: Array<Block_Panel_Translations>;
  block_panel_translations_aggregated: Array<Block_Panel_Translations_Aggregated>;
  block_panel_translations_by_id?: Maybe<Block_Panel_Translations>;
  block_panel_translations_by_version?: Maybe<Version_Block_Panel_Translations>;
  block_quiz: Array<Block_Quiz>;
  block_quiz_aggregated: Array<Block_Quiz_Aggregated>;
  block_quiz_by_id?: Maybe<Block_Quiz>;
  block_quiz_by_version?: Maybe<Version_Block_Quiz>;
  block_quotes: Array<Block_Quotes>;
  block_quotes_aggregated: Array<Block_Quotes_Aggregated>;
  block_quotes_by_id?: Maybe<Block_Quotes>;
  block_quotes_by_version?: Maybe<Version_Block_Quotes>;
  block_richtext: Array<Block_Richtext>;
  block_richtext_aggregated: Array<Block_Richtext_Aggregated>;
  block_richtext_by_id?: Maybe<Block_Richtext>;
  block_richtext_by_version?: Maybe<Version_Block_Richtext>;
  block_richtext_translations: Array<Block_Richtext_Translations>;
  block_richtext_translations_aggregated: Array<Block_Richtext_Translations_Aggregated>;
  block_richtext_translations_by_id?: Maybe<Block_Richtext_Translations>;
  block_richtext_translations_by_version?: Maybe<Version_Block_Richtext_Translations>;
  block_teaser: Array<Block_Teaser>;
  block_teaser_aggregated: Array<Block_Teaser_Aggregated>;
  block_teaser_by_id?: Maybe<Block_Teaser>;
  block_teaser_by_version?: Maybe<Version_Block_Teaser>;
  block_teaser_translations: Array<Block_Teaser_Translations>;
  block_teaser_translations_aggregated: Array<Block_Teaser_Translations_Aggregated>;
  block_teaser_translations_by_id?: Maybe<Block_Teaser_Translations>;
  block_teaser_translations_by_version?: Maybe<Version_Block_Teaser_Translations>;
  block_toggle: Array<Block_Toggle>;
  block_toggle_aggregated: Array<Block_Toggle_Aggregated>;
  block_toggle_by_id?: Maybe<Block_Toggle>;
  block_toggle_by_version?: Maybe<Version_Block_Toggle>;
  block_toggle_translations: Array<Block_Toggle_Translations>;
  block_toggle_translations_aggregated: Array<Block_Toggle_Translations_Aggregated>;
  block_toggle_translations_by_id?: Maybe<Block_Toggle_Translations>;
  block_toggle_translations_by_version?: Maybe<Version_Block_Toggle_Translations>;
  carbon_prices: Array<Carbon_Prices>;
  carbon_prices_aggregated: Array<Carbon_Prices_Aggregated>;
  carbon_prices_by_id?: Maybe<Carbon_Prices>;
  carbon_prices_by_version?: Maybe<Version_Carbon_Prices>;
  charts: Array<Charts>;
  charts_aggregated: Array<Charts_Aggregated>;
  charts_by_id?: Maybe<Charts>;
  charts_by_version?: Maybe<Version_Charts>;
  charts_translations: Array<Charts_Translations>;
  charts_translations_aggregated: Array<Charts_Translations_Aggregated>;
  charts_translations_by_id?: Maybe<Charts_Translations>;
  charts_translations_by_version?: Maybe<Version_Charts_Translations>;
  companies: Array<Companies>;
  companies_aggregated: Array<Companies_Aggregated>;
  companies_by_id?: Maybe<Companies>;
  companies_by_version?: Maybe<Version_Companies>;
  companies_companies_sectors: Array<Companies_Companies_Sectors>;
  companies_companies_sectors_aggregated: Array<Companies_Companies_Sectors_Aggregated>;
  companies_companies_sectors_by_id?: Maybe<Companies_Companies_Sectors>;
  companies_companies_sectors_by_version?: Maybe<Version_Companies_Companies_Sectors>;
  companies_emissions: Array<Companies_Emissions>;
  companies_emissions_aggregated: Array<Companies_Emissions_Aggregated>;
  companies_emissions_by_id?: Maybe<Companies_Emissions>;
  companies_emissions_by_version?: Maybe<Version_Companies_Emissions>;
  companies_sectors: Array<Companies_Sectors>;
  companies_sectors_aggregated: Array<Companies_Sectors_Aggregated>;
  companies_sectors_by_id?: Maybe<Companies_Sectors>;
  companies_sectors_by_version?: Maybe<Version_Companies_Sectors>;
  countries: Array<Countries>;
  countries_aggregated: Array<Countries_Aggregated>;
  countries_by_id?: Maybe<Countries>;
  countries_by_version?: Maybe<Version_Countries>;
  datasets: Array<Datasets>;
  datasets_aggregated: Array<Datasets_Aggregated>;
  datasets_by_id?: Maybe<Datasets>;
  datasets_by_version?: Maybe<Version_Datasets>;
  de_dwd_data: Array<De_Dwd_Data>;
  de_dwd_data_aggregated: Array<De_Dwd_Data_Aggregated>;
  de_dwd_data_by_id?: Maybe<De_Dwd_Data>;
  de_dwd_data_by_version?: Maybe<Version_De_Dwd_Data>;
  de_dwd_stations: Array<De_Dwd_Stations>;
  de_dwd_stations_aggregated: Array<De_Dwd_Stations_Aggregated>;
  de_dwd_stations_by_id?: Maybe<De_Dwd_Stations>;
  de_dwd_stations_by_version?: Maybe<Version_De_Dwd_Stations>;
  ee_goals: Array<Ee_Goals>;
  ee_goals_aggregated: Array<Ee_Goals_Aggregated>;
  ee_goals_by_id?: Maybe<Ee_Goals>;
  ee_goals_by_version?: Maybe<Version_Ee_Goals>;
  ee_historisch: Array<Ee_Historisch>;
  ee_historisch_aggregated: Array<Ee_Historisch_Aggregated>;
  ee_historisch_by_id?: Maybe<Ee_Historisch>;
  ee_historisch_by_version?: Maybe<Version_Ee_Historisch>;
  ee_potentiale: Array<Ee_Potentiale>;
  ee_potentiale_aggregated: Array<Ee_Potentiale_Aggregated>;
  ee_potentiale_by_id?: Maybe<Ee_Potentiale>;
  ee_potentiale_by_version?: Maybe<Version_Ee_Potentiale>;
  ee_produktion: Array<Ee_Produktion>;
  ee_produktion_aggregated: Array<Ee_Produktion_Aggregated>;
  ee_produktion_by_id?: Maybe<Ee_Produktion>;
  ee_produktion_by_version?: Maybe<Version_Ee_Produktion>;
  ee_zielpfad: Array<Ee_Zielpfad>;
  ee_zielpfad_aggregated: Array<Ee_Zielpfad_Aggregated>;
  ee_zielpfad_by_id?: Maybe<Ee_Zielpfad>;
  ee_zielpfad_by_version?: Maybe<Version_Ee_Zielpfad>;
  emissions: Array<Emissions>;
  emissions_aggregated: Array<Emissions_Aggregated>;
  emissions_by_id?: Maybe<Emissions>;
  emissions_by_version?: Maybe<Version_Emissions>;
  energy: Array<Energy>;
  energy_aggregated: Array<Energy_Aggregated>;
  energy_by_id?: Maybe<Energy>;
  energy_by_version?: Maybe<Version_Energy>;
  energy_renewable_share: Array<Energy_Renewable_Share>;
  energy_renewable_share_aggregated: Array<Energy_Renewable_Share_Aggregated>;
  energy_renewable_share_by_id?: Maybe<Energy_Renewable_Share>;
  energy_renewable_share_by_version?: Maybe<Version_Energy_Renewable_Share>;
  erneuerbare_2030_scenarios: Array<Erneuerbare_2030_Scenarios>;
  erneuerbare_2030_scenarios_aggregated: Array<Erneuerbare_2030_Scenarios_Aggregated>;
  erneuerbare_2030_scenarios_by_id?: Maybe<Erneuerbare_2030_Scenarios>;
  erneuerbare_2030_scenarios_by_version?: Maybe<Version_Erneuerbare_2030_Scenarios>;
  gas_imports: Array<Gas_Imports>;
  gas_imports_aggregated: Array<Gas_Imports_Aggregated>;
  gas_imports_by_id?: Maybe<Gas_Imports>;
  gas_imports_by_version?: Maybe<Version_Gas_Imports>;
  global_co2_concentration: Array<Global_Co2_Concentration>;
  global_co2_concentration_aggregated: Array<Global_Co2_Concentration_Aggregated>;
  global_co2_concentration_by_id?: Maybe<Global_Co2_Concentration>;
  global_co2_concentration_by_version?: Maybe<Version_Global_Co2_Concentration>;
  glossary: Array<Glossary>;
  glossary_aggregated: Array<Glossary_Aggregated>;
  glossary_by_id?: Maybe<Glossary>;
  glossary_by_version?: Maybe<Version_Glossary>;
  glossary_translations: Array<Glossary_Translations>;
  glossary_translations_aggregated: Array<Glossary_Translations_Aggregated>;
  glossary_translations_by_id?: Maybe<Glossary_Translations>;
  glossary_translations_by_version?: Maybe<Version_Glossary_Translations>;
  languages: Array<Languages>;
  languages_aggregated: Array<Languages_Aggregated>;
  languages_by_id?: Maybe<Languages>;
  languages_by_version?: Maybe<Version_Languages>;
  mobility: Array<Mobility>;
  mobility_aggregated: Array<Mobility_Aggregated>;
  mobility_by_id?: Maybe<Mobility>;
  mobility_by_version?: Maybe<Version_Mobility>;
  mobility_cars: Array<Mobility_Cars>;
  mobility_cars_aggregated: Array<Mobility_Cars_Aggregated>;
  mobility_cars_by_id?: Maybe<Mobility_Cars>;
  mobility_cars_by_version?: Maybe<Version_Mobility_Cars>;
  news: Array<News>;
  news_aggregated: Array<News_Aggregated>;
  news_by_id?: Maybe<News>;
  news_by_version?: Maybe<Version_News>;
  news_translations: Array<News_Translations>;
  news_translations_aggregated: Array<News_Translations_Aggregated>;
  news_translations_by_id?: Maybe<News_Translations>;
  news_translations_by_version?: Maybe<Version_News_Translations>;
  pages: Array<Pages>;
  pages_aggregated: Array<Pages_Aggregated>;
  pages_blocks: Array<Pages_Blocks>;
  pages_blocks_aggregated: Array<Pages_Blocks_Aggregated>;
  pages_blocks_by_id?: Maybe<Pages_Blocks>;
  pages_blocks_by_version?: Maybe<Version_Pages_Blocks>;
  pages_by_id?: Maybe<Pages>;
  pages_by_version?: Maybe<Version_Pages>;
  pages_translations: Array<Pages_Translations>;
  pages_translations_aggregated: Array<Pages_Translations_Aggregated>;
  pages_translations_blocks: Array<Pages_Translations_Blocks>;
  pages_translations_blocks_aggregated: Array<Pages_Translations_Blocks_Aggregated>;
  pages_translations_blocks_by_id?: Maybe<Pages_Translations_Blocks>;
  pages_translations_blocks_by_version?: Maybe<Version_Pages_Translations_Blocks>;
  pages_translations_by_id?: Maybe<Pages_Translations>;
  pages_translations_by_version?: Maybe<Version_Pages_Translations>;
  policies: Array<Policies>;
  policies_aggregated: Array<Policies_Aggregated>;
  policies_attributes: Array<Policies_Attributes>;
  policies_attributes_aggregated: Array<Policies_Attributes_Aggregated>;
  policies_attributes_by_id?: Maybe<Policies_Attributes>;
  policies_attributes_by_version?: Maybe<Version_Policies_Attributes>;
  policies_attributes_translations: Array<Policies_Attributes_Translations>;
  policies_attributes_translations_aggregated: Array<Policies_Attributes_Translations_Aggregated>;
  policies_attributes_translations_by_id?: Maybe<Policies_Attributes_Translations>;
  policies_attributes_translations_by_version?: Maybe<Version_Policies_Attributes_Translations>;
  policies_by_id?: Maybe<Policies>;
  policies_by_version?: Maybe<Version_Policies>;
  policies_policies_attributes: Array<Policies_Policies_Attributes>;
  policies_policies_attributes_aggregated: Array<Policies_Policies_Attributes_Aggregated>;
  policies_policies_attributes_by_id?: Maybe<Policies_Policies_Attributes>;
  policies_policies_attributes_by_version?: Maybe<Version_Policies_Policies_Attributes>;
  policies_stakeholders: Array<Policies_Stakeholders>;
  policies_stakeholders_aggregated: Array<Policies_Stakeholders_Aggregated>;
  policies_stakeholders_by_id?: Maybe<Policies_Stakeholders>;
  policies_stakeholders_by_version?: Maybe<Version_Policies_Stakeholders>;
  policies_status: Array<Policies_Status>;
  policies_status_aggregated: Array<Policies_Status_Aggregated>;
  policies_status_by_id?: Maybe<Policies_Status>;
  policies_status_by_version?: Maybe<Version_Policies_Status>;
  policies_status_translations: Array<Policies_Status_Translations>;
  policies_status_translations_aggregated: Array<Policies_Status_Translations_Aggregated>;
  policies_status_translations_by_id?: Maybe<Policies_Status_Translations>;
  policies_status_translations_by_version?: Maybe<Version_Policies_Status_Translations>;
  policies_translations: Array<Policies_Translations>;
  policies_translations_aggregated: Array<Policies_Translations_Aggregated>;
  policies_translations_by_id?: Maybe<Policies_Translations>;
  policies_translations_by_version?: Maybe<Version_Policies_Translations>;
  policies_updates: Array<Policies_Updates>;
  policies_updates_aggregated: Array<Policies_Updates_Aggregated>;
  policies_updates_by_id?: Maybe<Policies_Updates>;
  policies_updates_by_version?: Maybe<Version_Policies_Updates>;
  policies_updates_translations: Array<Policies_Updates_Translations>;
  policies_updates_translations_aggregated: Array<Policies_Updates_Translations_Aggregated>;
  policies_updates_translations_by_id?: Maybe<Policies_Updates_Translations>;
  policies_updates_translations_by_version?: Maybe<Version_Policies_Updates_Translations>;
  pv_produktion: Array<Pv_Produktion>;
  pv_produktion_aggregated: Array<Pv_Produktion_Aggregated>;
  pv_produktion_by_id?: Maybe<Pv_Produktion>;
  pv_produktion_by_version?: Maybe<Version_Pv_Produktion>;
  pv_zielpfad: Array<Pv_Zielpfad>;
  pv_zielpfad_aggregated: Array<Pv_Zielpfad_Aggregated>;
  pv_zielpfad_by_id?: Maybe<Pv_Zielpfad>;
  pv_zielpfad_by_version?: Maybe<Version_Pv_Zielpfad>;
  quiz_answers: Array<Quiz_Answers>;
  quiz_answers_aggregated: Array<Quiz_Answers_Aggregated>;
  quiz_answers_by_id?: Maybe<Quiz_Answers>;
  quiz_answers_by_version?: Maybe<Version_Quiz_Answers>;
  quiz_questions: Array<Quiz_Questions>;
  quiz_questions_aggregated: Array<Quiz_Questions_Aggregated>;
  quiz_questions_by_id?: Maybe<Quiz_Questions>;
  quiz_questions_by_version?: Maybe<Version_Quiz_Questions>;
  quotes: Array<Quotes>;
  quotes_aggregated: Array<Quotes_Aggregated>;
  quotes_by_id?: Maybe<Quotes>;
  quotes_by_version?: Maybe<Version_Quotes>;
  regions: Array<Regions>;
  regions_aggregated: Array<Regions_Aggregated>;
  regions_by_id?: Maybe<Regions>;
  regions_by_version?: Maybe<Version_Regions>;
  renewable_share_15min: Array<Renewable_Share_15min>;
  renewable_share_15min_aggregated: Array<Renewable_Share_15min_Aggregated>;
  renewable_share_15min_by_id?: Maybe<Renewable_Share_15min>;
  renewable_share_15min_by_version?: Maybe<Version_Renewable_Share_15min>;
  renewable_share_daily: Array<Renewable_Share_Daily>;
  renewable_share_daily_aggregated: Array<Renewable_Share_Daily_Aggregated>;
  renewable_share_daily_by_id?: Maybe<Renewable_Share_Daily>;
  renewable_share_daily_by_version?: Maybe<Version_Renewable_Share_Daily>;
  seo: Array<Seo>;
  seo_aggregated: Array<Seo_Aggregated>;
  seo_by_id?: Maybe<Seo>;
  seo_by_version?: Maybe<Version_Seo>;
  sites: Array<Sites>;
  sites_aggregated: Array<Sites_Aggregated>;
  sites_by_id?: Maybe<Sites>;
  sites_by_version?: Maybe<Version_Sites>;
  sites_translations: Array<Sites_Translations>;
  sites_translations_aggregated: Array<Sites_Translations_Aggregated>;
  sites_translations_by_id?: Maybe<Sites_Translations>;
  sites_translations_by_version?: Maybe<Version_Sites_Translations>;
  stakeholders: Array<Stakeholders>;
  stakeholders_aggregated: Array<Stakeholders_Aggregated>;
  stakeholders_by_id?: Maybe<Stakeholders>;
  stakeholders_by_version?: Maybe<Version_Stakeholders>;
  wasserkraft_produktion: Array<Wasserkraft_Produktion>;
  wasserkraft_produktion_aggregated: Array<Wasserkraft_Produktion_Aggregated>;
  wasserkraft_produktion_by_id?: Maybe<Wasserkraft_Produktion>;
  wasserkraft_produktion_by_version?: Maybe<Version_Wasserkraft_Produktion>;
  wasserkraft_zielpfad: Array<Wasserkraft_Zielpfad>;
  wasserkraft_zielpfad_aggregated: Array<Wasserkraft_Zielpfad_Aggregated>;
  wasserkraft_zielpfad_by_id?: Maybe<Wasserkraft_Zielpfad>;
  wasserkraft_zielpfad_by_version?: Maybe<Version_Wasserkraft_Zielpfad>;
  windkraft_produktion: Array<Windkraft_Produktion>;
  windkraft_produktion_aggregated: Array<Windkraft_Produktion_Aggregated>;
  windkraft_produktion_by_id?: Maybe<Windkraft_Produktion>;
  windkraft_produktion_by_version?: Maybe<Version_Windkraft_Produktion>;
  windkraft_zielpfad: Array<Windkraft_Zielpfad>;
  windkraft_zielpfad_aggregated: Array<Windkraft_Zielpfad_Aggregated>;
  windkraft_zielpfad_by_id?: Maybe<Windkraft_Zielpfad>;
  windkraft_zielpfad_by_version?: Maybe<Version_Windkraft_Zielpfad>;
};


export type QueryAt_Geosphere_DataArgs = {
  filter?: InputMaybe<At_Geosphere_Data_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAt_Geosphere_Data_AggregatedArgs = {
  filter?: InputMaybe<At_Geosphere_Data_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAt_Geosphere_Data_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAt_Geosphere_Data_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryAt_Geosphere_StationsArgs = {
  filter?: InputMaybe<At_Geosphere_Stations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAt_Geosphere_Stations_AggregatedArgs = {
  filter?: InputMaybe<At_Geosphere_Stations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAt_Geosphere_Stations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAt_Geosphere_Stations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBiomasse_ProduktionArgs = {
  filter?: InputMaybe<Biomasse_Produktion_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBiomasse_Produktion_AggregatedArgs = {
  filter?: InputMaybe<Biomasse_Produktion_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBiomasse_Produktion_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBiomasse_Produktion_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBiomasse_ZielpfadArgs = {
  filter?: InputMaybe<Biomasse_Zielpfad_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBiomasse_Zielpfad_AggregatedArgs = {
  filter?: InputMaybe<Biomasse_Zielpfad_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBiomasse_Zielpfad_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBiomasse_Zielpfad_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_ChartArgs = {
  filter?: InputMaybe<Block_Chart_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Chart_AggregatedArgs = {
  filter?: InputMaybe<Block_Chart_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Chart_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Chart_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Chart_ChartsArgs = {
  filter?: InputMaybe<Block_Chart_Charts_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Chart_Charts_AggregatedArgs = {
  filter?: InputMaybe<Block_Chart_Charts_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Chart_Charts_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Chart_Charts_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_DonationArgs = {
  filter?: InputMaybe<Block_Donation_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Donation_AggregatedArgs = {
  filter?: InputMaybe<Block_Donation_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Donation_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Donation_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Donation_TranslationsArgs = {
  filter?: InputMaybe<Block_Donation_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Donation_Translations_AggregatedArgs = {
  filter?: InputMaybe<Block_Donation_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Donation_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Donation_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_GalleryArgs = {
  filter?: InputMaybe<Block_Gallery_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Gallery_AggregatedArgs = {
  filter?: InputMaybe<Block_Gallery_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Gallery_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Gallery_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Gallery_FilesArgs = {
  filter?: InputMaybe<Block_Gallery_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Gallery_Files_AggregatedArgs = {
  filter?: InputMaybe<Block_Gallery_Files_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Gallery_Files_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Gallery_Files_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_GridArgs = {
  filter?: InputMaybe<Block_Grid_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Grid_AggregatedArgs = {
  filter?: InputMaybe<Block_Grid_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Grid_BlocksArgs = {
  filter?: InputMaybe<Block_Grid_Blocks_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Grid_Blocks_AggregatedArgs = {
  filter?: InputMaybe<Block_Grid_Blocks_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Grid_Blocks_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Grid_Blocks_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Grid_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Grid_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_ItemsArgs = {
  filter?: InputMaybe<Block_Items_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Items_AggregatedArgs = {
  filter?: InputMaybe<Block_Items_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Items_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Items_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Items_TranslationsArgs = {
  filter?: InputMaybe<Block_Items_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Items_Translations_AggregatedArgs = {
  filter?: InputMaybe<Block_Items_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Items_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Items_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_NewsArgs = {
  filter?: InputMaybe<Block_News_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_News_AggregatedArgs = {
  filter?: InputMaybe<Block_News_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_News_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_News_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_PanelArgs = {
  filter?: InputMaybe<Block_Panel_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Panel_AggregatedArgs = {
  filter?: InputMaybe<Block_Panel_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Panel_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Panel_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Panel_TranslationsArgs = {
  filter?: InputMaybe<Block_Panel_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Panel_Translations_AggregatedArgs = {
  filter?: InputMaybe<Block_Panel_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Panel_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Panel_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_QuizArgs = {
  filter?: InputMaybe<Block_Quiz_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Quiz_AggregatedArgs = {
  filter?: InputMaybe<Block_Quiz_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Quiz_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Quiz_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_QuotesArgs = {
  filter?: InputMaybe<Block_Quotes_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Quotes_AggregatedArgs = {
  filter?: InputMaybe<Block_Quotes_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Quotes_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Quotes_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_RichtextArgs = {
  filter?: InputMaybe<Block_Richtext_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Richtext_AggregatedArgs = {
  filter?: InputMaybe<Block_Richtext_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Richtext_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Richtext_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Richtext_TranslationsArgs = {
  filter?: InputMaybe<Block_Richtext_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Richtext_Translations_AggregatedArgs = {
  filter?: InputMaybe<Block_Richtext_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Richtext_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Richtext_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_TeaserArgs = {
  filter?: InputMaybe<Block_Teaser_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Teaser_AggregatedArgs = {
  filter?: InputMaybe<Block_Teaser_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Teaser_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Teaser_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Teaser_TranslationsArgs = {
  filter?: InputMaybe<Block_Teaser_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Teaser_Translations_AggregatedArgs = {
  filter?: InputMaybe<Block_Teaser_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Teaser_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Teaser_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_ToggleArgs = {
  filter?: InputMaybe<Block_Toggle_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Toggle_AggregatedArgs = {
  filter?: InputMaybe<Block_Toggle_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Toggle_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Toggle_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryBlock_Toggle_TranslationsArgs = {
  filter?: InputMaybe<Block_Toggle_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Toggle_Translations_AggregatedArgs = {
  filter?: InputMaybe<Block_Toggle_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryBlock_Toggle_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlock_Toggle_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCarbon_PricesArgs = {
  filter?: InputMaybe<Carbon_Prices_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCarbon_Prices_AggregatedArgs = {
  filter?: InputMaybe<Carbon_Prices_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCarbon_Prices_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCarbon_Prices_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryChartsArgs = {
  filter?: InputMaybe<Charts_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCharts_AggregatedArgs = {
  filter?: InputMaybe<Charts_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCharts_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCharts_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCharts_TranslationsArgs = {
  filter?: InputMaybe<Charts_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCharts_Translations_AggregatedArgs = {
  filter?: InputMaybe<Charts_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCharts_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCharts_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCompaniesArgs = {
  filter?: InputMaybe<Companies_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_AggregatedArgs = {
  filter?: InputMaybe<Companies_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCompanies_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCompanies_Companies_SectorsArgs = {
  filter?: InputMaybe<Companies_Companies_Sectors_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_Companies_Sectors_AggregatedArgs = {
  filter?: InputMaybe<Companies_Companies_Sectors_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_Companies_Sectors_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCompanies_Companies_Sectors_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCompanies_EmissionsArgs = {
  filter?: InputMaybe<Companies_Emissions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_Emissions_AggregatedArgs = {
  filter?: InputMaybe<Companies_Emissions_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_Emissions_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCompanies_Emissions_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCompanies_SectorsArgs = {
  filter?: InputMaybe<Companies_Sectors_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_Sectors_AggregatedArgs = {
  filter?: InputMaybe<Companies_Sectors_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCompanies_Sectors_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCompanies_Sectors_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCountriesArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCountries_AggregatedArgs = {
  filter?: InputMaybe<Countries_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCountries_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCountries_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryDatasetsArgs = {
  filter?: InputMaybe<Datasets_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDatasets_AggregatedArgs = {
  filter?: InputMaybe<Datasets_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDatasets_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDatasets_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryDe_Dwd_DataArgs = {
  filter?: InputMaybe<De_Dwd_Data_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDe_Dwd_Data_AggregatedArgs = {
  filter?: InputMaybe<De_Dwd_Data_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDe_Dwd_Data_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDe_Dwd_Data_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryDe_Dwd_StationsArgs = {
  filter?: InputMaybe<De_Dwd_Stations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDe_Dwd_Stations_AggregatedArgs = {
  filter?: InputMaybe<De_Dwd_Stations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryDe_Dwd_Stations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDe_Dwd_Stations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEe_GoalsArgs = {
  filter?: InputMaybe<Ee_Goals_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Goals_AggregatedArgs = {
  filter?: InputMaybe<Ee_Goals_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Goals_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEe_Goals_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEe_HistorischArgs = {
  filter?: InputMaybe<Ee_Historisch_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Historisch_AggregatedArgs = {
  filter?: InputMaybe<Ee_Historisch_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Historisch_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEe_Historisch_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEe_PotentialeArgs = {
  filter?: InputMaybe<Ee_Potentiale_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Potentiale_AggregatedArgs = {
  filter?: InputMaybe<Ee_Potentiale_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Potentiale_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEe_Potentiale_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEe_ProduktionArgs = {
  filter?: InputMaybe<Ee_Produktion_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Produktion_AggregatedArgs = {
  filter?: InputMaybe<Ee_Produktion_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Produktion_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEe_Produktion_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEe_ZielpfadArgs = {
  filter?: InputMaybe<Ee_Zielpfad_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Zielpfad_AggregatedArgs = {
  filter?: InputMaybe<Ee_Zielpfad_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEe_Zielpfad_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEe_Zielpfad_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEmissionsArgs = {
  filter?: InputMaybe<Emissions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEmissions_AggregatedArgs = {
  filter?: InputMaybe<Emissions_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEmissions_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEmissions_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEnergyArgs = {
  filter?: InputMaybe<Energy_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEnergy_AggregatedArgs = {
  filter?: InputMaybe<Energy_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEnergy_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEnergy_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEnergy_Renewable_ShareArgs = {
  filter?: InputMaybe<Energy_Renewable_Share_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEnergy_Renewable_Share_AggregatedArgs = {
  filter?: InputMaybe<Energy_Renewable_Share_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEnergy_Renewable_Share_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEnergy_Renewable_Share_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryErneuerbare_2030_ScenariosArgs = {
  filter?: InputMaybe<Erneuerbare_2030_Scenarios_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryErneuerbare_2030_Scenarios_AggregatedArgs = {
  filter?: InputMaybe<Erneuerbare_2030_Scenarios_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryErneuerbare_2030_Scenarios_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryErneuerbare_2030_Scenarios_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryGas_ImportsArgs = {
  filter?: InputMaybe<Gas_Imports_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGas_Imports_AggregatedArgs = {
  filter?: InputMaybe<Gas_Imports_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGas_Imports_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGas_Imports_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryGlobal_Co2_ConcentrationArgs = {
  filter?: InputMaybe<Global_Co2_Concentration_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGlobal_Co2_Concentration_AggregatedArgs = {
  filter?: InputMaybe<Global_Co2_Concentration_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGlobal_Co2_Concentration_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGlobal_Co2_Concentration_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryGlossaryArgs = {
  filter?: InputMaybe<Glossary_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGlossary_AggregatedArgs = {
  filter?: InputMaybe<Glossary_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGlossary_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGlossary_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryGlossary_TranslationsArgs = {
  filter?: InputMaybe<Glossary_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGlossary_Translations_AggregatedArgs = {
  filter?: InputMaybe<Glossary_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryGlossary_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGlossary_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryLanguagesArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryLanguages_AggregatedArgs = {
  filter?: InputMaybe<Languages_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryLanguages_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLanguages_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryMobilityArgs = {
  filter?: InputMaybe<Mobility_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMobility_AggregatedArgs = {
  filter?: InputMaybe<Mobility_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMobility_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMobility_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryMobility_CarsArgs = {
  filter?: InputMaybe<Mobility_Cars_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMobility_Cars_AggregatedArgs = {
  filter?: InputMaybe<Mobility_Cars_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMobility_Cars_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMobility_Cars_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryNewsArgs = {
  filter?: InputMaybe<News_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNews_AggregatedArgs = {
  filter?: InputMaybe<News_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNews_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNews_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryNews_TranslationsArgs = {
  filter?: InputMaybe<News_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNews_Translations_AggregatedArgs = {
  filter?: InputMaybe<News_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryNews_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNews_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPagesArgs = {
  filter?: InputMaybe<Pages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_AggregatedArgs = {
  filter?: InputMaybe<Pages_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_BlocksArgs = {
  filter?: InputMaybe<Pages_Blocks_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_Blocks_AggregatedArgs = {
  filter?: InputMaybe<Pages_Blocks_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_Blocks_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPages_Blocks_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPages_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPages_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPages_TranslationsArgs = {
  filter?: InputMaybe<Pages_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_Translations_AggregatedArgs = {
  filter?: InputMaybe<Pages_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_Translations_BlocksArgs = {
  filter?: InputMaybe<Pages_Translations_Blocks_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_Translations_Blocks_AggregatedArgs = {
  filter?: InputMaybe<Pages_Translations_Blocks_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPages_Translations_Blocks_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPages_Translations_Blocks_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPages_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPages_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPoliciesArgs = {
  filter?: InputMaybe<Policies_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_AggregatedArgs = {
  filter?: InputMaybe<Policies_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_AttributesArgs = {
  filter?: InputMaybe<Policies_Attributes_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Attributes_AggregatedArgs = {
  filter?: InputMaybe<Policies_Attributes_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Attributes_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Attributes_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_Attributes_TranslationsArgs = {
  filter?: InputMaybe<Policies_Attributes_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Attributes_Translations_AggregatedArgs = {
  filter?: InputMaybe<Policies_Attributes_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Attributes_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Attributes_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_Policies_AttributesArgs = {
  filter?: InputMaybe<Policies_Policies_Attributes_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Policies_Attributes_AggregatedArgs = {
  filter?: InputMaybe<Policies_Policies_Attributes_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Policies_Attributes_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Policies_Attributes_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_StakeholdersArgs = {
  filter?: InputMaybe<Policies_Stakeholders_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Stakeholders_AggregatedArgs = {
  filter?: InputMaybe<Policies_Stakeholders_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Stakeholders_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Stakeholders_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_StatusArgs = {
  filter?: InputMaybe<Policies_Status_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Status_AggregatedArgs = {
  filter?: InputMaybe<Policies_Status_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Status_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Status_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_Status_TranslationsArgs = {
  filter?: InputMaybe<Policies_Status_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Status_Translations_AggregatedArgs = {
  filter?: InputMaybe<Policies_Status_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Status_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Status_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_TranslationsArgs = {
  filter?: InputMaybe<Policies_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Translations_AggregatedArgs = {
  filter?: InputMaybe<Policies_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_UpdatesArgs = {
  filter?: InputMaybe<Policies_Updates_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Updates_AggregatedArgs = {
  filter?: InputMaybe<Policies_Updates_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Updates_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Updates_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPolicies_Updates_TranslationsArgs = {
  filter?: InputMaybe<Policies_Updates_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Updates_Translations_AggregatedArgs = {
  filter?: InputMaybe<Policies_Updates_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPolicies_Updates_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPolicies_Updates_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPv_ProduktionArgs = {
  filter?: InputMaybe<Pv_Produktion_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPv_Produktion_AggregatedArgs = {
  filter?: InputMaybe<Pv_Produktion_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPv_Produktion_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPv_Produktion_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryPv_ZielpfadArgs = {
  filter?: InputMaybe<Pv_Zielpfad_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPv_Zielpfad_AggregatedArgs = {
  filter?: InputMaybe<Pv_Zielpfad_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPv_Zielpfad_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPv_Zielpfad_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryQuiz_AnswersArgs = {
  filter?: InputMaybe<Quiz_Answers_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryQuiz_Answers_AggregatedArgs = {
  filter?: InputMaybe<Quiz_Answers_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryQuiz_Answers_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryQuiz_Answers_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryQuiz_QuestionsArgs = {
  filter?: InputMaybe<Quiz_Questions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryQuiz_Questions_AggregatedArgs = {
  filter?: InputMaybe<Quiz_Questions_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryQuiz_Questions_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryQuiz_Questions_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryQuotesArgs = {
  filter?: InputMaybe<Quotes_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryQuotes_AggregatedArgs = {
  filter?: InputMaybe<Quotes_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryQuotes_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryQuotes_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryRegionsArgs = {
  filter?: InputMaybe<Regions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRegions_AggregatedArgs = {
  filter?: InputMaybe<Regions_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRegions_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRegions_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryRenewable_Share_15minArgs = {
  filter?: InputMaybe<Renewable_Share_15min_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRenewable_Share_15min_AggregatedArgs = {
  filter?: InputMaybe<Renewable_Share_15min_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRenewable_Share_15min_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRenewable_Share_15min_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryRenewable_Share_DailyArgs = {
  filter?: InputMaybe<Renewable_Share_Daily_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRenewable_Share_Daily_AggregatedArgs = {
  filter?: InputMaybe<Renewable_Share_Daily_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryRenewable_Share_Daily_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRenewable_Share_Daily_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QuerySeoArgs = {
  filter?: InputMaybe<Seo_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySeo_AggregatedArgs = {
  filter?: InputMaybe<Seo_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySeo_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySeo_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QuerySitesArgs = {
  filter?: InputMaybe<Sites_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySites_AggregatedArgs = {
  filter?: InputMaybe<Sites_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySites_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySites_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QuerySites_TranslationsArgs = {
  filter?: InputMaybe<Sites_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySites_Translations_AggregatedArgs = {
  filter?: InputMaybe<Sites_Translations_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySites_Translations_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySites_Translations_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryStakeholdersArgs = {
  filter?: InputMaybe<Stakeholders_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryStakeholders_AggregatedArgs = {
  filter?: InputMaybe<Stakeholders_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryStakeholders_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryStakeholders_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryWasserkraft_ProduktionArgs = {
  filter?: InputMaybe<Wasserkraft_Produktion_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWasserkraft_Produktion_AggregatedArgs = {
  filter?: InputMaybe<Wasserkraft_Produktion_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWasserkraft_Produktion_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWasserkraft_Produktion_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryWasserkraft_ZielpfadArgs = {
  filter?: InputMaybe<Wasserkraft_Zielpfad_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWasserkraft_Zielpfad_AggregatedArgs = {
  filter?: InputMaybe<Wasserkraft_Zielpfad_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWasserkraft_Zielpfad_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWasserkraft_Zielpfad_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryWindkraft_ProduktionArgs = {
  filter?: InputMaybe<Windkraft_Produktion_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWindkraft_Produktion_AggregatedArgs = {
  filter?: InputMaybe<Windkraft_Produktion_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWindkraft_Produktion_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWindkraft_Produktion_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryWindkraft_ZielpfadArgs = {
  filter?: InputMaybe<Windkraft_Zielpfad_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWindkraft_Zielpfad_AggregatedArgs = {
  filter?: InputMaybe<Windkraft_Zielpfad_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryWindkraft_Zielpfad_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWindkraft_Zielpfad_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  at_geosphere_data_mutated?: Maybe<At_Geosphere_Data_Mutated>;
  at_geosphere_stations_mutated?: Maybe<At_Geosphere_Stations_Mutated>;
  biomasse_produktion_mutated?: Maybe<Biomasse_Produktion_Mutated>;
  biomasse_zielpfad_mutated?: Maybe<Biomasse_Zielpfad_Mutated>;
  block_chart_charts_mutated?: Maybe<Block_Chart_Charts_Mutated>;
  block_chart_mutated?: Maybe<Block_Chart_Mutated>;
  block_donation_mutated?: Maybe<Block_Donation_Mutated>;
  block_donation_translations_mutated?: Maybe<Block_Donation_Translations_Mutated>;
  block_gallery_files_mutated?: Maybe<Block_Gallery_Files_Mutated>;
  block_gallery_mutated?: Maybe<Block_Gallery_Mutated>;
  block_grid_blocks_mutated?: Maybe<Block_Grid_Blocks_Mutated>;
  block_grid_mutated?: Maybe<Block_Grid_Mutated>;
  block_items_mutated?: Maybe<Block_Items_Mutated>;
  block_items_translations_mutated?: Maybe<Block_Items_Translations_Mutated>;
  block_news_mutated?: Maybe<Block_News_Mutated>;
  block_panel_mutated?: Maybe<Block_Panel_Mutated>;
  block_panel_translations_mutated?: Maybe<Block_Panel_Translations_Mutated>;
  block_quiz_mutated?: Maybe<Block_Quiz_Mutated>;
  block_quotes_mutated?: Maybe<Block_Quotes_Mutated>;
  block_richtext_mutated?: Maybe<Block_Richtext_Mutated>;
  block_richtext_translations_mutated?: Maybe<Block_Richtext_Translations_Mutated>;
  block_teaser_mutated?: Maybe<Block_Teaser_Mutated>;
  block_teaser_translations_mutated?: Maybe<Block_Teaser_Translations_Mutated>;
  block_toggle_mutated?: Maybe<Block_Toggle_Mutated>;
  block_toggle_translations_mutated?: Maybe<Block_Toggle_Translations_Mutated>;
  carbon_prices_mutated?: Maybe<Carbon_Prices_Mutated>;
  charts_mutated?: Maybe<Charts_Mutated>;
  charts_translations_mutated?: Maybe<Charts_Translations_Mutated>;
  companies_companies_sectors_mutated?: Maybe<Companies_Companies_Sectors_Mutated>;
  companies_emissions_mutated?: Maybe<Companies_Emissions_Mutated>;
  companies_mutated?: Maybe<Companies_Mutated>;
  companies_sectors_mutated?: Maybe<Companies_Sectors_Mutated>;
  countries_mutated?: Maybe<Countries_Mutated>;
  datasets_mutated?: Maybe<Datasets_Mutated>;
  de_dwd_data_mutated?: Maybe<De_Dwd_Data_Mutated>;
  de_dwd_stations_mutated?: Maybe<De_Dwd_Stations_Mutated>;
  directus_files_mutated?: Maybe<Directus_Files_Mutated>;
  directus_presets_mutated?: Maybe<Directus_Presets_Mutated>;
  directus_translations_mutated?: Maybe<Directus_Translations_Mutated>;
  directus_users_mutated?: Maybe<Directus_Users_Mutated>;
  ee_goals_mutated?: Maybe<Ee_Goals_Mutated>;
  ee_historisch_mutated?: Maybe<Ee_Historisch_Mutated>;
  ee_potentiale_mutated?: Maybe<Ee_Potentiale_Mutated>;
  ee_produktion_mutated?: Maybe<Ee_Produktion_Mutated>;
  ee_zielpfad_mutated?: Maybe<Ee_Zielpfad_Mutated>;
  emissions_mutated?: Maybe<Emissions_Mutated>;
  energy_mutated?: Maybe<Energy_Mutated>;
  energy_renewable_share_mutated?: Maybe<Energy_Renewable_Share_Mutated>;
  erneuerbare_2030_scenarios_mutated?: Maybe<Erneuerbare_2030_Scenarios_Mutated>;
  gas_imports_mutated?: Maybe<Gas_Imports_Mutated>;
  global_co2_concentration_mutated?: Maybe<Global_Co2_Concentration_Mutated>;
  glossary_mutated?: Maybe<Glossary_Mutated>;
  glossary_translations_mutated?: Maybe<Glossary_Translations_Mutated>;
  languages_mutated?: Maybe<Languages_Mutated>;
  mobility_cars_mutated?: Maybe<Mobility_Cars_Mutated>;
  mobility_mutated?: Maybe<Mobility_Mutated>;
  news_mutated?: Maybe<News_Mutated>;
  news_translations_mutated?: Maybe<News_Translations_Mutated>;
  pages_blocks_mutated?: Maybe<Pages_Blocks_Mutated>;
  pages_mutated?: Maybe<Pages_Mutated>;
  pages_translations_blocks_mutated?: Maybe<Pages_Translations_Blocks_Mutated>;
  pages_translations_mutated?: Maybe<Pages_Translations_Mutated>;
  policies_attributes_mutated?: Maybe<Policies_Attributes_Mutated>;
  policies_attributes_translations_mutated?: Maybe<Policies_Attributes_Translations_Mutated>;
  policies_mutated?: Maybe<Policies_Mutated>;
  policies_policies_attributes_mutated?: Maybe<Policies_Policies_Attributes_Mutated>;
  policies_stakeholders_mutated?: Maybe<Policies_Stakeholders_Mutated>;
  policies_status_mutated?: Maybe<Policies_Status_Mutated>;
  policies_status_translations_mutated?: Maybe<Policies_Status_Translations_Mutated>;
  policies_translations_mutated?: Maybe<Policies_Translations_Mutated>;
  policies_updates_mutated?: Maybe<Policies_Updates_Mutated>;
  policies_updates_translations_mutated?: Maybe<Policies_Updates_Translations_Mutated>;
  pv_produktion_mutated?: Maybe<Pv_Produktion_Mutated>;
  pv_zielpfad_mutated?: Maybe<Pv_Zielpfad_Mutated>;
  quiz_answers_mutated?: Maybe<Quiz_Answers_Mutated>;
  quiz_questions_mutated?: Maybe<Quiz_Questions_Mutated>;
  quotes_mutated?: Maybe<Quotes_Mutated>;
  regions_mutated?: Maybe<Regions_Mutated>;
  renewable_share_15min_mutated?: Maybe<Renewable_Share_15min_Mutated>;
  renewable_share_daily_mutated?: Maybe<Renewable_Share_Daily_Mutated>;
  seo_mutated?: Maybe<Seo_Mutated>;
  sites_mutated?: Maybe<Sites_Mutated>;
  sites_translations_mutated?: Maybe<Sites_Translations_Mutated>;
  stakeholders_mutated?: Maybe<Stakeholders_Mutated>;
  wasserkraft_produktion_mutated?: Maybe<Wasserkraft_Produktion_Mutated>;
  wasserkraft_zielpfad_mutated?: Maybe<Wasserkraft_Zielpfad_Mutated>;
  windkraft_produktion_mutated?: Maybe<Windkraft_Produktion_Mutated>;
  windkraft_zielpfad_mutated?: Maybe<Windkraft_Zielpfad_Mutated>;
};


export type SubscriptionAt_Geosphere_Data_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionAt_Geosphere_Stations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBiomasse_Produktion_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBiomasse_Zielpfad_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Chart_Charts_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Chart_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Donation_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Donation_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Gallery_Files_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Gallery_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Grid_Blocks_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Grid_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Items_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Items_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_News_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Panel_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Panel_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Quiz_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Quotes_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Richtext_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Richtext_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Teaser_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Teaser_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Toggle_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionBlock_Toggle_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCarbon_Prices_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCharts_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCharts_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCompanies_Companies_Sectors_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCompanies_Emissions_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCompanies_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCompanies_Sectors_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCountries_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDatasets_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDe_Dwd_Data_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDe_Dwd_Stations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDirectus_Files_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDirectus_Presets_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDirectus_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDirectus_Users_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEe_Goals_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEe_Historisch_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEe_Potentiale_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEe_Produktion_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEe_Zielpfad_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEmissions_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEnergy_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEnergy_Renewable_Share_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionErneuerbare_2030_Scenarios_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionGas_Imports_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionGlobal_Co2_Concentration_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionGlossary_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionGlossary_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionLanguages_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionMobility_Cars_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionMobility_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionNews_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionNews_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPages_Blocks_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPages_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPages_Translations_Blocks_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPages_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Attributes_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Attributes_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Policies_Attributes_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Stakeholders_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Status_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Status_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Updates_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPolicies_Updates_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPv_Produktion_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionPv_Zielpfad_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionQuiz_Answers_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionQuiz_Questions_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionQuotes_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionRegions_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionRenewable_Share_15min_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionRenewable_Share_Daily_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionSeo_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionSites_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionSites_Translations_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionStakeholders_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionWasserkraft_Produktion_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionWasserkraft_Zielpfad_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionWindkraft_Produktion_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionWindkraft_Zielpfad_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};

export type At_Geosphere_Data = {
  __typename?: 'at_geosphere_data';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  sh?: Maybe<Scalars['Float']['output']>;
  station?: Maybe<At_Geosphere_Stations>;
  tl_mittel?: Maybe<Scalars['Float']['output']>;
  tlmax?: Maybe<Scalars['Float']['output']>;
  tlmin?: Maybe<Scalars['Float']['output']>;
};


export type At_Geosphere_DataStationArgs = {
  filter?: InputMaybe<At_Geosphere_Stations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type At_Geosphere_Data_Aggregated = {
  __typename?: 'at_geosphere_data_aggregated';
  avg?: Maybe<At_Geosphere_Data_Aggregated_Fields>;
  avgDistinct?: Maybe<At_Geosphere_Data_Aggregated_Fields>;
  count?: Maybe<At_Geosphere_Data_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<At_Geosphere_Data_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<At_Geosphere_Data_Aggregated_Fields>;
  min?: Maybe<At_Geosphere_Data_Aggregated_Fields>;
  sum?: Maybe<At_Geosphere_Data_Aggregated_Fields>;
  sumDistinct?: Maybe<At_Geosphere_Data_Aggregated_Fields>;
};

export type At_Geosphere_Data_Aggregated_Count = {
  __typename?: 'at_geosphere_data_aggregated_count';
  date?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  sh?: Maybe<Scalars['Int']['output']>;
  station?: Maybe<Scalars['Int']['output']>;
  tl_mittel?: Maybe<Scalars['Int']['output']>;
  tlmax?: Maybe<Scalars['Int']['output']>;
  tlmin?: Maybe<Scalars['Int']['output']>;
};

export type At_Geosphere_Data_Aggregated_Fields = {
  __typename?: 'at_geosphere_data_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  sh?: Maybe<Scalars['Float']['output']>;
  tl_mittel?: Maybe<Scalars['Float']['output']>;
  tlmax?: Maybe<Scalars['Float']['output']>;
  tlmin?: Maybe<Scalars['Float']['output']>;
};

export type At_Geosphere_Data_Filter = {
  _and?: InputMaybe<Array<InputMaybe<At_Geosphere_Data_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<At_Geosphere_Data_Filter>>>;
  date?: InputMaybe<Date_Filter_Operators>;
  date_func?: InputMaybe<Date_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  sh?: InputMaybe<Number_Filter_Operators>;
  station?: InputMaybe<At_Geosphere_Stations_Filter>;
  tl_mittel?: InputMaybe<Number_Filter_Operators>;
  tlmax?: InputMaybe<Number_Filter_Operators>;
  tlmin?: InputMaybe<Number_Filter_Operators>;
};

export type At_Geosphere_Data_Mutated = {
  __typename?: 'at_geosphere_data_mutated';
  data?: Maybe<At_Geosphere_Data>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type At_Geosphere_Stations = {
  __typename?: 'at_geosphere_stations';
  height?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  snow_coverage?: Maybe<Scalars['Float']['output']>;
  start?: Maybe<Scalars['Date']['output']>;
  start_func?: Maybe<Date_Functions>;
  state?: Maybe<Scalars['String']['output']>;
  station?: Maybe<Scalars['String']['output']>;
};

export type At_Geosphere_Stations_Aggregated = {
  __typename?: 'at_geosphere_stations_aggregated';
  avg?: Maybe<At_Geosphere_Stations_Aggregated_Fields>;
  avgDistinct?: Maybe<At_Geosphere_Stations_Aggregated_Fields>;
  count?: Maybe<At_Geosphere_Stations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<At_Geosphere_Stations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<At_Geosphere_Stations_Aggregated_Fields>;
  min?: Maybe<At_Geosphere_Stations_Aggregated_Fields>;
  sum?: Maybe<At_Geosphere_Stations_Aggregated_Fields>;
  sumDistinct?: Maybe<At_Geosphere_Stations_Aggregated_Fields>;
};

export type At_Geosphere_Stations_Aggregated_Count = {
  __typename?: 'at_geosphere_stations_aggregated_count';
  height?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  latitude?: Maybe<Scalars['Int']['output']>;
  longitude?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
  snow_coverage?: Maybe<Scalars['Int']['output']>;
  start?: Maybe<Scalars['Int']['output']>;
  state?: Maybe<Scalars['Int']['output']>;
  station?: Maybe<Scalars['Int']['output']>;
};

export type At_Geosphere_Stations_Aggregated_Fields = {
  __typename?: 'at_geosphere_stations_aggregated_fields';
  height?: Maybe<Scalars['Float']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  snow_coverage?: Maybe<Scalars['Float']['output']>;
};

export type At_Geosphere_Stations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<At_Geosphere_Stations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<At_Geosphere_Stations_Filter>>>;
  height?: InputMaybe<Number_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  latitude?: InputMaybe<Number_Filter_Operators>;
  longitude?: InputMaybe<Number_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
  snow_coverage?: InputMaybe<Number_Filter_Operators>;
  start?: InputMaybe<Date_Filter_Operators>;
  start_func?: InputMaybe<Date_Function_Filter_Operators>;
  state?: InputMaybe<String_Filter_Operators>;
  station?: InputMaybe<String_Filter_Operators>;
};

export type At_Geosphere_Stations_Mutated = {
  __typename?: 'at_geosphere_stations_mutated';
  data?: Maybe<At_Geosphere_Stations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Big_Int_Filter_Operators = {
  _between?: InputMaybe<Array<InputMaybe<Scalars['GraphQLBigInt']['input']>>>;
  _eq?: InputMaybe<Scalars['GraphQLBigInt']['input']>;
  _gt?: InputMaybe<Scalars['GraphQLBigInt']['input']>;
  _gte?: InputMaybe<Scalars['GraphQLBigInt']['input']>;
  _in?: InputMaybe<Array<InputMaybe<Scalars['GraphQLBigInt']['input']>>>;
  _lt?: InputMaybe<Scalars['GraphQLBigInt']['input']>;
  _lte?: InputMaybe<Scalars['GraphQLBigInt']['input']>;
  _nbetween?: InputMaybe<Array<InputMaybe<Scalars['GraphQLBigInt']['input']>>>;
  _neq?: InputMaybe<Scalars['GraphQLBigInt']['input']>;
  _nin?: InputMaybe<Array<InputMaybe<Scalars['GraphQLBigInt']['input']>>>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Biomasse_Produktion = {
  __typename?: 'biomasse_produktion';
  Biomasse?: Maybe<Scalars['Float']['output']>;
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};


export type Biomasse_ProduktionCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Biomasse_Produktion_Aggregated = {
  __typename?: 'biomasse_produktion_aggregated';
  avg?: Maybe<Biomasse_Produktion_Aggregated_Fields>;
  avgDistinct?: Maybe<Biomasse_Produktion_Aggregated_Fields>;
  count?: Maybe<Biomasse_Produktion_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Biomasse_Produktion_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Biomasse_Produktion_Aggregated_Fields>;
  min?: Maybe<Biomasse_Produktion_Aggregated_Fields>;
  sum?: Maybe<Biomasse_Produktion_Aggregated_Fields>;
  sumDistinct?: Maybe<Biomasse_Produktion_Aggregated_Fields>;
};

export type Biomasse_Produktion_Aggregated_Count = {
  __typename?: 'biomasse_produktion_aggregated_count';
  Biomasse?: Maybe<Scalars['Int']['output']>;
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Biomasse_Produktion_Aggregated_Fields = {
  __typename?: 'biomasse_produktion_aggregated_fields';
  Biomasse?: Maybe<Scalars['Float']['output']>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Biomasse_Produktion_Filter = {
  Biomasse?: InputMaybe<Number_Filter_Operators>;
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Date_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Biomasse_Produktion_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Biomasse_Produktion_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Biomasse_Produktion_Mutated = {
  __typename?: 'biomasse_produktion_mutated';
  data?: Maybe<Biomasse_Produktion>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Biomasse_Zielpfad = {
  __typename?: 'biomasse_zielpfad';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};


export type Biomasse_ZielpfadCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Biomasse_Zielpfad_Aggregated = {
  __typename?: 'biomasse_zielpfad_aggregated';
  avg?: Maybe<Biomasse_Zielpfad_Aggregated_Fields>;
  avgDistinct?: Maybe<Biomasse_Zielpfad_Aggregated_Fields>;
  count?: Maybe<Biomasse_Zielpfad_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Biomasse_Zielpfad_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Biomasse_Zielpfad_Aggregated_Fields>;
  min?: Maybe<Biomasse_Zielpfad_Aggregated_Fields>;
  sum?: Maybe<Biomasse_Zielpfad_Aggregated_Fields>;
  sumDistinct?: Maybe<Biomasse_Zielpfad_Aggregated_Fields>;
};

export type Biomasse_Zielpfad_Aggregated_Count = {
  __typename?: 'biomasse_zielpfad_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Biomasse_Zielpfad_Aggregated_Fields = {
  __typename?: 'biomasse_zielpfad_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Biomasse_Zielpfad_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Date_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Biomasse_Zielpfad_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Biomasse_Zielpfad_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Biomasse_Zielpfad_Mutated = {
  __typename?: 'biomasse_zielpfad_mutated';
  data?: Maybe<Biomasse_Zielpfad>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Chart = {
  __typename?: 'block_chart';
  charts?: Maybe<Array<Maybe<Block_Chart_Charts>>>;
  charts_func?: Maybe<Count_Functions>;
  hidewrapper?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
};


export type Block_ChartChartsArgs = {
  filter?: InputMaybe<Block_Chart_Charts_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Chart_Aggregated = {
  __typename?: 'block_chart_aggregated';
  count?: Maybe<Block_Chart_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Chart_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Chart_Aggregated_Count = {
  __typename?: 'block_chart_aggregated_count';
  charts?: Maybe<Scalars['Int']['output']>;
  hidewrapper?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Block_Chart_Charts = {
  __typename?: 'block_chart_charts';
  block?: Maybe<Block_Chart>;
  chart?: Maybe<Charts>;
  id: Scalars['ID']['output'];
};


export type Block_Chart_ChartsBlockArgs = {
  filter?: InputMaybe<Block_Chart_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Chart_ChartsChartArgs = {
  filter?: InputMaybe<Charts_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Chart_Charts_Aggregated = {
  __typename?: 'block_chart_charts_aggregated';
  avg?: Maybe<Block_Chart_Charts_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Chart_Charts_Aggregated_Fields>;
  count?: Maybe<Block_Chart_Charts_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Chart_Charts_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Chart_Charts_Aggregated_Fields>;
  min?: Maybe<Block_Chart_Charts_Aggregated_Fields>;
  sum?: Maybe<Block_Chart_Charts_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Chart_Charts_Aggregated_Fields>;
};

export type Block_Chart_Charts_Aggregated_Count = {
  __typename?: 'block_chart_charts_aggregated_count';
  block?: Maybe<Scalars['Int']['output']>;
  chart?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Block_Chart_Charts_Aggregated_Fields = {
  __typename?: 'block_chart_charts_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Chart_Charts_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Chart_Charts_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Chart_Charts_Filter>>>;
  block?: InputMaybe<Block_Chart_Filter>;
  chart?: InputMaybe<Charts_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Block_Chart_Charts_Mutated = {
  __typename?: 'block_chart_charts_mutated';
  data?: Maybe<Block_Chart_Charts>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Chart_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Chart_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Chart_Filter>>>;
  charts?: InputMaybe<Block_Chart_Charts_Filter>;
  charts_func?: InputMaybe<Count_Function_Filter_Operators>;
  hidewrapper?: InputMaybe<Boolean_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
};

export type Block_Chart_Mutated = {
  __typename?: 'block_chart_mutated';
  data?: Maybe<Block_Chart>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Donation = {
  __typename?: 'block_donation';
  id: Scalars['ID']['output'];
  translations?: Maybe<Array<Maybe<Block_Donation_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
};


export type Block_DonationTranslationsArgs = {
  filter?: InputMaybe<Block_Donation_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Donation_Aggregated = {
  __typename?: 'block_donation_aggregated';
  count?: Maybe<Block_Donation_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Donation_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Donation_Aggregated_Count = {
  __typename?: 'block_donation_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
};

export type Block_Donation_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Donation_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Donation_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Block_Donation_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Block_Donation_Mutated = {
  __typename?: 'block_donation_mutated';
  data?: Maybe<Block_Donation>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Donation_Translations = {
  __typename?: 'block_donation_translations';
  block_donation_id?: Maybe<Block_Donation>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  links?: Maybe<Scalars['JSON']['output']>;
  links_func?: Maybe<Count_Functions>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Block_Donation_TranslationsBlock_Donation_IdArgs = {
  filter?: InputMaybe<Block_Donation_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Donation_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Donation_Translations_Aggregated = {
  __typename?: 'block_donation_translations_aggregated';
  avg?: Maybe<Block_Donation_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Donation_Translations_Aggregated_Fields>;
  count?: Maybe<Block_Donation_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Donation_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Donation_Translations_Aggregated_Fields>;
  min?: Maybe<Block_Donation_Translations_Aggregated_Fields>;
  sum?: Maybe<Block_Donation_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Donation_Translations_Aggregated_Fields>;
};

export type Block_Donation_Translations_Aggregated_Count = {
  __typename?: 'block_donation_translations_aggregated_count';
  block_donation_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  links?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Block_Donation_Translations_Aggregated_Fields = {
  __typename?: 'block_donation_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Donation_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Donation_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Donation_Translations_Filter>>>;
  block_donation_id?: InputMaybe<Block_Donation_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  links?: InputMaybe<String_Filter_Operators>;
  links_func?: InputMaybe<Count_Function_Filter_Operators>;
  text?: InputMaybe<String_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Block_Donation_Translations_Mutated = {
  __typename?: 'block_donation_translations_mutated';
  data?: Maybe<Block_Donation_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Gallery = {
  __typename?: 'block_gallery';
  files?: Maybe<Array<Maybe<Block_Gallery_Files>>>;
  files_func?: Maybe<Count_Functions>;
  id: Scalars['ID']['output'];
  title?: Maybe<Scalars['String']['output']>;
};


export type Block_GalleryFilesArgs = {
  filter?: InputMaybe<Block_Gallery_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Gallery_Aggregated = {
  __typename?: 'block_gallery_aggregated';
  count?: Maybe<Block_Gallery_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Gallery_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Gallery_Aggregated_Count = {
  __typename?: 'block_gallery_aggregated_count';
  files?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Block_Gallery_Files = {
  __typename?: 'block_gallery_files';
  block_gallery_id?: Maybe<Block_Gallery>;
  directus_files_id?: Maybe<Directus_Files>;
  id: Scalars['ID']['output'];
};


export type Block_Gallery_FilesBlock_Gallery_IdArgs = {
  filter?: InputMaybe<Block_Gallery_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Gallery_FilesDirectus_Files_IdArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Gallery_Files_Aggregated = {
  __typename?: 'block_gallery_files_aggregated';
  avg?: Maybe<Block_Gallery_Files_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Gallery_Files_Aggregated_Fields>;
  count?: Maybe<Block_Gallery_Files_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Gallery_Files_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Gallery_Files_Aggregated_Fields>;
  min?: Maybe<Block_Gallery_Files_Aggregated_Fields>;
  sum?: Maybe<Block_Gallery_Files_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Gallery_Files_Aggregated_Fields>;
};

export type Block_Gallery_Files_Aggregated_Count = {
  __typename?: 'block_gallery_files_aggregated_count';
  block_gallery_id?: Maybe<Scalars['Int']['output']>;
  directus_files_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Block_Gallery_Files_Aggregated_Fields = {
  __typename?: 'block_gallery_files_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Gallery_Files_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Gallery_Files_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Gallery_Files_Filter>>>;
  block_gallery_id?: InputMaybe<Block_Gallery_Filter>;
  directus_files_id?: InputMaybe<Directus_Files_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Block_Gallery_Files_Mutated = {
  __typename?: 'block_gallery_files_mutated';
  data?: Maybe<Block_Gallery_Files>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Gallery_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Gallery_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Gallery_Filter>>>;
  files?: InputMaybe<Block_Gallery_Files_Filter>;
  files_func?: InputMaybe<Count_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Block_Gallery_Mutated = {
  __typename?: 'block_gallery_mutated';
  data?: Maybe<Block_Gallery>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Grid = {
  __typename?: 'block_grid';
  blocks?: Maybe<Array<Maybe<Block_Grid_Blocks>>>;
  blocks_func?: Maybe<Count_Functions>;
  id: Scalars['ID']['output'];
};


export type Block_GridBlocksArgs = {
  filter?: InputMaybe<Block_Grid_Blocks_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Grid_Aggregated = {
  __typename?: 'block_grid_aggregated';
  count?: Maybe<Block_Grid_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Grid_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Grid_Aggregated_Count = {
  __typename?: 'block_grid_aggregated_count';
  blocks?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Block_Grid_Blocks = {
  __typename?: 'block_grid_blocks';
  block_grid_id?: Maybe<Block_Grid>;
  collection?: Maybe<Scalars['String']['output']>;
  height?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  item?: Maybe<Block_Grid_Blocks_Item_Union>;
  sort?: Maybe<Scalars['Int']['output']>;
  width?: Maybe<Scalars['String']['output']>;
};


export type Block_Grid_BlocksBlock_Grid_IdArgs = {
  filter?: InputMaybe<Block_Grid_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Grid_Blocks_Aggregated = {
  __typename?: 'block_grid_blocks_aggregated';
  avg?: Maybe<Block_Grid_Blocks_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Grid_Blocks_Aggregated_Fields>;
  count?: Maybe<Block_Grid_Blocks_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Grid_Blocks_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Grid_Blocks_Aggregated_Fields>;
  min?: Maybe<Block_Grid_Blocks_Aggregated_Fields>;
  sum?: Maybe<Block_Grid_Blocks_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Grid_Blocks_Aggregated_Fields>;
};

export type Block_Grid_Blocks_Aggregated_Count = {
  __typename?: 'block_grid_blocks_aggregated_count';
  block_grid_id?: Maybe<Scalars['Int']['output']>;
  collection?: Maybe<Scalars['Int']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  item?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};

export type Block_Grid_Blocks_Aggregated_Fields = {
  __typename?: 'block_grid_blocks_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Block_Grid_Blocks_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Grid_Blocks_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Grid_Blocks_Filter>>>;
  block_grid_id?: InputMaybe<Block_Grid_Filter>;
  collection?: InputMaybe<String_Filter_Operators>;
  height?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  item__block_chart?: InputMaybe<Block_Chart_Filter>;
  item__block_donation?: InputMaybe<Block_Donation_Filter>;
  item__block_news?: InputMaybe<Block_News_Filter>;
  item__block_panel?: InputMaybe<Block_Panel_Filter>;
  item__block_quiz?: InputMaybe<Block_Quiz_Filter>;
  item__block_richtext?: InputMaybe<Block_Richtext_Filter>;
  item__block_teaser?: InputMaybe<Block_Teaser_Filter>;
  sort?: InputMaybe<Number_Filter_Operators>;
  width?: InputMaybe<String_Filter_Operators>;
};

export type Block_Grid_Blocks_Item_Union = Block_Chart | Block_Donation | Block_News | Block_Panel | Block_Quiz | Block_Richtext | Block_Teaser;

export type Block_Grid_Blocks_Mutated = {
  __typename?: 'block_grid_blocks_mutated';
  data?: Maybe<Block_Grid_Blocks>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Grid_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Grid_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Grid_Filter>>>;
  blocks?: InputMaybe<Block_Grid_Blocks_Filter>;
  blocks_func?: InputMaybe<Count_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
};

export type Block_Grid_Mutated = {
  __typename?: 'block_grid_mutated';
  data?: Maybe<Block_Grid>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Items = {
  __typename?: 'block_items';
  id: Scalars['ID']['output'];
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  translations?: Maybe<Array<Maybe<Block_Items_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  types?: Maybe<Scalars['JSON']['output']>;
  types_func?: Maybe<Count_Functions>;
};


export type Block_ItemsTranslationsArgs = {
  filter?: InputMaybe<Block_Items_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Items_Aggregated = {
  __typename?: 'block_items_aggregated';
  count?: Maybe<Block_Items_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Items_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Items_Aggregated_Count = {
  __typename?: 'block_items_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  tags?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  types?: Maybe<Scalars['Int']['output']>;
};

export type Block_Items_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Items_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Items_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  tags?: InputMaybe<String_Filter_Operators>;
  tags_func?: InputMaybe<Count_Function_Filter_Operators>;
  translations?: InputMaybe<Block_Items_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  types?: InputMaybe<String_Filter_Operators>;
  types_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Block_Items_Mutated = {
  __typename?: 'block_items_mutated';
  data?: Maybe<Block_Items>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Items_Translations = {
  __typename?: 'block_items_translations';
  block_items_id?: Maybe<Block_Items>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Block_Items_TranslationsBlock_Items_IdArgs = {
  filter?: InputMaybe<Block_Items_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Items_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Items_Translations_Aggregated = {
  __typename?: 'block_items_translations_aggregated';
  avg?: Maybe<Block_Items_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Items_Translations_Aggregated_Fields>;
  count?: Maybe<Block_Items_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Items_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Items_Translations_Aggregated_Fields>;
  min?: Maybe<Block_Items_Translations_Aggregated_Fields>;
  sum?: Maybe<Block_Items_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Items_Translations_Aggregated_Fields>;
};

export type Block_Items_Translations_Aggregated_Count = {
  __typename?: 'block_items_translations_aggregated_count';
  block_items_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Block_Items_Translations_Aggregated_Fields = {
  __typename?: 'block_items_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Items_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Items_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Items_Translations_Filter>>>;
  block_items_id?: InputMaybe<Block_Items_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Block_Items_Translations_Mutated = {
  __typename?: 'block_items_translations_mutated';
  data?: Maybe<Block_Items_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_News = {
  __typename?: 'block_news';
  id: Scalars['ID']['output'];
};

export type Block_News_Aggregated = {
  __typename?: 'block_news_aggregated';
  avg?: Maybe<Block_News_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_News_Aggregated_Fields>;
  count?: Maybe<Block_News_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_News_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_News_Aggregated_Fields>;
  min?: Maybe<Block_News_Aggregated_Fields>;
  sum?: Maybe<Block_News_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_News_Aggregated_Fields>;
};

export type Block_News_Aggregated_Count = {
  __typename?: 'block_news_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
};

export type Block_News_Aggregated_Fields = {
  __typename?: 'block_news_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_News_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_News_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_News_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Block_News_Mutated = {
  __typename?: 'block_news_mutated';
  data?: Maybe<Block_News>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Panel = {
  __typename?: 'block_panel';
  chart?: Maybe<Charts>;
  chart_custom?: Maybe<Scalars['String']['output']>;
  colorBackground?: Maybe<Scalars['String']['output']>;
  colorText?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  number?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Array<Maybe<Block_Panel_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  unit?: Maybe<Scalars['String']['output']>;
};


export type Block_PanelChartArgs = {
  filter?: InputMaybe<Charts_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_PanelTranslationsArgs = {
  filter?: InputMaybe<Block_Panel_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Panel_Aggregated = {
  __typename?: 'block_panel_aggregated';
  avg?: Maybe<Block_Panel_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Panel_Aggregated_Fields>;
  count?: Maybe<Block_Panel_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Panel_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Panel_Aggregated_Fields>;
  min?: Maybe<Block_Panel_Aggregated_Fields>;
  sum?: Maybe<Block_Panel_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Panel_Aggregated_Fields>;
};

export type Block_Panel_Aggregated_Count = {
  __typename?: 'block_panel_aggregated_count';
  chart?: Maybe<Scalars['Int']['output']>;
  chart_custom?: Maybe<Scalars['Int']['output']>;
  colorBackground?: Maybe<Scalars['Int']['output']>;
  colorText?: Maybe<Scalars['Int']['output']>;
  icon?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  number?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
};

export type Block_Panel_Aggregated_Fields = {
  __typename?: 'block_panel_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Panel_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Panel_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Panel_Filter>>>;
  chart?: InputMaybe<Charts_Filter>;
  chart_custom?: InputMaybe<String_Filter_Operators>;
  colorBackground?: InputMaybe<String_Filter_Operators>;
  colorText?: InputMaybe<String_Filter_Operators>;
  icon?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  number?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Block_Panel_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
};

export type Block_Panel_Mutated = {
  __typename?: 'block_panel_mutated';
  data?: Maybe<Block_Panel>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Panel_Translations = {
  __typename?: 'block_panel_translations';
  block_panel_id?: Maybe<Block_Panel>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  link?: Maybe<Scalars['String']['output']>;
  list?: Maybe<Scalars['JSON']['output']>;
  list_func?: Maybe<Count_Functions>;
  source?: Maybe<Scalars['String']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Block_Panel_TranslationsBlock_Panel_IdArgs = {
  filter?: InputMaybe<Block_Panel_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Panel_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Panel_Translations_Aggregated = {
  __typename?: 'block_panel_translations_aggregated';
  avg?: Maybe<Block_Panel_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Panel_Translations_Aggregated_Fields>;
  count?: Maybe<Block_Panel_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Panel_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Panel_Translations_Aggregated_Fields>;
  min?: Maybe<Block_Panel_Translations_Aggregated_Fields>;
  sum?: Maybe<Block_Panel_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Panel_Translations_Aggregated_Fields>;
};

export type Block_Panel_Translations_Aggregated_Count = {
  __typename?: 'block_panel_translations_aggregated_count';
  block_panel_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  link?: Maybe<Scalars['Int']['output']>;
  list?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  subtitle?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Block_Panel_Translations_Aggregated_Fields = {
  __typename?: 'block_panel_translations_aggregated_fields';
  block_panel_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Panel_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Panel_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Panel_Translations_Filter>>>;
  block_panel_id?: InputMaybe<Block_Panel_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  link?: InputMaybe<String_Filter_Operators>;
  list?: InputMaybe<String_Filter_Operators>;
  list_func?: InputMaybe<Count_Function_Filter_Operators>;
  source?: InputMaybe<String_Filter_Operators>;
  subtitle?: InputMaybe<String_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Block_Panel_Translations_Mutated = {
  __typename?: 'block_panel_translations_mutated';
  data?: Maybe<Block_Panel_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Quiz = {
  __typename?: 'block_quiz';
  id: Scalars['ID']['output'];
};

export type Block_Quiz_Aggregated = {
  __typename?: 'block_quiz_aggregated';
  count?: Maybe<Block_Quiz_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Quiz_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Quiz_Aggregated_Count = {
  __typename?: 'block_quiz_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
};

export type Block_Quiz_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Quiz_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Quiz_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
};

export type Block_Quiz_Mutated = {
  __typename?: 'block_quiz_mutated';
  data?: Maybe<Block_Quiz>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Quotes = {
  __typename?: 'block_quotes';
  id: Scalars['ID']['output'];
};

export type Block_Quotes_Aggregated = {
  __typename?: 'block_quotes_aggregated';
  count?: Maybe<Block_Quotes_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Quotes_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Quotes_Aggregated_Count = {
  __typename?: 'block_quotes_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
};

export type Block_Quotes_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Quotes_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Quotes_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
};

export type Block_Quotes_Mutated = {
  __typename?: 'block_quotes_mutated';
  data?: Maybe<Block_Quotes>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Richtext = {
  __typename?: 'block_richtext';
  id: Scalars['ID']['output'];
  translations?: Maybe<Array<Maybe<Block_Richtext_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
};


export type Block_RichtextTranslationsArgs = {
  filter?: InputMaybe<Block_Richtext_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Richtext_Aggregated = {
  __typename?: 'block_richtext_aggregated';
  count?: Maybe<Block_Richtext_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Richtext_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Richtext_Aggregated_Count = {
  __typename?: 'block_richtext_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
};

export type Block_Richtext_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Richtext_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Richtext_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Block_Richtext_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Block_Richtext_Mutated = {
  __typename?: 'block_richtext_mutated';
  data?: Maybe<Block_Richtext>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Richtext_Translations = {
  __typename?: 'block_richtext_translations';
  block_richtext_id?: Maybe<Block_Richtext>;
  content?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
};


export type Block_Richtext_TranslationsBlock_Richtext_IdArgs = {
  filter?: InputMaybe<Block_Richtext_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Richtext_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Richtext_Translations_Aggregated = {
  __typename?: 'block_richtext_translations_aggregated';
  avg?: Maybe<Block_Richtext_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Richtext_Translations_Aggregated_Fields>;
  count?: Maybe<Block_Richtext_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Richtext_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Richtext_Translations_Aggregated_Fields>;
  min?: Maybe<Block_Richtext_Translations_Aggregated_Fields>;
  sum?: Maybe<Block_Richtext_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Richtext_Translations_Aggregated_Fields>;
};

export type Block_Richtext_Translations_Aggregated_Count = {
  __typename?: 'block_richtext_translations_aggregated_count';
  block_richtext_id?: Maybe<Scalars['Int']['output']>;
  content?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
};

export type Block_Richtext_Translations_Aggregated_Fields = {
  __typename?: 'block_richtext_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Richtext_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Richtext_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Richtext_Translations_Filter>>>;
  block_richtext_id?: InputMaybe<Block_Richtext_Filter>;
  content?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
};

export type Block_Richtext_Translations_Mutated = {
  __typename?: 'block_richtext_translations_mutated';
  data?: Maybe<Block_Richtext_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Teaser = {
  __typename?: 'block_teaser';
  id: Scalars['ID']['output'];
  image?: Maybe<Directus_Files>;
  translations?: Maybe<Array<Maybe<Block_Teaser_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
};


export type Block_TeaserImageArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_TeaserTranslationsArgs = {
  filter?: InputMaybe<Block_Teaser_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Teaser_Aggregated = {
  __typename?: 'block_teaser_aggregated';
  count?: Maybe<Block_Teaser_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Teaser_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Teaser_Aggregated_Count = {
  __typename?: 'block_teaser_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  image?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
};

export type Block_Teaser_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Teaser_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Teaser_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  image?: InputMaybe<Directus_Files_Filter>;
  translations?: InputMaybe<Block_Teaser_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Block_Teaser_Mutated = {
  __typename?: 'block_teaser_mutated';
  data?: Maybe<Block_Teaser>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Teaser_Translations = {
  __typename?: 'block_teaser_translations';
  block_teaser_id?: Maybe<Block_Teaser>;
  description?: Maybe<Scalars['String']['output']>;
  eyebrow?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  link?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Block_Teaser_TranslationsBlock_Teaser_IdArgs = {
  filter?: InputMaybe<Block_Teaser_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Teaser_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Teaser_Translations_Aggregated = {
  __typename?: 'block_teaser_translations_aggregated';
  avg?: Maybe<Block_Teaser_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Teaser_Translations_Aggregated_Fields>;
  count?: Maybe<Block_Teaser_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Teaser_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Teaser_Translations_Aggregated_Fields>;
  min?: Maybe<Block_Teaser_Translations_Aggregated_Fields>;
  sum?: Maybe<Block_Teaser_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Teaser_Translations_Aggregated_Fields>;
};

export type Block_Teaser_Translations_Aggregated_Count = {
  __typename?: 'block_teaser_translations_aggregated_count';
  block_teaser_id?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['Int']['output']>;
  eyebrow?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  link?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Block_Teaser_Translations_Aggregated_Fields = {
  __typename?: 'block_teaser_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Teaser_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Teaser_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Teaser_Translations_Filter>>>;
  block_teaser_id?: InputMaybe<Block_Teaser_Filter>;
  description?: InputMaybe<String_Filter_Operators>;
  eyebrow?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  link?: InputMaybe<String_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Block_Teaser_Translations_Mutated = {
  __typename?: 'block_teaser_translations_mutated';
  data?: Maybe<Block_Teaser_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Toggle = {
  __typename?: 'block_toggle';
  id: Scalars['ID']['output'];
  translations?: Maybe<Array<Maybe<Block_Toggle_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
};


export type Block_ToggleTranslationsArgs = {
  filter?: InputMaybe<Block_Toggle_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Toggle_Aggregated = {
  __typename?: 'block_toggle_aggregated';
  count?: Maybe<Block_Toggle_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Toggle_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Block_Toggle_Aggregated_Count = {
  __typename?: 'block_toggle_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
};

export type Block_Toggle_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Toggle_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Toggle_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Block_Toggle_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Block_Toggle_Mutated = {
  __typename?: 'block_toggle_mutated';
  data?: Maybe<Block_Toggle>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Block_Toggle_Translations = {
  __typename?: 'block_toggle_translations';
  answer?: Maybe<Scalars['String']['output']>;
  block_toggle_id?: Maybe<Block_Toggle>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  question?: Maybe<Scalars['String']['output']>;
};


export type Block_Toggle_TranslationsBlock_Toggle_IdArgs = {
  filter?: InputMaybe<Block_Toggle_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Block_Toggle_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Block_Toggle_Translations_Aggregated = {
  __typename?: 'block_toggle_translations_aggregated';
  avg?: Maybe<Block_Toggle_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Block_Toggle_Translations_Aggregated_Fields>;
  count?: Maybe<Block_Toggle_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Block_Toggle_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Block_Toggle_Translations_Aggregated_Fields>;
  min?: Maybe<Block_Toggle_Translations_Aggregated_Fields>;
  sum?: Maybe<Block_Toggle_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Block_Toggle_Translations_Aggregated_Fields>;
};

export type Block_Toggle_Translations_Aggregated_Count = {
  __typename?: 'block_toggle_translations_aggregated_count';
  answer?: Maybe<Scalars['Int']['output']>;
  block_toggle_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  question?: Maybe<Scalars['Int']['output']>;
};

export type Block_Toggle_Translations_Aggregated_Fields = {
  __typename?: 'block_toggle_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Block_Toggle_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Block_Toggle_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Block_Toggle_Translations_Filter>>>;
  answer?: InputMaybe<String_Filter_Operators>;
  block_toggle_id?: InputMaybe<Block_Toggle_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  question?: InputMaybe<String_Filter_Operators>;
};

export type Block_Toggle_Translations_Mutated = {
  __typename?: 'block_toggle_translations_mutated';
  data?: Maybe<Block_Toggle_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Boolean_Filter_Operators = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Carbon_Prices = {
  __typename?: 'carbon_prices';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  region?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Carbon_Prices_Aggregated = {
  __typename?: 'carbon_prices_aggregated';
  avg?: Maybe<Carbon_Prices_Aggregated_Fields>;
  avgDistinct?: Maybe<Carbon_Prices_Aggregated_Fields>;
  count?: Maybe<Carbon_Prices_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Carbon_Prices_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Carbon_Prices_Aggregated_Fields>;
  min?: Maybe<Carbon_Prices_Aggregated_Fields>;
  sum?: Maybe<Carbon_Prices_Aggregated_Fields>;
  sumDistinct?: Maybe<Carbon_Prices_Aggregated_Fields>;
};

export type Carbon_Prices_Aggregated_Count = {
  __typename?: 'carbon_prices_aggregated_count';
  date?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Carbon_Prices_Aggregated_Fields = {
  __typename?: 'carbon_prices_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Carbon_Prices_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Carbon_Prices_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Carbon_Prices_Filter>>>;
  date?: InputMaybe<Date_Filter_Operators>;
  date_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  region?: InputMaybe<String_Filter_Operators>;
  type?: InputMaybe<String_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Carbon_Prices_Mutated = {
  __typename?: 'carbon_prices_mutated';
  data?: Maybe<Carbon_Prices>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Charts = {
  __typename?: 'charts';
  custom_sveltestring?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  id_old?: Maybe<Scalars['String']['output']>;
  layers?: Maybe<Scalars['JSON']['output']>;
  layers_func?: Maybe<Count_Functions>;
  options?: Maybe<Scalars['JSON']['output']>;
  options_func?: Maybe<Count_Functions>;
  site?: Maybe<Sites>;
  status?: Maybe<Scalars['String']['output']>;
  table_name?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Array<Maybe<Charts_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  type?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
  x_axis?: Maybe<Scalars['String']['output']>;
  x_axis_name?: Maybe<Scalars['String']['output']>;
};


export type ChartsSiteArgs = {
  filter?: InputMaybe<Sites_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ChartsTranslationsArgs = {
  filter?: InputMaybe<Charts_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ChartsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ChartsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Charts_Aggregated = {
  __typename?: 'charts_aggregated';
  count?: Maybe<Charts_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Charts_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Charts_Aggregated_Count = {
  __typename?: 'charts_aggregated_count';
  custom_sveltestring?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  id_old?: Maybe<Scalars['Int']['output']>;
  layers?: Maybe<Scalars['Int']['output']>;
  options?: Maybe<Scalars['Int']['output']>;
  site?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  table_name?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
  x_axis?: Maybe<Scalars['Int']['output']>;
  x_axis_name?: Maybe<Scalars['Int']['output']>;
};

export type Charts_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Charts_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Charts_Filter>>>;
  custom_sveltestring?: InputMaybe<String_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  id_old?: InputMaybe<String_Filter_Operators>;
  layers?: InputMaybe<String_Filter_Operators>;
  layers_func?: InputMaybe<Count_Function_Filter_Operators>;
  options?: InputMaybe<String_Filter_Operators>;
  options_func?: InputMaybe<Count_Function_Filter_Operators>;
  site?: InputMaybe<Sites_Filter>;
  status?: InputMaybe<String_Filter_Operators>;
  table_name?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Charts_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  type?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
  x_axis?: InputMaybe<String_Filter_Operators>;
  x_axis_name?: InputMaybe<String_Filter_Operators>;
};

export type Charts_Mutated = {
  __typename?: 'charts_mutated';
  data?: Maybe<Charts>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Charts_Translations = {
  __typename?: 'charts_translations';
  charts_id?: Maybe<Charts>;
  heading?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  methods?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  variables?: Maybe<Scalars['JSON']['output']>;
  variables_func?: Maybe<Count_Functions>;
};


export type Charts_TranslationsCharts_IdArgs = {
  filter?: InputMaybe<Charts_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Charts_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Charts_Translations_Aggregated = {
  __typename?: 'charts_translations_aggregated';
  avg?: Maybe<Charts_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Charts_Translations_Aggregated_Fields>;
  count?: Maybe<Charts_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Charts_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Charts_Translations_Aggregated_Fields>;
  min?: Maybe<Charts_Translations_Aggregated_Fields>;
  sum?: Maybe<Charts_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Charts_Translations_Aggregated_Fields>;
};

export type Charts_Translations_Aggregated_Count = {
  __typename?: 'charts_translations_aggregated_count';
  charts_id?: Maybe<Scalars['Int']['output']>;
  heading?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  methods?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  tags?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
  variables?: Maybe<Scalars['Int']['output']>;
};

export type Charts_Translations_Aggregated_Fields = {
  __typename?: 'charts_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Charts_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Charts_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Charts_Translations_Filter>>>;
  charts_id?: InputMaybe<Charts_Filter>;
  heading?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  methods?: InputMaybe<String_Filter_Operators>;
  source?: InputMaybe<String_Filter_Operators>;
  tags?: InputMaybe<String_Filter_Operators>;
  tags_func?: InputMaybe<Count_Function_Filter_Operators>;
  text?: InputMaybe<String_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
  variables?: InputMaybe<String_Filter_Operators>;
  variables_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Charts_Translations_Mutated = {
  __typename?: 'charts_translations_mutated';
  data?: Maybe<Charts_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Companies = {
  __typename?: 'companies';
  climate_neutrality_goal?: Maybe<Scalars['String']['output']>;
  climate_neutrality_scopes?: Maybe<Scalars['JSON']['output']>;
  climate_neutrality_scopes_func?: Maybe<Count_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  intermediate_goal?: Maybe<Scalars['Boolean']['output']>;
  logo?: Maybe<Directus_Files>;
  member_sbt?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sectors?: Maybe<Array<Maybe<Companies_Companies_Sectors>>>;
  sectors_func?: Maybe<Count_Functions>;
  status?: Maybe<Scalars['String']['output']>;
  user_updated?: Maybe<Directus_Users>;
};


export type CompaniesLogoArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CompaniesSectorsArgs = {
  filter?: InputMaybe<Companies_Companies_Sectors_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CompaniesUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Companies_Aggregated = {
  __typename?: 'companies_aggregated';
  count?: Maybe<Companies_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Companies_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Companies_Aggregated_Count = {
  __typename?: 'companies_aggregated_count';
  climate_neutrality_goal?: Maybe<Scalars['Int']['output']>;
  climate_neutrality_scopes?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  intermediate_goal?: Maybe<Scalars['Int']['output']>;
  logo?: Maybe<Scalars['Int']['output']>;
  member_sbt?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
  sectors?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Companies_Companies_Sectors = {
  __typename?: 'companies_companies_sectors';
  companies_id?: Maybe<Companies>;
  companies_sectors_id?: Maybe<Companies_Sectors>;
  id: Scalars['ID']['output'];
};


export type Companies_Companies_SectorsCompanies_IdArgs = {
  filter?: InputMaybe<Companies_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Companies_Companies_SectorsCompanies_Sectors_IdArgs = {
  filter?: InputMaybe<Companies_Sectors_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Companies_Companies_Sectors_Aggregated = {
  __typename?: 'companies_companies_sectors_aggregated';
  avg?: Maybe<Companies_Companies_Sectors_Aggregated_Fields>;
  avgDistinct?: Maybe<Companies_Companies_Sectors_Aggregated_Fields>;
  count?: Maybe<Companies_Companies_Sectors_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Companies_Companies_Sectors_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Companies_Companies_Sectors_Aggregated_Fields>;
  min?: Maybe<Companies_Companies_Sectors_Aggregated_Fields>;
  sum?: Maybe<Companies_Companies_Sectors_Aggregated_Fields>;
  sumDistinct?: Maybe<Companies_Companies_Sectors_Aggregated_Fields>;
};

export type Companies_Companies_Sectors_Aggregated_Count = {
  __typename?: 'companies_companies_sectors_aggregated_count';
  companies_id?: Maybe<Scalars['Int']['output']>;
  companies_sectors_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Companies_Companies_Sectors_Aggregated_Fields = {
  __typename?: 'companies_companies_sectors_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Companies_Companies_Sectors_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Companies_Companies_Sectors_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Companies_Companies_Sectors_Filter>>>;
  companies_id?: InputMaybe<Companies_Filter>;
  companies_sectors_id?: InputMaybe<Companies_Sectors_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Companies_Companies_Sectors_Mutated = {
  __typename?: 'companies_companies_sectors_mutated';
  data?: Maybe<Companies_Companies_Sectors>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Companies_Emissions = {
  __typename?: 'companies_emissions';
  category?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  source_link?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['GraphQLBigInt']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Companies_Emissions_Aggregated = {
  __typename?: 'companies_emissions_aggregated';
  avg?: Maybe<Companies_Emissions_Aggregated_Fields>;
  avgDistinct?: Maybe<Companies_Emissions_Aggregated_Fields>;
  count?: Maybe<Companies_Emissions_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Companies_Emissions_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Companies_Emissions_Aggregated_Fields>;
  min?: Maybe<Companies_Emissions_Aggregated_Fields>;
  sum?: Maybe<Companies_Emissions_Aggregated_Fields>;
  sumDistinct?: Maybe<Companies_Emissions_Aggregated_Fields>;
};

export type Companies_Emissions_Aggregated_Count = {
  __typename?: 'companies_emissions_aggregated_count';
  category?: Maybe<Scalars['Int']['output']>;
  company?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  notes?: Maybe<Scalars['Int']['output']>;
  scope?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  source_link?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Companies_Emissions_Aggregated_Fields = {
  __typename?: 'companies_emissions_aggregated_fields';
  scope?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Float']['output']>;
};

export type Companies_Emissions_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Companies_Emissions_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Companies_Emissions_Filter>>>;
  category?: InputMaybe<String_Filter_Operators>;
  company?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  notes?: InputMaybe<String_Filter_Operators>;
  scope?: InputMaybe<Number_Filter_Operators>;
  source?: InputMaybe<String_Filter_Operators>;
  source_link?: InputMaybe<String_Filter_Operators>;
  value?: InputMaybe<Big_Int_Filter_Operators>;
  year?: InputMaybe<Number_Filter_Operators>;
};

export type Companies_Emissions_Mutated = {
  __typename?: 'companies_emissions_mutated';
  data?: Maybe<Companies_Emissions>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Companies_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Companies_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Companies_Filter>>>;
  climate_neutrality_goal?: InputMaybe<String_Filter_Operators>;
  climate_neutrality_scopes?: InputMaybe<String_Filter_Operators>;
  climate_neutrality_scopes_func?: InputMaybe<Count_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  intermediate_goal?: InputMaybe<Boolean_Filter_Operators>;
  logo?: InputMaybe<Directus_Files_Filter>;
  member_sbt?: InputMaybe<Boolean_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
  sectors?: InputMaybe<Companies_Companies_Sectors_Filter>;
  sectors_func?: InputMaybe<Count_Function_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Companies_Mutated = {
  __typename?: 'companies_mutated';
  data?: Maybe<Companies>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Companies_Sectors = {
  __typename?: 'companies_sectors';
  icon?: Maybe<Directus_Files>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};


export type Companies_SectorsIconArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Companies_Sectors_Aggregated = {
  __typename?: 'companies_sectors_aggregated';
  count?: Maybe<Companies_Sectors_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Companies_Sectors_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Companies_Sectors_Aggregated_Count = {
  __typename?: 'companies_sectors_aggregated_count';
  icon?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
};

export type Companies_Sectors_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Companies_Sectors_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Companies_Sectors_Filter>>>;
  icon?: InputMaybe<Directus_Files_Filter>;
  id?: InputMaybe<String_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
};

export type Companies_Sectors_Mutated = {
  __typename?: 'companies_sectors_mutated';
  data?: Maybe<Companies_Sectors>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Count_Function_Filter_Operators = {
  count?: InputMaybe<Number_Filter_Operators>;
};

export type Count_Functions = {
  __typename?: 'count_functions';
  count?: Maybe<Scalars['Int']['output']>;
};

export type Countries = {
  __typename?: 'countries';
  area?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  name_de?: Maybe<Scalars['String']['output']>;
  population?: Maybe<Scalars['Int']['output']>;
};

export type Countries_Aggregated = {
  __typename?: 'countries_aggregated';
  avg?: Maybe<Countries_Aggregated_Fields>;
  avgDistinct?: Maybe<Countries_Aggregated_Fields>;
  count?: Maybe<Countries_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Countries_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Countries_Aggregated_Fields>;
  min?: Maybe<Countries_Aggregated_Fields>;
  sum?: Maybe<Countries_Aggregated_Fields>;
  sumDistinct?: Maybe<Countries_Aggregated_Fields>;
};

export type Countries_Aggregated_Count = {
  __typename?: 'countries_aggregated_count';
  area?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  latitude?: Maybe<Scalars['Int']['output']>;
  longitude?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
  name_de?: Maybe<Scalars['Int']['output']>;
  population?: Maybe<Scalars['Int']['output']>;
};

export type Countries_Aggregated_Fields = {
  __typename?: 'countries_aggregated_fields';
  area?: Maybe<Scalars['Float']['output']>;
  population?: Maybe<Scalars['Float']['output']>;
};

export type Countries_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Countries_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Countries_Filter>>>;
  area?: InputMaybe<Number_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  latitude?: InputMaybe<String_Filter_Operators>;
  longitude?: InputMaybe<String_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
  name_de?: InputMaybe<String_Filter_Operators>;
  population?: InputMaybe<Number_Filter_Operators>;
};

export type Countries_Mutated = {
  __typename?: 'countries_mutated';
  data?: Maybe<Countries>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Datasets = {
  __typename?: 'datasets';
  id: Scalars['ID']['output'];
};

export type Datasets_Aggregated = {
  __typename?: 'datasets_aggregated';
  avg?: Maybe<Datasets_Aggregated_Fields>;
  avgDistinct?: Maybe<Datasets_Aggregated_Fields>;
  count?: Maybe<Datasets_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Datasets_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Datasets_Aggregated_Fields>;
  min?: Maybe<Datasets_Aggregated_Fields>;
  sum?: Maybe<Datasets_Aggregated_Fields>;
  sumDistinct?: Maybe<Datasets_Aggregated_Fields>;
};

export type Datasets_Aggregated_Count = {
  __typename?: 'datasets_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
};

export type Datasets_Aggregated_Fields = {
  __typename?: 'datasets_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Datasets_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Datasets_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Datasets_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Datasets_Mutated = {
  __typename?: 'datasets_mutated';
  data?: Maybe<Datasets>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Date_Filter_Operators = {
  _between?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _nbetween?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Date_Function_Filter_Operators = {
  day?: InputMaybe<Number_Filter_Operators>;
  month?: InputMaybe<Number_Filter_Operators>;
  week?: InputMaybe<Number_Filter_Operators>;
  weekday?: InputMaybe<Number_Filter_Operators>;
  year?: InputMaybe<Number_Filter_Operators>;
};

export type Date_Functions = {
  __typename?: 'date_functions';
  day?: Maybe<Scalars['Int']['output']>;
  month?: Maybe<Scalars['Int']['output']>;
  week?: Maybe<Scalars['Int']['output']>;
  weekday?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Datetime_Function_Filter_Operators = {
  day?: InputMaybe<Number_Filter_Operators>;
  hour?: InputMaybe<Number_Filter_Operators>;
  minute?: InputMaybe<Number_Filter_Operators>;
  month?: InputMaybe<Number_Filter_Operators>;
  second?: InputMaybe<Number_Filter_Operators>;
  week?: InputMaybe<Number_Filter_Operators>;
  weekday?: InputMaybe<Number_Filter_Operators>;
  year?: InputMaybe<Number_Filter_Operators>;
};

export type Datetime_Functions = {
  __typename?: 'datetime_functions';
  day?: Maybe<Scalars['Int']['output']>;
  hour?: Maybe<Scalars['Int']['output']>;
  minute?: Maybe<Scalars['Int']['output']>;
  month?: Maybe<Scalars['Int']['output']>;
  second?: Maybe<Scalars['Int']['output']>;
  week?: Maybe<Scalars['Int']['output']>;
  weekday?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type De_Dwd_Data = {
  __typename?: 'de_dwd_data';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  sh?: Maybe<Scalars['Float']['output']>;
  station?: Maybe<De_Dwd_Stations>;
  tl_mittel?: Maybe<Scalars['Float']['output']>;
  tlmax?: Maybe<Scalars['Float']['output']>;
  tlmin?: Maybe<Scalars['Float']['output']>;
};


export type De_Dwd_DataStationArgs = {
  filter?: InputMaybe<De_Dwd_Stations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type De_Dwd_Data_Aggregated = {
  __typename?: 'de_dwd_data_aggregated';
  avg?: Maybe<De_Dwd_Data_Aggregated_Fields>;
  avgDistinct?: Maybe<De_Dwd_Data_Aggregated_Fields>;
  count?: Maybe<De_Dwd_Data_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<De_Dwd_Data_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<De_Dwd_Data_Aggregated_Fields>;
  min?: Maybe<De_Dwd_Data_Aggregated_Fields>;
  sum?: Maybe<De_Dwd_Data_Aggregated_Fields>;
  sumDistinct?: Maybe<De_Dwd_Data_Aggregated_Fields>;
};

export type De_Dwd_Data_Aggregated_Count = {
  __typename?: 'de_dwd_data_aggregated_count';
  date?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  sh?: Maybe<Scalars['Int']['output']>;
  station?: Maybe<Scalars['Int']['output']>;
  tl_mittel?: Maybe<Scalars['Int']['output']>;
  tlmax?: Maybe<Scalars['Int']['output']>;
  tlmin?: Maybe<Scalars['Int']['output']>;
};

export type De_Dwd_Data_Aggregated_Fields = {
  __typename?: 'de_dwd_data_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  sh?: Maybe<Scalars['Float']['output']>;
  tl_mittel?: Maybe<Scalars['Float']['output']>;
  tlmax?: Maybe<Scalars['Float']['output']>;
  tlmin?: Maybe<Scalars['Float']['output']>;
};

export type De_Dwd_Data_Filter = {
  _and?: InputMaybe<Array<InputMaybe<De_Dwd_Data_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<De_Dwd_Data_Filter>>>;
  date?: InputMaybe<Date_Filter_Operators>;
  date_func?: InputMaybe<Date_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  sh?: InputMaybe<Number_Filter_Operators>;
  station?: InputMaybe<De_Dwd_Stations_Filter>;
  tl_mittel?: InputMaybe<Number_Filter_Operators>;
  tlmax?: InputMaybe<Number_Filter_Operators>;
  tlmin?: InputMaybe<Number_Filter_Operators>;
};

export type De_Dwd_Data_Mutated = {
  __typename?: 'de_dwd_data_mutated';
  data?: Maybe<De_Dwd_Data>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type De_Dwd_Stations = {
  __typename?: 'de_dwd_stations';
  date_start?: Maybe<Scalars['Date']['output']>;
  date_start_func?: Maybe<Date_Functions>;
  height?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  snow_coverage?: Maybe<Scalars['Float']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  station?: Maybe<Scalars['String']['output']>;
};

export type De_Dwd_Stations_Aggregated = {
  __typename?: 'de_dwd_stations_aggregated';
  avg?: Maybe<De_Dwd_Stations_Aggregated_Fields>;
  avgDistinct?: Maybe<De_Dwd_Stations_Aggregated_Fields>;
  count?: Maybe<De_Dwd_Stations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<De_Dwd_Stations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<De_Dwd_Stations_Aggregated_Fields>;
  min?: Maybe<De_Dwd_Stations_Aggregated_Fields>;
  sum?: Maybe<De_Dwd_Stations_Aggregated_Fields>;
  sumDistinct?: Maybe<De_Dwd_Stations_Aggregated_Fields>;
};

export type De_Dwd_Stations_Aggregated_Count = {
  __typename?: 'de_dwd_stations_aggregated_count';
  date_start?: Maybe<Scalars['Int']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  latitude?: Maybe<Scalars['Int']['output']>;
  longitude?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
  snow_coverage?: Maybe<Scalars['Int']['output']>;
  state?: Maybe<Scalars['Int']['output']>;
  station?: Maybe<Scalars['Int']['output']>;
};

export type De_Dwd_Stations_Aggregated_Fields = {
  __typename?: 'de_dwd_stations_aggregated_fields';
  height?: Maybe<Scalars['Float']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  snow_coverage?: Maybe<Scalars['Float']['output']>;
};

export type De_Dwd_Stations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<De_Dwd_Stations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<De_Dwd_Stations_Filter>>>;
  date_start?: InputMaybe<Date_Filter_Operators>;
  date_start_func?: InputMaybe<Date_Function_Filter_Operators>;
  height?: InputMaybe<Number_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  latitude?: InputMaybe<Number_Filter_Operators>;
  longitude?: InputMaybe<Number_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
  snow_coverage?: InputMaybe<Number_Filter_Operators>;
  state?: InputMaybe<String_Filter_Operators>;
  station?: InputMaybe<String_Filter_Operators>;
};

export type De_Dwd_Stations_Mutated = {
  __typename?: 'de_dwd_stations_mutated';
  data?: Maybe<De_Dwd_Stations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Directus_Files = {
  __typename?: 'directus_files';
  charset?: Maybe<Scalars['String']['output']>;
  copyright?: Maybe<Scalars['String']['output']>;
  created_on?: Maybe<Scalars['Date']['output']>;
  created_on_func?: Maybe<Datetime_Functions>;
  description?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Int']['output']>;
  embed?: Maybe<Scalars['String']['output']>;
  filename_disk?: Maybe<Scalars['String']['output']>;
  filename_download: Scalars['String']['output'];
  filesize?: Maybe<Scalars['GraphQLBigInt']['output']>;
  focal_point_x?: Maybe<Scalars['Int']['output']>;
  focal_point_y?: Maybe<Scalars['Int']['output']>;
  folder?: Maybe<Scalars['String']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  link?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  metadata_func?: Maybe<Count_Functions>;
  modified_by?: Maybe<Directus_Users>;
  modified_on?: Maybe<Scalars['Date']['output']>;
  modified_on_func?: Maybe<Datetime_Functions>;
  storage: Scalars['String']['output'];
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  title?: Maybe<Scalars['String']['output']>;
  tus_data?: Maybe<Scalars['JSON']['output']>;
  tus_data_func?: Maybe<Count_Functions>;
  tus_id?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  uploaded_by?: Maybe<Directus_Users>;
  uploaded_on?: Maybe<Scalars['Date']['output']>;
  uploaded_on_func?: Maybe<Datetime_Functions>;
  width?: Maybe<Scalars['Int']['output']>;
};


export type Directus_FilesModified_ByArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Directus_FilesUploaded_ByArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Directus_Files_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Directus_Files_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Directus_Files_Filter>>>;
  charset?: InputMaybe<String_Filter_Operators>;
  copyright?: InputMaybe<String_Filter_Operators>;
  created_on?: InputMaybe<Date_Filter_Operators>;
  created_on_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  description?: InputMaybe<String_Filter_Operators>;
  duration?: InputMaybe<Number_Filter_Operators>;
  embed?: InputMaybe<String_Filter_Operators>;
  filename_disk?: InputMaybe<String_Filter_Operators>;
  filename_download?: InputMaybe<String_Filter_Operators>;
  filesize?: InputMaybe<Big_Int_Filter_Operators>;
  focal_point_x?: InputMaybe<Number_Filter_Operators>;
  focal_point_y?: InputMaybe<Number_Filter_Operators>;
  folder?: InputMaybe<String_Filter_Operators>;
  height?: InputMaybe<Number_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  link?: InputMaybe<String_Filter_Operators>;
  location?: InputMaybe<String_Filter_Operators>;
  metadata?: InputMaybe<String_Filter_Operators>;
  metadata_func?: InputMaybe<Count_Function_Filter_Operators>;
  modified_by?: InputMaybe<Directus_Users_Filter>;
  modified_on?: InputMaybe<Date_Filter_Operators>;
  modified_on_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  storage?: InputMaybe<String_Filter_Operators>;
  tags?: InputMaybe<String_Filter_Operators>;
  tags_func?: InputMaybe<Count_Function_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
  tus_data?: InputMaybe<String_Filter_Operators>;
  tus_data_func?: InputMaybe<Count_Function_Filter_Operators>;
  tus_id?: InputMaybe<String_Filter_Operators>;
  type?: InputMaybe<String_Filter_Operators>;
  uploaded_by?: InputMaybe<Directus_Users_Filter>;
  uploaded_on?: InputMaybe<Date_Filter_Operators>;
  uploaded_on_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  width?: InputMaybe<Number_Filter_Operators>;
};

export type Directus_Files_Mutated = {
  __typename?: 'directus_files_mutated';
  data?: Maybe<Directus_Files>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Directus_Presets = {
  __typename?: 'directus_presets';
  bookmark?: Maybe<Scalars['String']['output']>;
  collection?: Maybe<Scalars['String']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  filter?: Maybe<Scalars['JSON']['output']>;
  filter_func?: Maybe<Count_Functions>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  layout?: Maybe<Scalars['String']['output']>;
  layout_options?: Maybe<Scalars['JSON']['output']>;
  layout_options_func?: Maybe<Count_Functions>;
  layout_query?: Maybe<Scalars['JSON']['output']>;
  layout_query_func?: Maybe<Count_Functions>;
  refresh_interval?: Maybe<Scalars['Int']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  search?: Maybe<Scalars['String']['output']>;
  user?: Maybe<Directus_Users>;
};


export type Directus_PresetsUserArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Directus_Presets_Mutated = {
  __typename?: 'directus_presets_mutated';
  data?: Maybe<Directus_Presets>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Directus_Translations = {
  __typename?: 'directus_translations';
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  language: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Directus_Translations_Mutated = {
  __typename?: 'directus_translations_mutated';
  data?: Maybe<Directus_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Directus_Users = {
  __typename?: 'directus_users';
  avatar?: Maybe<Directus_Files>;
  description?: Maybe<Scalars['String']['output']>;
  first_name?: Maybe<Scalars['String']['output']>;
  last_name?: Maybe<Scalars['String']['output']>;
};


export type Directus_UsersAvatarArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Directus_Users_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Directus_Users_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Directus_Users_Filter>>>;
  avatar?: InputMaybe<Directus_Files_Filter>;
  description?: InputMaybe<String_Filter_Operators>;
  first_name?: InputMaybe<String_Filter_Operators>;
  last_name?: InputMaybe<String_Filter_Operators>;
};

export type Directus_Users_Mutated = {
  __typename?: 'directus_users_mutated';
  data?: Maybe<Directus_Users>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Ee_Goals = {
  __typename?: 'ee_goals';
  Country?: Maybe<Countries>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  current_production?: Maybe<Scalars['Float']['output']>;
  goal_amount?: Maybe<Scalars['String']['output']>;
  goal_year?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  last_update_check?: Maybe<Scalars['Date']['output']>;
  last_update_check_func?: Maybe<Date_Functions>;
  note?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Regions>;
  source_label?: Maybe<Scalars['String']['output']>;
  source_link?: Maybe<Scalars['String']['output']>;
  source_year?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};


export type Ee_GoalsCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Ee_GoalsRegionArgs = {
  filter?: InputMaybe<Regions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Ee_Goals_Aggregated = {
  __typename?: 'ee_goals_aggregated';
  avg?: Maybe<Ee_Goals_Aggregated_Fields>;
  avgDistinct?: Maybe<Ee_Goals_Aggregated_Fields>;
  count?: Maybe<Ee_Goals_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Ee_Goals_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Ee_Goals_Aggregated_Fields>;
  min?: Maybe<Ee_Goals_Aggregated_Fields>;
  sum?: Maybe<Ee_Goals_Aggregated_Fields>;
  sumDistinct?: Maybe<Ee_Goals_Aggregated_Fields>;
};

export type Ee_Goals_Aggregated_Count = {
  __typename?: 'ee_goals_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  Type?: Maybe<Scalars['Int']['output']>;
  current_production?: Maybe<Scalars['Int']['output']>;
  goal_amount?: Maybe<Scalars['Int']['output']>;
  goal_year?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  last_update_check?: Maybe<Scalars['Int']['output']>;
  note?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  source_label?: Maybe<Scalars['Int']['output']>;
  source_link?: Maybe<Scalars['Int']['output']>;
  source_year?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
};

export type Ee_Goals_Aggregated_Fields = {
  __typename?: 'ee_goals_aggregated_fields';
  current_production?: Maybe<Scalars['Float']['output']>;
  goal_year?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  source_year?: Maybe<Scalars['Float']['output']>;
};

export type Ee_Goals_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  Type?: InputMaybe<String_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Ee_Goals_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Ee_Goals_Filter>>>;
  current_production?: InputMaybe<Number_Filter_Operators>;
  goal_amount?: InputMaybe<String_Filter_Operators>;
  goal_year?: InputMaybe<Number_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  last_update_check?: InputMaybe<Date_Filter_Operators>;
  last_update_check_func?: InputMaybe<Date_Function_Filter_Operators>;
  note?: InputMaybe<String_Filter_Operators>;
  region?: InputMaybe<Regions_Filter>;
  source_label?: InputMaybe<String_Filter_Operators>;
  source_link?: InputMaybe<String_Filter_Operators>;
  source_year?: InputMaybe<Number_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
};

export type Ee_Goals_Mutated = {
  __typename?: 'ee_goals_mutated';
  data?: Maybe<Ee_Goals>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Ee_Historisch = {
  __typename?: 'ee_historisch';
  Country?: Maybe<Countries>;
  id: Scalars['ID']['output'];
  pv?: Maybe<Scalars['Float']['output']>;
  region?: Maybe<Regions>;
  wasserkraft?: Maybe<Scalars['Float']['output']>;
  windkraft?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};


export type Ee_HistorischCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Ee_HistorischRegionArgs = {
  filter?: InputMaybe<Regions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Ee_Historisch_Aggregated = {
  __typename?: 'ee_historisch_aggregated';
  avg?: Maybe<Ee_Historisch_Aggregated_Fields>;
  avgDistinct?: Maybe<Ee_Historisch_Aggregated_Fields>;
  count?: Maybe<Ee_Historisch_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Ee_Historisch_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Ee_Historisch_Aggregated_Fields>;
  min?: Maybe<Ee_Historisch_Aggregated_Fields>;
  sum?: Maybe<Ee_Historisch_Aggregated_Fields>;
  sumDistinct?: Maybe<Ee_Historisch_Aggregated_Fields>;
};

export type Ee_Historisch_Aggregated_Count = {
  __typename?: 'ee_historisch_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  pv?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  wasserkraft?: Maybe<Scalars['Int']['output']>;
  windkraft?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Ee_Historisch_Aggregated_Fields = {
  __typename?: 'ee_historisch_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  pv?: Maybe<Scalars['Float']['output']>;
  wasserkraft?: Maybe<Scalars['Float']['output']>;
  windkraft?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Float']['output']>;
};

export type Ee_Historisch_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  _and?: InputMaybe<Array<InputMaybe<Ee_Historisch_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Ee_Historisch_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  pv?: InputMaybe<Number_Filter_Operators>;
  region?: InputMaybe<Regions_Filter>;
  wasserkraft?: InputMaybe<Number_Filter_Operators>;
  windkraft?: InputMaybe<Number_Filter_Operators>;
  year?: InputMaybe<Number_Filter_Operators>;
};

export type Ee_Historisch_Mutated = {
  __typename?: 'ee_historisch_mutated';
  data?: Maybe<Ee_Historisch>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Ee_Potentiale = {
  __typename?: 'ee_potentiale';
  Country?: Maybe<Countries>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  link?: Maybe<Scalars['String']['output']>;
  note?: Maybe<Scalars['String']['output']>;
  potential_class?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  region?: Maybe<Regions>;
  source?: Maybe<Scalars['String']['output']>;
  value_TWh?: Maybe<Scalars['Float']['output']>;
};


export type Ee_PotentialeCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Ee_PotentialeRegionArgs = {
  filter?: InputMaybe<Regions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Ee_Potentiale_Aggregated = {
  __typename?: 'ee_potentiale_aggregated';
  avg?: Maybe<Ee_Potentiale_Aggregated_Fields>;
  avgDistinct?: Maybe<Ee_Potentiale_Aggregated_Fields>;
  count?: Maybe<Ee_Potentiale_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Ee_Potentiale_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Ee_Potentiale_Aggregated_Fields>;
  min?: Maybe<Ee_Potentiale_Aggregated_Fields>;
  sum?: Maybe<Ee_Potentiale_Aggregated_Fields>;
  sumDistinct?: Maybe<Ee_Potentiale_Aggregated_Fields>;
};

export type Ee_Potentiale_Aggregated_Count = {
  __typename?: 'ee_potentiale_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  Type?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  link?: Maybe<Scalars['Int']['output']>;
  note?: Maybe<Scalars['Int']['output']>;
  potential_class?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  value_TWh?: Maybe<Scalars['Int']['output']>;
};

export type Ee_Potentiale_Aggregated_Fields = {
  __typename?: 'ee_potentiale_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value_TWh?: Maybe<Scalars['Float']['output']>;
};

export type Ee_Potentiale_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  Type?: InputMaybe<String_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Ee_Potentiale_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Ee_Potentiale_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  link?: InputMaybe<String_Filter_Operators>;
  note?: InputMaybe<String_Filter_Operators>;
  potential_class?: InputMaybe<String_Filter_Operators>;
  region?: InputMaybe<Regions_Filter>;
  source?: InputMaybe<String_Filter_Operators>;
  value_TWh?: InputMaybe<Number_Filter_Operators>;
};

export type Ee_Potentiale_Mutated = {
  __typename?: 'ee_potentiale_mutated';
  data?: Maybe<Ee_Potentiale>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Ee_Produktion = {
  __typename?: 'ee_produktion';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};


export type Ee_ProduktionCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Ee_Produktion_Aggregated = {
  __typename?: 'ee_produktion_aggregated';
  avg?: Maybe<Ee_Produktion_Aggregated_Fields>;
  avgDistinct?: Maybe<Ee_Produktion_Aggregated_Fields>;
  count?: Maybe<Ee_Produktion_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Ee_Produktion_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Ee_Produktion_Aggregated_Fields>;
  min?: Maybe<Ee_Produktion_Aggregated_Fields>;
  sum?: Maybe<Ee_Produktion_Aggregated_Fields>;
  sumDistinct?: Maybe<Ee_Produktion_Aggregated_Fields>;
};

export type Ee_Produktion_Aggregated_Count = {
  __typename?: 'ee_produktion_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  Type?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Ee_Produktion_Aggregated_Fields = {
  __typename?: 'ee_produktion_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Ee_Produktion_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  Type?: InputMaybe<String_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Ee_Produktion_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Ee_Produktion_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Ee_Produktion_Mutated = {
  __typename?: 'ee_produktion_mutated';
  data?: Maybe<Ee_Produktion>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Ee_Zielpfad = {
  __typename?: 'ee_zielpfad';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
};


export type Ee_ZielpfadCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Ee_Zielpfad_Aggregated = {
  __typename?: 'ee_zielpfad_aggregated';
  avg?: Maybe<Ee_Zielpfad_Aggregated_Fields>;
  avgDistinct?: Maybe<Ee_Zielpfad_Aggregated_Fields>;
  count?: Maybe<Ee_Zielpfad_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Ee_Zielpfad_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Ee_Zielpfad_Aggregated_Fields>;
  min?: Maybe<Ee_Zielpfad_Aggregated_Fields>;
  sum?: Maybe<Ee_Zielpfad_Aggregated_Fields>;
  sumDistinct?: Maybe<Ee_Zielpfad_Aggregated_Fields>;
};

export type Ee_Zielpfad_Aggregated_Count = {
  __typename?: 'ee_zielpfad_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  Type?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Ee_Zielpfad_Aggregated_Fields = {
  __typename?: 'ee_zielpfad_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Ee_Zielpfad_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  Type?: InputMaybe<String_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Ee_Zielpfad_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Ee_Zielpfad_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Ee_Zielpfad_Mutated = {
  __typename?: 'ee_zielpfad_mutated';
  data?: Maybe<Ee_Zielpfad>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Emissions = {
  __typename?: 'emissions';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  update?: Maybe<Scalars['Date']['output']>;
  update_func?: Maybe<Datetime_Functions>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Emissions_Aggregated = {
  __typename?: 'emissions_aggregated';
  avg?: Maybe<Emissions_Aggregated_Fields>;
  avgDistinct?: Maybe<Emissions_Aggregated_Fields>;
  count?: Maybe<Emissions_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Emissions_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Emissions_Aggregated_Fields>;
  min?: Maybe<Emissions_Aggregated_Fields>;
  sum?: Maybe<Emissions_Aggregated_Fields>;
  sumDistinct?: Maybe<Emissions_Aggregated_Fields>;
};

export type Emissions_Aggregated_Count = {
  __typename?: 'emissions_aggregated_count';
  category?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  note?: Maybe<Scalars['Int']['output']>;
  period?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
  update?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Emissions_Aggregated_Fields = {
  __typename?: 'emissions_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Emissions_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Emissions_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Emissions_Filter>>>;
  category?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  note?: InputMaybe<String_Filter_Operators>;
  period?: InputMaybe<String_Filter_Operators>;
  region?: InputMaybe<String_Filter_Operators>;
  source?: InputMaybe<String_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
  update?: InputMaybe<Date_Filter_Operators>;
  update_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Emissions_Mutated = {
  __typename?: 'emissions_mutated';
  data?: Maybe<Emissions>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Energy = {
  __typename?: 'energy';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['String']['output']>;
  period_x?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  update?: Maybe<Scalars['Date']['output']>;
  update_func?: Maybe<Datetime_Functions>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Energy_Aggregated = {
  __typename?: 'energy_aggregated';
  avg?: Maybe<Energy_Aggregated_Fields>;
  avgDistinct?: Maybe<Energy_Aggregated_Fields>;
  count?: Maybe<Energy_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Energy_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Energy_Aggregated_Fields>;
  min?: Maybe<Energy_Aggregated_Fields>;
  sum?: Maybe<Energy_Aggregated_Fields>;
  sumDistinct?: Maybe<Energy_Aggregated_Fields>;
};

export type Energy_Aggregated_Count = {
  __typename?: 'energy_aggregated_count';
  category?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  note?: Maybe<Scalars['Int']['output']>;
  period?: Maybe<Scalars['Int']['output']>;
  period_x?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
  update?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Energy_Aggregated_Fields = {
  __typename?: 'energy_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Energy_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Energy_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Energy_Filter>>>;
  category?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  note?: InputMaybe<String_Filter_Operators>;
  period?: InputMaybe<String_Filter_Operators>;
  period_x?: InputMaybe<String_Filter_Operators>;
  region?: InputMaybe<String_Filter_Operators>;
  source?: InputMaybe<String_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
  update?: InputMaybe<Date_Filter_Operators>;
  update_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Energy_Mutated = {
  __typename?: 'energy_mutated';
  data?: Maybe<Energy>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Energy_Renewable_Share = {
  __typename?: 'energy_renewable_share';
  category?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Countries>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['Date']['output']>;
  period_func?: Maybe<Datetime_Functions>;
  value?: Maybe<Scalars['Float']['output']>;
};


export type Energy_Renewable_ShareCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Energy_Renewable_Share_Aggregated = {
  __typename?: 'energy_renewable_share_aggregated';
  avg?: Maybe<Energy_Renewable_Share_Aggregated_Fields>;
  avgDistinct?: Maybe<Energy_Renewable_Share_Aggregated_Fields>;
  count?: Maybe<Energy_Renewable_Share_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Energy_Renewable_Share_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Energy_Renewable_Share_Aggregated_Fields>;
  min?: Maybe<Energy_Renewable_Share_Aggregated_Fields>;
  sum?: Maybe<Energy_Renewable_Share_Aggregated_Fields>;
  sumDistinct?: Maybe<Energy_Renewable_Share_Aggregated_Fields>;
};

export type Energy_Renewable_Share_Aggregated_Count = {
  __typename?: 'energy_renewable_share_aggregated_count';
  category?: Maybe<Scalars['Int']['output']>;
  country?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  note?: Maybe<Scalars['Int']['output']>;
  period?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Energy_Renewable_Share_Aggregated_Fields = {
  __typename?: 'energy_renewable_share_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Energy_Renewable_Share_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Energy_Renewable_Share_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Energy_Renewable_Share_Filter>>>;
  category?: InputMaybe<String_Filter_Operators>;
  country?: InputMaybe<Countries_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  note?: InputMaybe<String_Filter_Operators>;
  period?: InputMaybe<Date_Filter_Operators>;
  period_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Energy_Renewable_Share_Mutated = {
  __typename?: 'energy_renewable_share_mutated';
  data?: Maybe<Energy_Renewable_Share>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Erneuerbare_2030_Scenarios = {
  __typename?: 'erneuerbare_2030_scenarios';
  Country?: Maybe<Countries>;
  energy_type?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  release_date?: Maybe<Scalars['Date']['output']>;
  release_date_func?: Maybe<Date_Functions>;
  scenario?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};


export type Erneuerbare_2030_ScenariosCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Erneuerbare_2030_Scenarios_Aggregated = {
  __typename?: 'erneuerbare_2030_scenarios_aggregated';
  avg?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Fields>;
  avgDistinct?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Fields>;
  count?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Fields>;
  min?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Fields>;
  sum?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Fields>;
  sumDistinct?: Maybe<Erneuerbare_2030_Scenarios_Aggregated_Fields>;
};

export type Erneuerbare_2030_Scenarios_Aggregated_Count = {
  __typename?: 'erneuerbare_2030_scenarios_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  energy_type?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  release_date?: Maybe<Scalars['Int']['output']>;
  scenario?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Erneuerbare_2030_Scenarios_Aggregated_Fields = {
  __typename?: 'erneuerbare_2030_scenarios_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Float']['output']>;
};

export type Erneuerbare_2030_Scenarios_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  _and?: InputMaybe<Array<InputMaybe<Erneuerbare_2030_Scenarios_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Erneuerbare_2030_Scenarios_Filter>>>;
  energy_type?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  release_date?: InputMaybe<Date_Filter_Operators>;
  release_date_func?: InputMaybe<Date_Function_Filter_Operators>;
  scenario?: InputMaybe<String_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
  year?: InputMaybe<Number_Filter_Operators>;
};

export type Erneuerbare_2030_Scenarios_Mutated = {
  __typename?: 'erneuerbare_2030_scenarios_mutated';
  data?: Maybe<Erneuerbare_2030_Scenarios>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Gas_Imports = {
  __typename?: 'gas_imports';
  Country?: Maybe<Countries>;
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  import_country?: Maybe<Countries>;
  /** alternative to "import_country". will be used if "import_country" is null. */
  import_source?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};


export type Gas_ImportsCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Gas_ImportsImport_CountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Gas_Imports_Aggregated = {
  __typename?: 'gas_imports_aggregated';
  avg?: Maybe<Gas_Imports_Aggregated_Fields>;
  avgDistinct?: Maybe<Gas_Imports_Aggregated_Fields>;
  count?: Maybe<Gas_Imports_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Gas_Imports_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Gas_Imports_Aggregated_Fields>;
  min?: Maybe<Gas_Imports_Aggregated_Fields>;
  sum?: Maybe<Gas_Imports_Aggregated_Fields>;
  sumDistinct?: Maybe<Gas_Imports_Aggregated_Fields>;
};

export type Gas_Imports_Aggregated_Count = {
  __typename?: 'gas_imports_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  date?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  import_country?: Maybe<Scalars['Int']['output']>;
  /** alternative to "import_country". will be used if "import_country" is null. */
  import_source?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Gas_Imports_Aggregated_Fields = {
  __typename?: 'gas_imports_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Gas_Imports_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  _and?: InputMaybe<Array<InputMaybe<Gas_Imports_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Gas_Imports_Filter>>>;
  date?: InputMaybe<Date_Filter_Operators>;
  date_func?: InputMaybe<Date_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  import_country?: InputMaybe<Countries_Filter>;
  import_source?: InputMaybe<String_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Gas_Imports_Mutated = {
  __typename?: 'gas_imports_mutated';
  data?: Maybe<Gas_Imports>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Global_Co2_Concentration = {
  __typename?: 'global_co2_concentration';
  id: Scalars['ID']['output'];
  mean?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Global_Co2_Concentration_Aggregated = {
  __typename?: 'global_co2_concentration_aggregated';
  avg?: Maybe<Global_Co2_Concentration_Aggregated_Fields>;
  avgDistinct?: Maybe<Global_Co2_Concentration_Aggregated_Fields>;
  count?: Maybe<Global_Co2_Concentration_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Global_Co2_Concentration_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Global_Co2_Concentration_Aggregated_Fields>;
  min?: Maybe<Global_Co2_Concentration_Aggregated_Fields>;
  sum?: Maybe<Global_Co2_Concentration_Aggregated_Fields>;
  sumDistinct?: Maybe<Global_Co2_Concentration_Aggregated_Fields>;
};

export type Global_Co2_Concentration_Aggregated_Count = {
  __typename?: 'global_co2_concentration_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  mean?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Global_Co2_Concentration_Aggregated_Fields = {
  __typename?: 'global_co2_concentration_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  mean?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Float']['output']>;
};

export type Global_Co2_Concentration_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Global_Co2_Concentration_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Global_Co2_Concentration_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  mean?: InputMaybe<Number_Filter_Operators>;
  year?: InputMaybe<Number_Filter_Operators>;
};

export type Global_Co2_Concentration_Mutated = {
  __typename?: 'global_co2_concentration_mutated';
  data?: Maybe<Global_Co2_Concentration>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Glossary = {
  __typename?: 'glossary';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  key?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Array<Maybe<Glossary_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type GlossaryTranslationsArgs = {
  filter?: InputMaybe<Glossary_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type GlossaryUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type GlossaryUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Glossary_Aggregated = {
  __typename?: 'glossary_aggregated';
  count?: Maybe<Glossary_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Glossary_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Glossary_Aggregated_Count = {
  __typename?: 'glossary_aggregated_count';
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  key?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Glossary_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Glossary_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Glossary_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  key?: InputMaybe<String_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Glossary_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Glossary_Mutated = {
  __typename?: 'glossary_mutated';
  data?: Maybe<Glossary>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Glossary_Translations = {
  __typename?: 'glossary_translations';
  glossary_id?: Maybe<Glossary>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Glossary_TranslationsGlossary_IdArgs = {
  filter?: InputMaybe<Glossary_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Glossary_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Glossary_Translations_Aggregated = {
  __typename?: 'glossary_translations_aggregated';
  avg?: Maybe<Glossary_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Glossary_Translations_Aggregated_Fields>;
  count?: Maybe<Glossary_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Glossary_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Glossary_Translations_Aggregated_Fields>;
  min?: Maybe<Glossary_Translations_Aggregated_Fields>;
  sum?: Maybe<Glossary_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Glossary_Translations_Aggregated_Fields>;
};

export type Glossary_Translations_Aggregated_Count = {
  __typename?: 'glossary_translations_aggregated_count';
  glossary_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Glossary_Translations_Aggregated_Fields = {
  __typename?: 'glossary_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Glossary_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Glossary_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Glossary_Translations_Filter>>>;
  glossary_id?: InputMaybe<Glossary_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  text?: InputMaybe<String_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Glossary_Translations_Mutated = {
  __typename?: 'glossary_translations_mutated';
  data?: Maybe<Glossary_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Languages = {
  __typename?: 'languages';
  code: Scalars['ID']['output'];
  direction?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type Languages_Aggregated = {
  __typename?: 'languages_aggregated';
  count?: Maybe<Languages_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Languages_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Languages_Aggregated_Count = {
  __typename?: 'languages_aggregated_count';
  code?: Maybe<Scalars['Int']['output']>;
  direction?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
};

export type Languages_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Languages_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Languages_Filter>>>;
  code?: InputMaybe<String_Filter_Operators>;
  direction?: InputMaybe<String_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
};

export type Languages_Mutated = {
  __typename?: 'languages_mutated';
  data?: Maybe<Languages>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Mobility = {
  __typename?: 'mobility';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Mobility_Aggregated = {
  __typename?: 'mobility_aggregated';
  avg?: Maybe<Mobility_Aggregated_Fields>;
  avgDistinct?: Maybe<Mobility_Aggregated_Fields>;
  count?: Maybe<Mobility_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Mobility_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Mobility_Aggregated_Fields>;
  min?: Maybe<Mobility_Aggregated_Fields>;
  sum?: Maybe<Mobility_Aggregated_Fields>;
  sumDistinct?: Maybe<Mobility_Aggregated_Fields>;
};

export type Mobility_Aggregated_Count = {
  __typename?: 'mobility_aggregated_count';
  category?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  note?: Maybe<Scalars['Int']['output']>;
  period?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Mobility_Aggregated_Fields = {
  __typename?: 'mobility_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Mobility_Cars = {
  __typename?: 'mobility_cars';
  category?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Countries>;
  id: Scalars['ID']['output'];
  period?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};


export type Mobility_CarsCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Mobility_Cars_Aggregated = {
  __typename?: 'mobility_cars_aggregated';
  avg?: Maybe<Mobility_Cars_Aggregated_Fields>;
  avgDistinct?: Maybe<Mobility_Cars_Aggregated_Fields>;
  count?: Maybe<Mobility_Cars_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Mobility_Cars_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Mobility_Cars_Aggregated_Fields>;
  min?: Maybe<Mobility_Cars_Aggregated_Fields>;
  sum?: Maybe<Mobility_Cars_Aggregated_Fields>;
  sumDistinct?: Maybe<Mobility_Cars_Aggregated_Fields>;
};

export type Mobility_Cars_Aggregated_Count = {
  __typename?: 'mobility_cars_aggregated_count';
  category?: Maybe<Scalars['Int']['output']>;
  country?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  period?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['Int']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Mobility_Cars_Aggregated_Fields = {
  __typename?: 'mobility_cars_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Mobility_Cars_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Mobility_Cars_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Mobility_Cars_Filter>>>;
  category?: InputMaybe<String_Filter_Operators>;
  country?: InputMaybe<Countries_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  period?: InputMaybe<String_Filter_Operators>;
  region?: InputMaybe<String_Filter_Operators>;
  source?: InputMaybe<String_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Mobility_Cars_Mutated = {
  __typename?: 'mobility_cars_mutated';
  data?: Maybe<Mobility_Cars>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Mobility_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Mobility_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Mobility_Filter>>>;
  category?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  note?: InputMaybe<String_Filter_Operators>;
  period?: InputMaybe<String_Filter_Operators>;
  region?: InputMaybe<String_Filter_Operators>;
  source?: InputMaybe<String_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
  value?: InputMaybe<Number_Filter_Operators>;
};

export type Mobility_Mutated = {
  __typename?: 'mobility_mutated';
  data?: Maybe<Mobility>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type News = {
  __typename?: 'news';
  author?: Maybe<Directus_Users>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  sites?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  slack_message_id?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Array<Maybe<News_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
};


export type NewsAuthorArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type NewsTranslationsArgs = {
  filter?: InputMaybe<News_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type News_Aggregated = {
  __typename?: 'news_aggregated';
  avg?: Maybe<News_Aggregated_Fields>;
  avgDistinct?: Maybe<News_Aggregated_Fields>;
  count?: Maybe<News_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<News_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<News_Aggregated_Fields>;
  min?: Maybe<News_Aggregated_Fields>;
  sum?: Maybe<News_Aggregated_Fields>;
  sumDistinct?: Maybe<News_Aggregated_Fields>;
};

export type News_Aggregated_Count = {
  __typename?: 'news_aggregated_count';
  author?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  sites?: Maybe<Scalars['Int']['output']>;
  slack_message_id?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
};

export type News_Aggregated_Fields = {
  __typename?: 'news_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type News_Filter = {
  _and?: InputMaybe<Array<InputMaybe<News_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<News_Filter>>>;
  author?: InputMaybe<Directus_Users_Filter>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  sites?: InputMaybe<String_Filter_Operators>;
  slack_message_id?: InputMaybe<String_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<News_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type News_Mutated = {
  __typename?: 'news_mutated';
  data?: Maybe<News>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type News_Translations = {
  __typename?: 'news_translations';
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  news_id?: Maybe<News>;
  text?: Maybe<Scalars['String']['output']>;
};


export type News_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type News_TranslationsNews_IdArgs = {
  filter?: InputMaybe<News_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type News_Translations_Aggregated = {
  __typename?: 'news_translations_aggregated';
  avg?: Maybe<News_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<News_Translations_Aggregated_Fields>;
  count?: Maybe<News_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<News_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<News_Translations_Aggregated_Fields>;
  min?: Maybe<News_Translations_Aggregated_Fields>;
  sum?: Maybe<News_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<News_Translations_Aggregated_Fields>;
};

export type News_Translations_Aggregated_Count = {
  __typename?: 'news_translations_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  news_id?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
};

export type News_Translations_Aggregated_Fields = {
  __typename?: 'news_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  news_id?: Maybe<Scalars['Float']['output']>;
};

export type News_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<News_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<News_Translations_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  news_id?: InputMaybe<News_Filter>;
  text?: InputMaybe<String_Filter_Operators>;
};

export type News_Translations_Mutated = {
  __typename?: 'news_translations_mutated';
  data?: Maybe<News_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Number_Filter_Operators = {
  _between?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _eq?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _gt?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _gte?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _in?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _lt?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _lte?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _nbetween?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _neq?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _nin?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Pages = {
  __typename?: 'pages';
  blocks?: Maybe<Array<Maybe<Pages_Blocks>>>;
  blocks_func?: Maybe<Count_Functions>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  site?: Maybe<Sites>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Array<Maybe<Pages_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type PagesBlocksArgs = {
  filter?: InputMaybe<Pages_Blocks_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PagesSiteArgs = {
  filter?: InputMaybe<Sites_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PagesTranslationsArgs = {
  filter?: InputMaybe<Pages_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PagesUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PagesUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Pages_Aggregated = {
  __typename?: 'pages_aggregated';
  avg?: Maybe<Pages_Aggregated_Fields>;
  avgDistinct?: Maybe<Pages_Aggregated_Fields>;
  count?: Maybe<Pages_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Pages_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Pages_Aggregated_Fields>;
  min?: Maybe<Pages_Aggregated_Fields>;
  sum?: Maybe<Pages_Aggregated_Fields>;
  sumDistinct?: Maybe<Pages_Aggregated_Fields>;
};

export type Pages_Aggregated_Count = {
  __typename?: 'pages_aggregated_count';
  blocks?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  site?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Pages_Aggregated_Fields = {
  __typename?: 'pages_aggregated_fields';
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Pages_Blocks = {
  __typename?: 'pages_blocks';
  collection?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  item?: Maybe<Pages_Blocks_Item_Union>;
  pages_id?: Maybe<Pages>;
  sort?: Maybe<Scalars['Int']['output']>;
};


export type Pages_BlocksPages_IdArgs = {
  filter?: InputMaybe<Pages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Pages_Blocks_Aggregated = {
  __typename?: 'pages_blocks_aggregated';
  avg?: Maybe<Pages_Blocks_Aggregated_Fields>;
  avgDistinct?: Maybe<Pages_Blocks_Aggregated_Fields>;
  count?: Maybe<Pages_Blocks_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Pages_Blocks_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Pages_Blocks_Aggregated_Fields>;
  min?: Maybe<Pages_Blocks_Aggregated_Fields>;
  sum?: Maybe<Pages_Blocks_Aggregated_Fields>;
  sumDistinct?: Maybe<Pages_Blocks_Aggregated_Fields>;
};

export type Pages_Blocks_Aggregated_Count = {
  __typename?: 'pages_blocks_aggregated_count';
  collection?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  item?: Maybe<Scalars['Int']['output']>;
  pages_id?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
};

export type Pages_Blocks_Aggregated_Fields = {
  __typename?: 'pages_blocks_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Pages_Blocks_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Pages_Blocks_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Pages_Blocks_Filter>>>;
  collection?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  item__block_chart?: InputMaybe<Block_Chart_Filter>;
  item__block_donation?: InputMaybe<Block_Donation_Filter>;
  item__block_gallery?: InputMaybe<Block_Gallery_Filter>;
  item__block_grid?: InputMaybe<Block_Grid_Filter>;
  item__block_items?: InputMaybe<Block_Items_Filter>;
  item__block_news?: InputMaybe<Block_News_Filter>;
  item__block_panel?: InputMaybe<Block_Panel_Filter>;
  item__block_quiz?: InputMaybe<Block_Quiz_Filter>;
  item__block_quotes?: InputMaybe<Block_Quotes_Filter>;
  item__block_richtext?: InputMaybe<Block_Richtext_Filter>;
  item__block_teaser?: InputMaybe<Block_Teaser_Filter>;
  item__block_toggle?: InputMaybe<Block_Toggle_Filter>;
  pages_id?: InputMaybe<Pages_Filter>;
  sort?: InputMaybe<Number_Filter_Operators>;
};

export type Pages_Blocks_Item_Union = Block_Chart | Block_Donation | Block_Gallery | Block_Grid | Block_Items | Block_News | Block_Panel | Block_Quiz | Block_Quotes | Block_Richtext | Block_Teaser | Block_Toggle;

export type Pages_Blocks_Mutated = {
  __typename?: 'pages_blocks_mutated';
  data?: Maybe<Pages_Blocks>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Pages_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Pages_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Pages_Filter>>>;
  blocks?: InputMaybe<Pages_Blocks_Filter>;
  blocks_func?: InputMaybe<Count_Function_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  site?: InputMaybe<Sites_Filter>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Pages_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Pages_Mutated = {
  __typename?: 'pages_mutated';
  data?: Maybe<Pages>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Pages_Translations = {
  __typename?: 'pages_translations';
  description?: Maybe<Scalars['String']['output']>;
  heading?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  pages_id?: Maybe<Pages>;
  seo?: Maybe<Seo>;
  slug?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Pages_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Pages_TranslationsPages_IdArgs = {
  filter?: InputMaybe<Pages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Pages_TranslationsSeoArgs = {
  filter?: InputMaybe<Seo_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Pages_Translations_Aggregated = {
  __typename?: 'pages_translations_aggregated';
  avg?: Maybe<Pages_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Pages_Translations_Aggregated_Fields>;
  count?: Maybe<Pages_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Pages_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Pages_Translations_Aggregated_Fields>;
  min?: Maybe<Pages_Translations_Aggregated_Fields>;
  sum?: Maybe<Pages_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Pages_Translations_Aggregated_Fields>;
};

export type Pages_Translations_Aggregated_Count = {
  __typename?: 'pages_translations_aggregated_count';
  description?: Maybe<Scalars['Int']['output']>;
  heading?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  pages_id?: Maybe<Scalars['Int']['output']>;
  seo?: Maybe<Scalars['Int']['output']>;
  slug?: Maybe<Scalars['Int']['output']>;
  tags?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Pages_Translations_Aggregated_Fields = {
  __typename?: 'pages_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Pages_Translations_Blocks = {
  __typename?: 'pages_translations_blocks';
  collection?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  item?: Maybe<Pages_Translations_Blocks_Item_Union>;
  pages_translations_id?: Maybe<Pages_Translations>;
  sort?: Maybe<Scalars['Int']['output']>;
};


export type Pages_Translations_BlocksPages_Translations_IdArgs = {
  filter?: InputMaybe<Pages_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Pages_Translations_Blocks_Aggregated = {
  __typename?: 'pages_translations_blocks_aggregated';
  avg?: Maybe<Pages_Translations_Blocks_Aggregated_Fields>;
  avgDistinct?: Maybe<Pages_Translations_Blocks_Aggregated_Fields>;
  count?: Maybe<Pages_Translations_Blocks_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Pages_Translations_Blocks_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Pages_Translations_Blocks_Aggregated_Fields>;
  min?: Maybe<Pages_Translations_Blocks_Aggregated_Fields>;
  sum?: Maybe<Pages_Translations_Blocks_Aggregated_Fields>;
  sumDistinct?: Maybe<Pages_Translations_Blocks_Aggregated_Fields>;
};

export type Pages_Translations_Blocks_Aggregated_Count = {
  __typename?: 'pages_translations_blocks_aggregated_count';
  collection?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  item?: Maybe<Scalars['Int']['output']>;
  pages_translations_id?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
};

export type Pages_Translations_Blocks_Aggregated_Fields = {
  __typename?: 'pages_translations_blocks_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  pages_translations_id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Pages_Translations_Blocks_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Pages_Translations_Blocks_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Pages_Translations_Blocks_Filter>>>;
  collection?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  item__block_chart?: InputMaybe<Block_Chart_Filter>;
  item__block_donation?: InputMaybe<Block_Donation_Filter>;
  item__block_gallery?: InputMaybe<Block_Gallery_Filter>;
  item__block_grid?: InputMaybe<Block_Grid_Filter>;
  item__block_items?: InputMaybe<Block_Items_Filter>;
  item__block_quiz?: InputMaybe<Block_Quiz_Filter>;
  item__block_quotes?: InputMaybe<Block_Quotes_Filter>;
  item__block_richtext?: InputMaybe<Block_Richtext_Filter>;
  item__block_teaser?: InputMaybe<Block_Teaser_Filter>;
  item__block_toggle?: InputMaybe<Block_Toggle_Filter>;
  pages_translations_id?: InputMaybe<Pages_Translations_Filter>;
  sort?: InputMaybe<Number_Filter_Operators>;
};

export type Pages_Translations_Blocks_Item_Union = Block_Chart | Block_Donation | Block_Gallery | Block_Grid | Block_Items | Block_Quiz | Block_Quotes | Block_Richtext | Block_Teaser | Block_Toggle;

export type Pages_Translations_Blocks_Mutated = {
  __typename?: 'pages_translations_blocks_mutated';
  data?: Maybe<Pages_Translations_Blocks>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Pages_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Pages_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Pages_Translations_Filter>>>;
  description?: InputMaybe<String_Filter_Operators>;
  heading?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  pages_id?: InputMaybe<Pages_Filter>;
  seo?: InputMaybe<Seo_Filter>;
  slug?: InputMaybe<String_Filter_Operators>;
  tags?: InputMaybe<String_Filter_Operators>;
  tags_func?: InputMaybe<Count_Function_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Pages_Translations_Mutated = {
  __typename?: 'pages_translations_mutated';
  data?: Maybe<Pages_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies = {
  __typename?: 'policies';
  attributes?: Maybe<Array<Maybe<Policies_Policies_Attributes>>>;
  attributes_func?: Maybe<Count_Functions>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  stakeholders?: Maybe<Array<Maybe<Policies_Stakeholders>>>;
  stakeholders_func?: Maybe<Count_Functions>;
  status?: Maybe<Policies_Status>;
  translations?: Maybe<Array<Maybe<Policies_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  updates?: Maybe<Array<Maybe<Policies_Updates>>>;
  updates_func?: Maybe<Count_Functions>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type PoliciesAttributesArgs = {
  filter?: InputMaybe<Policies_Policies_Attributes_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PoliciesStakeholdersArgs = {
  filter?: InputMaybe<Policies_Stakeholders_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PoliciesStatusArgs = {
  filter?: InputMaybe<Policies_Status_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PoliciesTranslationsArgs = {
  filter?: InputMaybe<Policies_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PoliciesUpdatesArgs = {
  filter?: InputMaybe<Policies_Updates_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PoliciesUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type PoliciesUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Aggregated = {
  __typename?: 'policies_aggregated';
  avg?: Maybe<Policies_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Aggregated_Fields>;
  count?: Maybe<Policies_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Aggregated_Fields>;
  min?: Maybe<Policies_Aggregated_Fields>;
  sum?: Maybe<Policies_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Aggregated_Fields>;
};

export type Policies_Aggregated_Count = {
  __typename?: 'policies_aggregated_count';
  attributes?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  rating?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  stakeholders?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  updates?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Aggregated_Fields = {
  __typename?: 'policies_aggregated_fields';
  rating?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Attributes = {
  __typename?: 'policies_attributes';
  icon?: Maybe<Scalars['String']['output']>;
  key: Scalars['ID']['output'];
  translations?: Maybe<Array<Maybe<Policies_Attributes_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  type?: Maybe<Scalars['String']['output']>;
};


export type Policies_AttributesTranslationsArgs = {
  filter?: InputMaybe<Policies_Attributes_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Attributes_Aggregated = {
  __typename?: 'policies_attributes_aggregated';
  count?: Maybe<Policies_Attributes_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Attributes_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Policies_Attributes_Aggregated_Count = {
  __typename?: 'policies_attributes_aggregated_count';
  icon?: Maybe<Scalars['Int']['output']>;
  key?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Attributes_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Attributes_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Attributes_Filter>>>;
  icon?: InputMaybe<String_Filter_Operators>;
  key?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Policies_Attributes_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  type?: InputMaybe<String_Filter_Operators>;
};

export type Policies_Attributes_Mutated = {
  __typename?: 'policies_attributes_mutated';
  data?: Maybe<Policies_Attributes>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Attributes_Translations = {
  __typename?: 'policies_attributes_translations';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  policies_attributes_key?: Maybe<Policies_Attributes>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Policies_Attributes_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_Attributes_TranslationsPolicies_Attributes_KeyArgs = {
  filter?: InputMaybe<Policies_Attributes_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Attributes_Translations_Aggregated = {
  __typename?: 'policies_attributes_translations_aggregated';
  avg?: Maybe<Policies_Attributes_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Attributes_Translations_Aggregated_Fields>;
  count?: Maybe<Policies_Attributes_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Attributes_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Attributes_Translations_Aggregated_Fields>;
  min?: Maybe<Policies_Attributes_Translations_Aggregated_Fields>;
  sum?: Maybe<Policies_Attributes_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Attributes_Translations_Aggregated_Fields>;
};

export type Policies_Attributes_Translations_Aggregated_Count = {
  __typename?: 'policies_attributes_translations_aggregated_count';
  description?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  policies_attributes_key?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Attributes_Translations_Aggregated_Fields = {
  __typename?: 'policies_attributes_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Attributes_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Attributes_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Attributes_Translations_Filter>>>;
  description?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  policies_attributes_key?: InputMaybe<Policies_Attributes_Filter>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Policies_Attributes_Translations_Mutated = {
  __typename?: 'policies_attributes_translations_mutated';
  data?: Maybe<Policies_Attributes_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Filter>>>;
  attributes?: InputMaybe<Policies_Policies_Attributes_Filter>;
  attributes_func?: InputMaybe<Count_Function_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  rating?: InputMaybe<Number_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  stakeholders?: InputMaybe<Policies_Stakeholders_Filter>;
  stakeholders_func?: InputMaybe<Count_Function_Filter_Operators>;
  status?: InputMaybe<Policies_Status_Filter>;
  translations?: InputMaybe<Policies_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  updates?: InputMaybe<Policies_Updates_Filter>;
  updates_func?: InputMaybe<Count_Function_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Policies_Mutated = {
  __typename?: 'policies_mutated';
  data?: Maybe<Policies>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Policies_Attributes = {
  __typename?: 'policies_policies_attributes';
  id: Scalars['ID']['output'];
  policies_attributes_key?: Maybe<Policies_Attributes>;
  policies_id?: Maybe<Policies>;
};


export type Policies_Policies_AttributesPolicies_Attributes_KeyArgs = {
  filter?: InputMaybe<Policies_Attributes_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_Policies_AttributesPolicies_IdArgs = {
  filter?: InputMaybe<Policies_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Policies_Attributes_Aggregated = {
  __typename?: 'policies_policies_attributes_aggregated';
  avg?: Maybe<Policies_Policies_Attributes_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Policies_Attributes_Aggregated_Fields>;
  count?: Maybe<Policies_Policies_Attributes_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Policies_Attributes_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Policies_Attributes_Aggregated_Fields>;
  min?: Maybe<Policies_Policies_Attributes_Aggregated_Fields>;
  sum?: Maybe<Policies_Policies_Attributes_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Policies_Attributes_Aggregated_Fields>;
};

export type Policies_Policies_Attributes_Aggregated_Count = {
  __typename?: 'policies_policies_attributes_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  policies_attributes_key?: Maybe<Scalars['Int']['output']>;
  policies_id?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Policies_Attributes_Aggregated_Fields = {
  __typename?: 'policies_policies_attributes_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Policies_Attributes_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Policies_Attributes_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Policies_Attributes_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  policies_attributes_key?: InputMaybe<Policies_Attributes_Filter>;
  policies_id?: InputMaybe<Policies_Filter>;
};

export type Policies_Policies_Attributes_Mutated = {
  __typename?: 'policies_policies_attributes_mutated';
  data?: Maybe<Policies_Policies_Attributes>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Stakeholders = {
  __typename?: 'policies_stakeholders';
  id: Scalars['ID']['output'];
  policies_id?: Maybe<Policies>;
  stakeholders_id?: Maybe<Stakeholders>;
};


export type Policies_StakeholdersPolicies_IdArgs = {
  filter?: InputMaybe<Policies_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_StakeholdersStakeholders_IdArgs = {
  filter?: InputMaybe<Stakeholders_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Stakeholders_Aggregated = {
  __typename?: 'policies_stakeholders_aggregated';
  avg?: Maybe<Policies_Stakeholders_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Stakeholders_Aggregated_Fields>;
  count?: Maybe<Policies_Stakeholders_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Stakeholders_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Stakeholders_Aggregated_Fields>;
  min?: Maybe<Policies_Stakeholders_Aggregated_Fields>;
  sum?: Maybe<Policies_Stakeholders_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Stakeholders_Aggregated_Fields>;
};

export type Policies_Stakeholders_Aggregated_Count = {
  __typename?: 'policies_stakeholders_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  policies_id?: Maybe<Scalars['Int']['output']>;
  stakeholders_id?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Stakeholders_Aggregated_Fields = {
  __typename?: 'policies_stakeholders_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Stakeholders_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Stakeholders_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Stakeholders_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  policies_id?: InputMaybe<Policies_Filter>;
  stakeholders_id?: InputMaybe<Stakeholders_Filter>;
};

export type Policies_Stakeholders_Mutated = {
  __typename?: 'policies_stakeholders_mutated';
  data?: Maybe<Policies_Stakeholders>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Status = {
  __typename?: 'policies_status';
  color?: Maybe<Scalars['String']['output']>;
  colorText?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  key: Scalars['ID']['output'];
  sort?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Array<Maybe<Policies_Status_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
};


export type Policies_StatusTranslationsArgs = {
  filter?: InputMaybe<Policies_Status_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Status_Aggregated = {
  __typename?: 'policies_status_aggregated';
  avg?: Maybe<Policies_Status_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Status_Aggregated_Fields>;
  count?: Maybe<Policies_Status_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Status_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Status_Aggregated_Fields>;
  min?: Maybe<Policies_Status_Aggregated_Fields>;
  sum?: Maybe<Policies_Status_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Status_Aggregated_Fields>;
};

export type Policies_Status_Aggregated_Count = {
  __typename?: 'policies_status_aggregated_count';
  color?: Maybe<Scalars['Int']['output']>;
  colorText?: Maybe<Scalars['Int']['output']>;
  icon?: Maybe<Scalars['Int']['output']>;
  key?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Status_Aggregated_Fields = {
  __typename?: 'policies_status_aggregated_fields';
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Status_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Status_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Status_Filter>>>;
  color?: InputMaybe<String_Filter_Operators>;
  colorText?: InputMaybe<String_Filter_Operators>;
  icon?: InputMaybe<String_Filter_Operators>;
  key?: InputMaybe<String_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  translations?: InputMaybe<Policies_Status_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Policies_Status_Mutated = {
  __typename?: 'policies_status_mutated';
  data?: Maybe<Policies_Status>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Status_Translations = {
  __typename?: 'policies_status_translations';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  languages_code?: Maybe<Languages>;
  policies_status_key?: Maybe<Policies_Status>;
};


export type Policies_Status_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_Status_TranslationsPolicies_Status_KeyArgs = {
  filter?: InputMaybe<Policies_Status_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Status_Translations_Aggregated = {
  __typename?: 'policies_status_translations_aggregated';
  avg?: Maybe<Policies_Status_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Status_Translations_Aggregated_Fields>;
  count?: Maybe<Policies_Status_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Status_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Status_Translations_Aggregated_Fields>;
  min?: Maybe<Policies_Status_Translations_Aggregated_Fields>;
  sum?: Maybe<Policies_Status_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Status_Translations_Aggregated_Fields>;
};

export type Policies_Status_Translations_Aggregated_Count = {
  __typename?: 'policies_status_translations_aggregated_count';
  description?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  label?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  policies_status_key?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Status_Translations_Aggregated_Fields = {
  __typename?: 'policies_status_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Status_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Status_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Status_Translations_Filter>>>;
  description?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  label?: InputMaybe<String_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  policies_status_key?: InputMaybe<Policies_Status_Filter>;
};

export type Policies_Status_Translations_Mutated = {
  __typename?: 'policies_status_translations_mutated';
  data?: Maybe<Policies_Status_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Translations = {
  __typename?: 'policies_translations';
  citizenDemand?: Maybe<Scalars['String']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  governmentPlan?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  policies_id?: Maybe<Policies>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Policies_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_TranslationsPolicies_IdArgs = {
  filter?: InputMaybe<Policies_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Translations_Aggregated = {
  __typename?: 'policies_translations_aggregated';
  avg?: Maybe<Policies_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Translations_Aggregated_Fields>;
  count?: Maybe<Policies_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Translations_Aggregated_Fields>;
  min?: Maybe<Policies_Translations_Aggregated_Fields>;
  sum?: Maybe<Policies_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Translations_Aggregated_Fields>;
};

export type Policies_Translations_Aggregated_Count = {
  __typename?: 'policies_translations_aggregated_count';
  citizenDemand?: Maybe<Scalars['Int']['output']>;
  content?: Maybe<Scalars['Int']['output']>;
  governmentPlan?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  policies_id?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Translations_Aggregated_Fields = {
  __typename?: 'policies_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Translations_Filter>>>;
  citizenDemand?: InputMaybe<String_Filter_Operators>;
  content?: InputMaybe<String_Filter_Operators>;
  governmentPlan?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  policies_id?: InputMaybe<Policies_Filter>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Policies_Translations_Mutated = {
  __typename?: 'policies_translations_mutated';
  data?: Maybe<Policies_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Updates = {
  __typename?: 'policies_updates';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  policy?: Maybe<Policies>;
  translations?: Maybe<Array<Maybe<Policies_Updates_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
  user_updated?: Maybe<Directus_Users>;
};


export type Policies_UpdatesPolicyArgs = {
  filter?: InputMaybe<Policies_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_UpdatesTranslationsArgs = {
  filter?: InputMaybe<Policies_Updates_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_UpdatesUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Updates_Aggregated = {
  __typename?: 'policies_updates_aggregated';
  count?: Maybe<Policies_Updates_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Updates_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Policies_Updates_Aggregated_Count = {
  __typename?: 'policies_updates_aggregated_count';
  date?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  policy?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Updates_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Updates_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Updates_Filter>>>;
  date?: InputMaybe<Date_Filter_Operators>;
  date_func?: InputMaybe<Date_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  policy?: InputMaybe<Policies_Filter>;
  translations?: InputMaybe<Policies_Updates_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Policies_Updates_Mutated = {
  __typename?: 'policies_updates_mutated';
  data?: Maybe<Policies_Updates>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Policies_Updates_Translations = {
  __typename?: 'policies_updates_translations';
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  policies_updates_id?: Maybe<Policies_Updates>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Policies_Updates_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Policies_Updates_TranslationsPolicies_Updates_IdArgs = {
  filter?: InputMaybe<Policies_Updates_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Policies_Updates_Translations_Aggregated = {
  __typename?: 'policies_updates_translations_aggregated';
  avg?: Maybe<Policies_Updates_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Policies_Updates_Translations_Aggregated_Fields>;
  count?: Maybe<Policies_Updates_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Policies_Updates_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Policies_Updates_Translations_Aggregated_Fields>;
  min?: Maybe<Policies_Updates_Translations_Aggregated_Fields>;
  sum?: Maybe<Policies_Updates_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Policies_Updates_Translations_Aggregated_Fields>;
};

export type Policies_Updates_Translations_Aggregated_Count = {
  __typename?: 'policies_updates_translations_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  policies_updates_id?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Policies_Updates_Translations_Aggregated_Fields = {
  __typename?: 'policies_updates_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Policies_Updates_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Policies_Updates_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Policies_Updates_Translations_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  policies_updates_id?: InputMaybe<Policies_Updates_Filter>;
  text?: InputMaybe<String_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Policies_Updates_Translations_Mutated = {
  __typename?: 'policies_updates_translations_mutated';
  data?: Maybe<Policies_Updates_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Pv_Produktion = {
  __typename?: 'pv_produktion';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  PV?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  unit?: Maybe<Scalars['String']['output']>;
};


export type Pv_ProduktionCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Pv_Produktion_Aggregated = {
  __typename?: 'pv_produktion_aggregated';
  avg?: Maybe<Pv_Produktion_Aggregated_Fields>;
  avgDistinct?: Maybe<Pv_Produktion_Aggregated_Fields>;
  count?: Maybe<Pv_Produktion_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Pv_Produktion_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Pv_Produktion_Aggregated_Fields>;
  min?: Maybe<Pv_Produktion_Aggregated_Fields>;
  sum?: Maybe<Pv_Produktion_Aggregated_Fields>;
  sumDistinct?: Maybe<Pv_Produktion_Aggregated_Fields>;
};

export type Pv_Produktion_Aggregated_Count = {
  __typename?: 'pv_produktion_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  PV?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
};

export type Pv_Produktion_Aggregated_Fields = {
  __typename?: 'pv_produktion_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  PV?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Pv_Produktion_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  PV?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Pv_Produktion_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Pv_Produktion_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
  unit?: InputMaybe<String_Filter_Operators>;
};

export type Pv_Produktion_Mutated = {
  __typename?: 'pv_produktion_mutated';
  data?: Maybe<Pv_Produktion>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Pv_Zielpfad = {
  __typename?: 'pv_zielpfad';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};


export type Pv_ZielpfadCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Pv_Zielpfad_Aggregated = {
  __typename?: 'pv_zielpfad_aggregated';
  avg?: Maybe<Pv_Zielpfad_Aggregated_Fields>;
  avgDistinct?: Maybe<Pv_Zielpfad_Aggregated_Fields>;
  count?: Maybe<Pv_Zielpfad_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Pv_Zielpfad_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Pv_Zielpfad_Aggregated_Fields>;
  min?: Maybe<Pv_Zielpfad_Aggregated_Fields>;
  sum?: Maybe<Pv_Zielpfad_Aggregated_Fields>;
  sumDistinct?: Maybe<Pv_Zielpfad_Aggregated_Fields>;
};

export type Pv_Zielpfad_Aggregated_Count = {
  __typename?: 'pv_zielpfad_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Pv_Zielpfad_Aggregated_Fields = {
  __typename?: 'pv_zielpfad_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Pv_Zielpfad_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Date_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Pv_Zielpfad_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Pv_Zielpfad_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Pv_Zielpfad_Mutated = {
  __typename?: 'pv_zielpfad_mutated';
  data?: Maybe<Pv_Zielpfad>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Quiz_Answers = {
  __typename?: 'quiz_answers';
  answer_count?: Maybe<Scalars['Int']['output']>;
  answer_order?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  is_true?: Maybe<Scalars['Boolean']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  question_id?: Maybe<Quiz_Questions>;
  text?: Maybe<Scalars['String']['output']>;
};


export type Quiz_AnswersQuestion_IdArgs = {
  filter?: InputMaybe<Quiz_Questions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Quiz_Answers_Aggregated = {
  __typename?: 'quiz_answers_aggregated';
  avg?: Maybe<Quiz_Answers_Aggregated_Fields>;
  avgDistinct?: Maybe<Quiz_Answers_Aggregated_Fields>;
  count?: Maybe<Quiz_Answers_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Quiz_Answers_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Quiz_Answers_Aggregated_Fields>;
  min?: Maybe<Quiz_Answers_Aggregated_Fields>;
  sum?: Maybe<Quiz_Answers_Aggregated_Fields>;
  sumDistinct?: Maybe<Quiz_Answers_Aggregated_Fields>;
};

export type Quiz_Answers_Aggregated_Count = {
  __typename?: 'quiz_answers_aggregated_count';
  answer_count?: Maybe<Scalars['Int']['output']>;
  answer_order?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  is_true?: Maybe<Scalars['Int']['output']>;
  label?: Maybe<Scalars['Int']['output']>;
  question_id?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
};

export type Quiz_Answers_Aggregated_Fields = {
  __typename?: 'quiz_answers_aggregated_fields';
  answer_count?: Maybe<Scalars['Float']['output']>;
  answer_order?: Maybe<Scalars['Float']['output']>;
};

export type Quiz_Answers_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Quiz_Answers_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Quiz_Answers_Filter>>>;
  answer_count?: InputMaybe<Number_Filter_Operators>;
  answer_order?: InputMaybe<Number_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  is_true?: InputMaybe<Boolean_Filter_Operators>;
  label?: InputMaybe<String_Filter_Operators>;
  question_id?: InputMaybe<Quiz_Questions_Filter>;
  text?: InputMaybe<String_Filter_Operators>;
};

export type Quiz_Answers_Mutated = {
  __typename?: 'quiz_answers_mutated';
  data?: Maybe<Quiz_Answers>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Quiz_Questions = {
  __typename?: 'quiz_questions';
  answers?: Maybe<Array<Maybe<Quiz_Answers>>>;
  answers_func?: Maybe<Count_Functions>;
  countries?: Maybe<Scalars['JSON']['output']>;
  countries_func?: Maybe<Count_Functions>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  question?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  text_answer?: Maybe<Scalars['String']['output']>;
  text_question?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type Quiz_QuestionsAnswersArgs = {
  filter?: InputMaybe<Quiz_Answers_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Quiz_QuestionsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Quiz_QuestionsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Quiz_Questions_Aggregated = {
  __typename?: 'quiz_questions_aggregated';
  count?: Maybe<Quiz_Questions_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Quiz_Questions_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Quiz_Questions_Aggregated_Count = {
  __typename?: 'quiz_questions_aggregated_count';
  answers?: Maybe<Scalars['Int']['output']>;
  countries?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  question?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  text_answer?: Maybe<Scalars['Int']['output']>;
  text_question?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Quiz_Questions_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Quiz_Questions_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Quiz_Questions_Filter>>>;
  answers?: InputMaybe<Quiz_Answers_Filter>;
  answers_func?: InputMaybe<Count_Function_Filter_Operators>;
  countries?: InputMaybe<String_Filter_Operators>;
  countries_func?: InputMaybe<Count_Function_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  question?: InputMaybe<String_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  text_answer?: InputMaybe<String_Filter_Operators>;
  text_question?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Quiz_Questions_Mutated = {
  __typename?: 'quiz_questions_mutated';
  data?: Maybe<Quiz_Questions>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Quotes = {
  __typename?: 'quotes';
  author_image?: Maybe<Directus_Files>;
  author_image_copyright?: Maybe<Scalars['String']['output']>;
  author_name?: Maybe<Scalars['String']['output']>;
  author_role?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type QuotesAuthor_ImageArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuotesUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuotesUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Quotes_Aggregated = {
  __typename?: 'quotes_aggregated';
  avg?: Maybe<Quotes_Aggregated_Fields>;
  avgDistinct?: Maybe<Quotes_Aggregated_Fields>;
  count?: Maybe<Quotes_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Quotes_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Quotes_Aggregated_Fields>;
  min?: Maybe<Quotes_Aggregated_Fields>;
  sum?: Maybe<Quotes_Aggregated_Fields>;
  sumDistinct?: Maybe<Quotes_Aggregated_Fields>;
};

export type Quotes_Aggregated_Count = {
  __typename?: 'quotes_aggregated_count';
  author_image?: Maybe<Scalars['Int']['output']>;
  author_image_copyright?: Maybe<Scalars['Int']['output']>;
  author_name?: Maybe<Scalars['Int']['output']>;
  author_role?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Quotes_Aggregated_Fields = {
  __typename?: 'quotes_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Quotes_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Quotes_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Quotes_Filter>>>;
  author_image?: InputMaybe<Directus_Files_Filter>;
  author_image_copyright?: InputMaybe<String_Filter_Operators>;
  author_name?: InputMaybe<String_Filter_Operators>;
  author_role?: InputMaybe<String_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  text?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Quotes_Mutated = {
  __typename?: 'quotes_mutated';
  data?: Maybe<Quotes>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Regions = {
  __typename?: 'regions';
  area?: Maybe<Scalars['Int']['output']>;
  attributes?: Maybe<Scalars['JSON']['output']>;
  attributes_func?: Maybe<Count_Functions>;
  center?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  code?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Countries>;
  id: Scalars['ID']['output'];
  layer?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  name_short?: Maybe<Scalars['String']['output']>;
  nuts?: Maybe<Scalars['String']['output']>;
  outline?: Maybe<Scalars['JSON']['output']>;
  outline_func?: Maybe<Count_Functions>;
  outline_simple?: Maybe<Scalars['JSON']['output']>;
  outline_simple_func?: Maybe<Count_Functions>;
  population?: Maybe<Scalars['Int']['output']>;
  postcodes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};


export type RegionsCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Regions_Aggregated = {
  __typename?: 'regions_aggregated';
  avg?: Maybe<Regions_Aggregated_Fields>;
  avgDistinct?: Maybe<Regions_Aggregated_Fields>;
  count?: Maybe<Regions_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Regions_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Regions_Aggregated_Fields>;
  min?: Maybe<Regions_Aggregated_Fields>;
  sum?: Maybe<Regions_Aggregated_Fields>;
  sumDistinct?: Maybe<Regions_Aggregated_Fields>;
};

export type Regions_Aggregated_Count = {
  __typename?: 'regions_aggregated_count';
  area?: Maybe<Scalars['Int']['output']>;
  attributes?: Maybe<Scalars['Int']['output']>;
  center?: Maybe<Scalars['Int']['output']>;
  code?: Maybe<Scalars['Int']['output']>;
  country?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  layer?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['Int']['output']>;
  name_short?: Maybe<Scalars['Int']['output']>;
  nuts?: Maybe<Scalars['Int']['output']>;
  outline?: Maybe<Scalars['Int']['output']>;
  outline_simple?: Maybe<Scalars['Int']['output']>;
  population?: Maybe<Scalars['Int']['output']>;
  postcodes?: Maybe<Scalars['Int']['output']>;
};

export type Regions_Aggregated_Fields = {
  __typename?: 'regions_aggregated_fields';
  area?: Maybe<Scalars['Float']['output']>;
  population?: Maybe<Scalars['Float']['output']>;
};

export type Regions_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Regions_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Regions_Filter>>>;
  area?: InputMaybe<Number_Filter_Operators>;
  attributes?: InputMaybe<String_Filter_Operators>;
  attributes_func?: InputMaybe<Count_Function_Filter_Operators>;
  center?: InputMaybe<String_Filter_Operators>;
  code?: InputMaybe<String_Filter_Operators>;
  country?: InputMaybe<Countries_Filter>;
  id?: InputMaybe<String_Filter_Operators>;
  layer?: InputMaybe<String_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
  name_short?: InputMaybe<String_Filter_Operators>;
  nuts?: InputMaybe<String_Filter_Operators>;
  outline?: InputMaybe<String_Filter_Operators>;
  outline_func?: InputMaybe<Count_Function_Filter_Operators>;
  outline_simple?: InputMaybe<String_Filter_Operators>;
  outline_simple_func?: InputMaybe<Count_Function_Filter_Operators>;
  population?: InputMaybe<Number_Filter_Operators>;
  postcodes?: InputMaybe<String_Filter_Operators>;
};

export type Regions_Mutated = {
  __typename?: 'regions_mutated';
  data?: Maybe<Regions>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Renewable_Share_15min = {
  __typename?: 'renewable_share_15min';
  country?: Maybe<Countries>;
  id: Scalars['ID']['output'];
  share?: Maybe<Scalars['Float']['output']>;
  time?: Maybe<Scalars['Date']['output']>;
  time_func?: Maybe<Datetime_Functions>;
};


export type Renewable_Share_15minCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Renewable_Share_15min_Aggregated = {
  __typename?: 'renewable_share_15min_aggregated';
  avg?: Maybe<Renewable_Share_15min_Aggregated_Fields>;
  avgDistinct?: Maybe<Renewable_Share_15min_Aggregated_Fields>;
  count?: Maybe<Renewable_Share_15min_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Renewable_Share_15min_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Renewable_Share_15min_Aggregated_Fields>;
  min?: Maybe<Renewable_Share_15min_Aggregated_Fields>;
  sum?: Maybe<Renewable_Share_15min_Aggregated_Fields>;
  sumDistinct?: Maybe<Renewable_Share_15min_Aggregated_Fields>;
};

export type Renewable_Share_15min_Aggregated_Count = {
  __typename?: 'renewable_share_15min_aggregated_count';
  country?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  share?: Maybe<Scalars['Int']['output']>;
  time?: Maybe<Scalars['Int']['output']>;
};

export type Renewable_Share_15min_Aggregated_Fields = {
  __typename?: 'renewable_share_15min_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  share?: Maybe<Scalars['Float']['output']>;
};

export type Renewable_Share_15min_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Renewable_Share_15min_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Renewable_Share_15min_Filter>>>;
  country?: InputMaybe<Countries_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
  share?: InputMaybe<Number_Filter_Operators>;
  time?: InputMaybe<Date_Filter_Operators>;
  time_func?: InputMaybe<Datetime_Function_Filter_Operators>;
};

export type Renewable_Share_15min_Mutated = {
  __typename?: 'renewable_share_15min_mutated';
  data?: Maybe<Renewable_Share_15min>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Renewable_Share_Daily = {
  __typename?: 'renewable_share_daily';
  country?: Maybe<Countries>;
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  share?: Maybe<Scalars['Float']['output']>;
};


export type Renewable_Share_DailyCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Renewable_Share_Daily_Aggregated = {
  __typename?: 'renewable_share_daily_aggregated';
  avg?: Maybe<Renewable_Share_Daily_Aggregated_Fields>;
  avgDistinct?: Maybe<Renewable_Share_Daily_Aggregated_Fields>;
  count?: Maybe<Renewable_Share_Daily_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Renewable_Share_Daily_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Renewable_Share_Daily_Aggregated_Fields>;
  min?: Maybe<Renewable_Share_Daily_Aggregated_Fields>;
  sum?: Maybe<Renewable_Share_Daily_Aggregated_Fields>;
  sumDistinct?: Maybe<Renewable_Share_Daily_Aggregated_Fields>;
};

export type Renewable_Share_Daily_Aggregated_Count = {
  __typename?: 'renewable_share_daily_aggregated_count';
  country?: Maybe<Scalars['Int']['output']>;
  date?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  share?: Maybe<Scalars['Int']['output']>;
};

export type Renewable_Share_Daily_Aggregated_Fields = {
  __typename?: 'renewable_share_daily_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
  share?: Maybe<Scalars['Float']['output']>;
};

export type Renewable_Share_Daily_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Renewable_Share_Daily_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Renewable_Share_Daily_Filter>>>;
  country?: InputMaybe<Countries_Filter>;
  date?: InputMaybe<Date_Filter_Operators>;
  date_func?: InputMaybe<Date_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  share?: InputMaybe<Number_Filter_Operators>;
};

export type Renewable_Share_Daily_Mutated = {
  __typename?: 'renewable_share_daily_mutated';
  data?: Maybe<Renewable_Share_Daily>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Seo = {
  __typename?: 'seo';
  id: Scalars['ID']['output'];
  meta_description?: Maybe<Scalars['String']['output']>;
  og_image?: Maybe<Directus_Files>;
  title?: Maybe<Scalars['String']['output']>;
};


export type SeoOg_ImageArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Seo_Aggregated = {
  __typename?: 'seo_aggregated';
  count?: Maybe<Seo_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Seo_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Seo_Aggregated_Count = {
  __typename?: 'seo_aggregated_count';
  id?: Maybe<Scalars['Int']['output']>;
  meta_description?: Maybe<Scalars['Int']['output']>;
  og_image?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Seo_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Seo_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Seo_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  meta_description?: InputMaybe<String_Filter_Operators>;
  og_image?: InputMaybe<Directus_Files_Filter>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Seo_Mutated = {
  __typename?: 'seo_mutated';
  data?: Maybe<Seo>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Sites = {
  __typename?: 'sites';
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  translations?: Maybe<Array<Maybe<Sites_Translations>>>;
  translations_func?: Maybe<Count_Functions>;
};


export type SitesTranslationsArgs = {
  filter?: InputMaybe<Sites_Translations_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Sites_Aggregated = {
  __typename?: 'sites_aggregated';
  count?: Maybe<Sites_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Sites_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Sites_Aggregated_Count = {
  __typename?: 'sites_aggregated_count';
  domain?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['Int']['output']>;
};

export type Sites_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Sites_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Sites_Filter>>>;
  domain?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  translations?: InputMaybe<Sites_Translations_Filter>;
  translations_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Sites_Mutated = {
  __typename?: 'sites_mutated';
  data?: Maybe<Sites>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Sites_Translations = {
  __typename?: 'sites_translations';
  faq?: Maybe<Scalars['JSON']['output']>;
  faq_func?: Maybe<Count_Functions>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Languages>;
  navigation_primary?: Maybe<Scalars['JSON']['output']>;
  navigation_primary_func?: Maybe<Count_Functions>;
  navigation_secondary?: Maybe<Scalars['JSON']['output']>;
  navigation_secondary_func?: Maybe<Count_Functions>;
  popular_pages?: Maybe<Scalars['JSON']['output']>;
  popular_pages_func?: Maybe<Count_Functions>;
  region?: Maybe<Scalars['String']['output']>;
  seo?: Maybe<Seo>;
  sites_id?: Maybe<Sites>;
  title?: Maybe<Scalars['String']['output']>;
};


export type Sites_TranslationsLanguages_CodeArgs = {
  filter?: InputMaybe<Languages_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Sites_TranslationsSeoArgs = {
  filter?: InputMaybe<Seo_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Sites_TranslationsSites_IdArgs = {
  filter?: InputMaybe<Sites_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Sites_Translations_Aggregated = {
  __typename?: 'sites_translations_aggregated';
  avg?: Maybe<Sites_Translations_Aggregated_Fields>;
  avgDistinct?: Maybe<Sites_Translations_Aggregated_Fields>;
  count?: Maybe<Sites_Translations_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Sites_Translations_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Sites_Translations_Aggregated_Fields>;
  min?: Maybe<Sites_Translations_Aggregated_Fields>;
  sum?: Maybe<Sites_Translations_Aggregated_Fields>;
  sumDistinct?: Maybe<Sites_Translations_Aggregated_Fields>;
};

export type Sites_Translations_Aggregated_Count = {
  __typename?: 'sites_translations_aggregated_count';
  faq?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  languages_code?: Maybe<Scalars['Int']['output']>;
  navigation_primary?: Maybe<Scalars['Int']['output']>;
  navigation_secondary?: Maybe<Scalars['Int']['output']>;
  popular_pages?: Maybe<Scalars['Int']['output']>;
  region?: Maybe<Scalars['Int']['output']>;
  seo?: Maybe<Scalars['Int']['output']>;
  sites_id?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
};

export type Sites_Translations_Aggregated_Fields = {
  __typename?: 'sites_translations_aggregated_fields';
  id?: Maybe<Scalars['Float']['output']>;
};

export type Sites_Translations_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Sites_Translations_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Sites_Translations_Filter>>>;
  faq?: InputMaybe<String_Filter_Operators>;
  faq_func?: InputMaybe<Count_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  languages_code?: InputMaybe<Languages_Filter>;
  navigation_primary?: InputMaybe<String_Filter_Operators>;
  navigation_primary_func?: InputMaybe<Count_Function_Filter_Operators>;
  navigation_secondary?: InputMaybe<String_Filter_Operators>;
  navigation_secondary_func?: InputMaybe<Count_Function_Filter_Operators>;
  popular_pages?: InputMaybe<String_Filter_Operators>;
  popular_pages_func?: InputMaybe<Count_Function_Filter_Operators>;
  region?: InputMaybe<String_Filter_Operators>;
  seo?: InputMaybe<Seo_Filter>;
  sites_id?: InputMaybe<Sites_Filter>;
  title?: InputMaybe<String_Filter_Operators>;
};

export type Sites_Translations_Mutated = {
  __typename?: 'sites_translations_mutated';
  data?: Maybe<Sites_Translations>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Stakeholders = {
  __typename?: 'stakeholders';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  image?: Maybe<Directus_Files>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type StakeholdersImageArgs = {
  filter?: InputMaybe<Directus_Files_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type StakeholdersUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type StakeholdersUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Stakeholders_Aggregated = {
  __typename?: 'stakeholders_aggregated';
  count?: Maybe<Stakeholders_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Stakeholders_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
};

export type Stakeholders_Aggregated_Count = {
  __typename?: 'stakeholders_aggregated_count';
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  image?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Stakeholders_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Stakeholders_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Stakeholders_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  image?: InputMaybe<Directus_Files_Filter>;
  title?: InputMaybe<String_Filter_Operators>;
  type?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Stakeholders_Mutated = {
  __typename?: 'stakeholders_mutated';
  data?: Maybe<Stakeholders>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type String_Filter_Operators = {
  _contains?: InputMaybe<Scalars['String']['input']>;
  _empty?: InputMaybe<Scalars['Boolean']['input']>;
  _ends_with?: InputMaybe<Scalars['String']['input']>;
  _eq?: InputMaybe<Scalars['String']['input']>;
  _icontains?: InputMaybe<Scalars['String']['input']>;
  _iends_with?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _istarts_with?: InputMaybe<Scalars['String']['input']>;
  _ncontains?: InputMaybe<Scalars['String']['input']>;
  _nempty?: InputMaybe<Scalars['Boolean']['input']>;
  _nends_with?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  _niends_with?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _nistarts_with?: InputMaybe<Scalars['String']['input']>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _nstarts_with?: InputMaybe<Scalars['String']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
  _starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type Version_At_Geosphere_Data = {
  __typename?: 'version_at_geosphere_data';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  sh?: Maybe<Scalars['Float']['output']>;
  station?: Maybe<Scalars['JSON']['output']>;
  tl_mittel?: Maybe<Scalars['Float']['output']>;
  tlmax?: Maybe<Scalars['Float']['output']>;
  tlmin?: Maybe<Scalars['Float']['output']>;
};

export type Version_At_Geosphere_Stations = {
  __typename?: 'version_at_geosphere_stations';
  height?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  snow_coverage?: Maybe<Scalars['Float']['output']>;
  start?: Maybe<Scalars['Date']['output']>;
  start_func?: Maybe<Date_Functions>;
  state?: Maybe<Scalars['String']['output']>;
  station?: Maybe<Scalars['String']['output']>;
};

export type Version_Biomasse_Produktion = {
  __typename?: 'version_biomasse_produktion';
  Biomasse?: Maybe<Scalars['Float']['output']>;
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Biomasse_Zielpfad = {
  __typename?: 'version_biomasse_zielpfad';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Block_Chart = {
  __typename?: 'version_block_chart';
  charts?: Maybe<Scalars['JSON']['output']>;
  charts_func?: Maybe<Count_Functions>;
  hidewrapper?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Block_Chart_Charts = {
  __typename?: 'version_block_chart_charts';
  block?: Maybe<Scalars['JSON']['output']>;
  chart?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Block_Donation = {
  __typename?: 'version_block_donation';
  id: Scalars['ID']['output'];
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
};

export type Version_Block_Donation_Translations = {
  __typename?: 'version_block_donation_translations';
  block_donation_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  links?: Maybe<Scalars['JSON']['output']>;
  links_func?: Maybe<Count_Functions>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Block_Gallery = {
  __typename?: 'version_block_gallery';
  files?: Maybe<Scalars['JSON']['output']>;
  files_func?: Maybe<Count_Functions>;
  id: Scalars['ID']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Block_Gallery_Files = {
  __typename?: 'version_block_gallery_files';
  block_gallery_id?: Maybe<Scalars['JSON']['output']>;
  directus_files_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Block_Grid = {
  __typename?: 'version_block_grid';
  blocks?: Maybe<Scalars['JSON']['output']>;
  blocks_func?: Maybe<Count_Functions>;
  id: Scalars['ID']['output'];
};

export type Version_Block_Grid_Blocks = {
  __typename?: 'version_block_grid_blocks';
  block_grid_id?: Maybe<Scalars['JSON']['output']>;
  collection?: Maybe<Scalars['String']['output']>;
  height?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  item?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  width?: Maybe<Scalars['String']['output']>;
};

export type Version_Block_Items = {
  __typename?: 'version_block_items';
  id: Scalars['ID']['output'];
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  types?: Maybe<Scalars['JSON']['output']>;
  types_func?: Maybe<Count_Functions>;
};

export type Version_Block_Items_Translations = {
  __typename?: 'version_block_items_translations';
  block_items_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Block_News = {
  __typename?: 'version_block_news';
  id: Scalars['ID']['output'];
};

export type Version_Block_Panel = {
  __typename?: 'version_block_panel';
  chart?: Maybe<Scalars['JSON']['output']>;
  chart_custom?: Maybe<Scalars['String']['output']>;
  colorBackground?: Maybe<Scalars['String']['output']>;
  colorText?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  number?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  unit?: Maybe<Scalars['String']['output']>;
};

export type Version_Block_Panel_Translations = {
  __typename?: 'version_block_panel_translations';
  block_panel_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  list?: Maybe<Scalars['JSON']['output']>;
  list_func?: Maybe<Count_Functions>;
  source?: Maybe<Scalars['String']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Block_Quiz = {
  __typename?: 'version_block_quiz';
  id: Scalars['ID']['output'];
};

export type Version_Block_Quotes = {
  __typename?: 'version_block_quotes';
  id: Scalars['ID']['output'];
};

export type Version_Block_Richtext = {
  __typename?: 'version_block_richtext';
  id: Scalars['ID']['output'];
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
};

export type Version_Block_Richtext_Translations = {
  __typename?: 'version_block_richtext_translations';
  block_richtext_id?: Maybe<Scalars['JSON']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Block_Teaser = {
  __typename?: 'version_block_teaser';
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['JSON']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
};

export type Version_Block_Teaser_Translations = {
  __typename?: 'version_block_teaser_translations';
  block_teaser_id?: Maybe<Scalars['JSON']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  eyebrow?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  link?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Block_Toggle = {
  __typename?: 'version_block_toggle';
  id: Scalars['ID']['output'];
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
};

export type Version_Block_Toggle_Translations = {
  __typename?: 'version_block_toggle_translations';
  answer?: Maybe<Scalars['String']['output']>;
  block_toggle_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  question?: Maybe<Scalars['String']['output']>;
};

export type Version_Carbon_Prices = {
  __typename?: 'version_carbon_prices';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  region?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Version_Charts = {
  __typename?: 'version_charts';
  custom_sveltestring?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  id_old?: Maybe<Scalars['String']['output']>;
  layers?: Maybe<Scalars['JSON']['output']>;
  layers_func?: Maybe<Count_Functions>;
  options?: Maybe<Scalars['JSON']['output']>;
  options_func?: Maybe<Count_Functions>;
  site?: Maybe<Scalars['JSON']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  table_name?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  type?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
  x_axis?: Maybe<Scalars['String']['output']>;
  x_axis_name?: Maybe<Scalars['String']['output']>;
};

export type Version_Charts_Translations = {
  __typename?: 'version_charts_translations';
  charts_id?: Maybe<Scalars['JSON']['output']>;
  heading?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  methods?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  variables?: Maybe<Scalars['JSON']['output']>;
  variables_func?: Maybe<Count_Functions>;
};

export type Version_Companies = {
  __typename?: 'version_companies';
  climate_neutrality_goal?: Maybe<Scalars['String']['output']>;
  climate_neutrality_scopes?: Maybe<Scalars['JSON']['output']>;
  climate_neutrality_scopes_func?: Maybe<Count_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  intermediate_goal?: Maybe<Scalars['Boolean']['output']>;
  logo?: Maybe<Scalars['JSON']['output']>;
  member_sbt?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  sectors?: Maybe<Scalars['JSON']['output']>;
  sectors_func?: Maybe<Count_Functions>;
  status?: Maybe<Scalars['String']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Companies_Companies_Sectors = {
  __typename?: 'version_companies_companies_sectors';
  companies_id?: Maybe<Scalars['JSON']['output']>;
  companies_sectors_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Companies_Emissions = {
  __typename?: 'version_companies_emissions';
  category?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['Int']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  source_link?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['GraphQLBigInt']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Version_Companies_Sectors = {
  __typename?: 'version_companies_sectors';
  icon?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type Version_Countries = {
  __typename?: 'version_countries';
  area?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  name_de?: Maybe<Scalars['String']['output']>;
  population?: Maybe<Scalars['Int']['output']>;
};

export type Version_Datasets = {
  __typename?: 'version_datasets';
  id: Scalars['ID']['output'];
};

export type Version_De_Dwd_Data = {
  __typename?: 'version_de_dwd_data';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  sh?: Maybe<Scalars['Float']['output']>;
  station?: Maybe<Scalars['JSON']['output']>;
  tl_mittel?: Maybe<Scalars['Float']['output']>;
  tlmax?: Maybe<Scalars['Float']['output']>;
  tlmin?: Maybe<Scalars['Float']['output']>;
};

export type Version_De_Dwd_Stations = {
  __typename?: 'version_de_dwd_stations';
  date_start?: Maybe<Scalars['Date']['output']>;
  date_start_func?: Maybe<Date_Functions>;
  height?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  snow_coverage?: Maybe<Scalars['Float']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  station?: Maybe<Scalars['String']['output']>;
};

export type Version_Ee_Goals = {
  __typename?: 'version_ee_goals';
  Country?: Maybe<Scalars['JSON']['output']>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  current_production?: Maybe<Scalars['Float']['output']>;
  goal_amount?: Maybe<Scalars['String']['output']>;
  goal_year?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  last_update_check?: Maybe<Scalars['Date']['output']>;
  last_update_check_func?: Maybe<Date_Functions>;
  note?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['JSON']['output']>;
  source_label?: Maybe<Scalars['String']['output']>;
  source_link?: Maybe<Scalars['String']['output']>;
  source_year?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type Version_Ee_Historisch = {
  __typename?: 'version_ee_historisch';
  Country?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  pv?: Maybe<Scalars['Float']['output']>;
  region?: Maybe<Scalars['JSON']['output']>;
  wasserkraft?: Maybe<Scalars['Float']['output']>;
  windkraft?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Version_Ee_Potentiale = {
  __typename?: 'version_ee_potentiale';
  Country?: Maybe<Scalars['JSON']['output']>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  link?: Maybe<Scalars['String']['output']>;
  note?: Maybe<Scalars['String']['output']>;
  potential_class?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  region?: Maybe<Scalars['JSON']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  value_TWh?: Maybe<Scalars['Float']['output']>;
};

export type Version_Ee_Produktion = {
  __typename?: 'version_ee_produktion';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Version_Ee_Zielpfad = {
  __typename?: 'version_ee_zielpfad';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Type?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  id: Scalars['ID']['output'];
};

export type Version_Emissions = {
  __typename?: 'version_emissions';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  update?: Maybe<Scalars['Date']['output']>;
  update_func?: Maybe<Datetime_Functions>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Version_Energy = {
  __typename?: 'version_energy';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['String']['output']>;
  period_x?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  update?: Maybe<Scalars['Date']['output']>;
  update_func?: Maybe<Datetime_Functions>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Version_Energy_Renewable_Share = {
  __typename?: 'version_energy_renewable_share';
  category?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['Date']['output']>;
  period_func?: Maybe<Datetime_Functions>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Version_Erneuerbare_2030_Scenarios = {
  __typename?: 'version_erneuerbare_2030_scenarios';
  Country?: Maybe<Scalars['JSON']['output']>;
  energy_type?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  release_date?: Maybe<Scalars['Date']['output']>;
  release_date_func?: Maybe<Date_Functions>;
  scenario?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Version_Gas_Imports = {
  __typename?: 'version_gas_imports';
  Country?: Maybe<Scalars['JSON']['output']>;
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  import_country?: Maybe<Scalars['JSON']['output']>;
  /** alternative to "import_country". will be used if "import_country" is null. */
  import_source?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Version_Global_Co2_Concentration = {
  __typename?: 'version_global_co2_concentration';
  id: Scalars['ID']['output'];
  mean?: Maybe<Scalars['Float']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Version_Glossary = {
  __typename?: 'version_glossary';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  key?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Glossary_Translations = {
  __typename?: 'version_glossary_translations';
  glossary_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Languages = {
  __typename?: 'version_languages';
  code: Scalars['ID']['output'];
  direction?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type Version_Mobility = {
  __typename?: 'version_mobility';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  note?: Maybe<Scalars['String']['output']>;
  period?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type Version_Mobility_Cars = {
  __typename?: 'version_mobility_cars';
  category?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  period?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export type Version_News = {
  __typename?: 'version_news';
  author?: Maybe<Scalars['JSON']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  sites?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  slack_message_id?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
};

export type Version_News_Translations = {
  __typename?: 'version_news_translations';
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  news_id?: Maybe<Scalars['JSON']['output']>;
  text?: Maybe<Scalars['String']['output']>;
};

export type Version_Pages = {
  __typename?: 'version_pages';
  blocks?: Maybe<Scalars['JSON']['output']>;
  blocks_func?: Maybe<Count_Functions>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  site?: Maybe<Scalars['JSON']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Pages_Blocks = {
  __typename?: 'version_pages_blocks';
  collection?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  item?: Maybe<Scalars['String']['output']>;
  pages_id?: Maybe<Scalars['JSON']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
};

export type Version_Pages_Translations = {
  __typename?: 'version_pages_translations';
  description?: Maybe<Scalars['String']['output']>;
  heading?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  pages_id?: Maybe<Scalars['JSON']['output']>;
  seo?: Maybe<Scalars['JSON']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Pages_Translations_Blocks = {
  __typename?: 'version_pages_translations_blocks';
  collection?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  item?: Maybe<Scalars['String']['output']>;
  pages_translations_id?: Maybe<Scalars['JSON']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
};

export type Version_Policies = {
  __typename?: 'version_policies';
  attributes?: Maybe<Scalars['JSON']['output']>;
  attributes_func?: Maybe<Count_Functions>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  stakeholders?: Maybe<Scalars['JSON']['output']>;
  stakeholders_func?: Maybe<Count_Functions>;
  status?: Maybe<Scalars['JSON']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  updates?: Maybe<Scalars['JSON']['output']>;
  updates_func?: Maybe<Count_Functions>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Policies_Attributes = {
  __typename?: 'version_policies_attributes';
  icon?: Maybe<Scalars['String']['output']>;
  key: Scalars['ID']['output'];
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  type?: Maybe<Scalars['String']['output']>;
};

export type Version_Policies_Attributes_Translations = {
  __typename?: 'version_policies_attributes_translations';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  policies_attributes_key?: Maybe<Scalars['JSON']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Policies_Policies_Attributes = {
  __typename?: 'version_policies_policies_attributes';
  id: Scalars['ID']['output'];
  policies_attributes_key?: Maybe<Scalars['JSON']['output']>;
  policies_id?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Policies_Stakeholders = {
  __typename?: 'version_policies_stakeholders';
  id: Scalars['ID']['output'];
  policies_id?: Maybe<Scalars['JSON']['output']>;
  stakeholders_id?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Policies_Status = {
  __typename?: 'version_policies_status';
  color?: Maybe<Scalars['String']['output']>;
  colorText?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  key: Scalars['ID']['output'];
  sort?: Maybe<Scalars['Int']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
};

export type Version_Policies_Status_Translations = {
  __typename?: 'version_policies_status_translations';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  languages_code?: Maybe<Scalars['JSON']['output']>;
  policies_status_key?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Policies_Translations = {
  __typename?: 'version_policies_translations';
  citizenDemand?: Maybe<Scalars['String']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  governmentPlan?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  policies_id?: Maybe<Scalars['JSON']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Policies_Updates = {
  __typename?: 'version_policies_updates';
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  policy?: Maybe<Scalars['JSON']['output']>;
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Policies_Updates_Translations = {
  __typename?: 'version_policies_updates_translations';
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  policies_updates_id?: Maybe<Scalars['JSON']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Pv_Produktion = {
  __typename?: 'version_pv_produktion';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  PV?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  unit?: Maybe<Scalars['String']['output']>;
};

export type Version_Pv_Zielpfad = {
  __typename?: 'version_pv_zielpfad';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Quiz_Answers = {
  __typename?: 'version_quiz_answers';
  answer_count?: Maybe<Scalars['Int']['output']>;
  answer_order?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  is_true?: Maybe<Scalars['Boolean']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  question_id?: Maybe<Scalars['JSON']['output']>;
  text?: Maybe<Scalars['String']['output']>;
};

export type Version_Quiz_Questions = {
  __typename?: 'version_quiz_questions';
  answers?: Maybe<Scalars['JSON']['output']>;
  answers_func?: Maybe<Count_Functions>;
  countries?: Maybe<Scalars['JSON']['output']>;
  countries_func?: Maybe<Count_Functions>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  question?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  text_answer?: Maybe<Scalars['String']['output']>;
  text_question?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Quotes = {
  __typename?: 'version_quotes';
  author_image?: Maybe<Scalars['JSON']['output']>;
  author_image_copyright?: Maybe<Scalars['String']['output']>;
  author_name?: Maybe<Scalars['String']['output']>;
  author_role?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Regions = {
  __typename?: 'version_regions';
  area?: Maybe<Scalars['Int']['output']>;
  attributes?: Maybe<Scalars['JSON']['output']>;
  attributes_func?: Maybe<Count_Functions>;
  center?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  code?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  layer?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  name_short?: Maybe<Scalars['String']['output']>;
  nuts?: Maybe<Scalars['String']['output']>;
  outline?: Maybe<Scalars['JSON']['output']>;
  outline_func?: Maybe<Count_Functions>;
  outline_simple?: Maybe<Scalars['JSON']['output']>;
  outline_simple_func?: Maybe<Count_Functions>;
  population?: Maybe<Scalars['Int']['output']>;
  postcodes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type Version_Renewable_Share_15min = {
  __typename?: 'version_renewable_share_15min';
  country?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
  share?: Maybe<Scalars['Float']['output']>;
  time?: Maybe<Scalars['Date']['output']>;
  time_func?: Maybe<Datetime_Functions>;
};

export type Version_Renewable_Share_Daily = {
  __typename?: 'version_renewable_share_daily';
  country?: Maybe<Scalars['JSON']['output']>;
  date?: Maybe<Scalars['Date']['output']>;
  date_func?: Maybe<Date_Functions>;
  id: Scalars['ID']['output'];
  share?: Maybe<Scalars['Float']['output']>;
};

export type Version_Seo = {
  __typename?: 'version_seo';
  id: Scalars['ID']['output'];
  meta_description?: Maybe<Scalars['String']['output']>;
  og_image?: Maybe<Scalars['JSON']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Sites = {
  __typename?: 'version_sites';
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  translations?: Maybe<Scalars['JSON']['output']>;
  translations_func?: Maybe<Count_Functions>;
};

export type Version_Sites_Translations = {
  __typename?: 'version_sites_translations';
  faq?: Maybe<Scalars['JSON']['output']>;
  faq_func?: Maybe<Count_Functions>;
  id: Scalars['ID']['output'];
  languages_code?: Maybe<Scalars['JSON']['output']>;
  navigation_primary?: Maybe<Scalars['JSON']['output']>;
  navigation_primary_func?: Maybe<Count_Functions>;
  navigation_secondary?: Maybe<Scalars['JSON']['output']>;
  navigation_secondary_func?: Maybe<Count_Functions>;
  popular_pages?: Maybe<Scalars['JSON']['output']>;
  popular_pages_func?: Maybe<Count_Functions>;
  region?: Maybe<Scalars['String']['output']>;
  seo?: Maybe<Scalars['JSON']['output']>;
  sites_id?: Maybe<Scalars['JSON']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Version_Stakeholders = {
  __typename?: 'version_stakeholders';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['JSON']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Wasserkraft_Produktion = {
  __typename?: 'version_wasserkraft_produktion';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Wasserkraft?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Wasserkraft_Zielpfad = {
  __typename?: 'version_wasserkraft_zielpfad';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Windkraft_Produktion = {
  __typename?: 'version_windkraft_produktion';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Wind?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Windkraft_Zielpfad = {
  __typename?: 'version_windkraft_zielpfad';
  Country?: Maybe<Scalars['JSON']['output']>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};

export type Wasserkraft_Produktion = {
  __typename?: 'wasserkraft_produktion';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Wasserkraft?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};


export type Wasserkraft_ProduktionCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Wasserkraft_Produktion_Aggregated = {
  __typename?: 'wasserkraft_produktion_aggregated';
  avg?: Maybe<Wasserkraft_Produktion_Aggregated_Fields>;
  avgDistinct?: Maybe<Wasserkraft_Produktion_Aggregated_Fields>;
  count?: Maybe<Wasserkraft_Produktion_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Wasserkraft_Produktion_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Wasserkraft_Produktion_Aggregated_Fields>;
  min?: Maybe<Wasserkraft_Produktion_Aggregated_Fields>;
  sum?: Maybe<Wasserkraft_Produktion_Aggregated_Fields>;
  sumDistinct?: Maybe<Wasserkraft_Produktion_Aggregated_Fields>;
};

export type Wasserkraft_Produktion_Aggregated_Count = {
  __typename?: 'wasserkraft_produktion_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  Wasserkraft?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Wasserkraft_Produktion_Aggregated_Fields = {
  __typename?: 'wasserkraft_produktion_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Wasserkraft?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Wasserkraft_Produktion_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Date_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  Wasserkraft?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Wasserkraft_Produktion_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Wasserkraft_Produktion_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Wasserkraft_Produktion_Mutated = {
  __typename?: 'wasserkraft_produktion_mutated';
  data?: Maybe<Wasserkraft_Produktion>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Wasserkraft_Zielpfad = {
  __typename?: 'wasserkraft_zielpfad';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};


export type Wasserkraft_ZielpfadCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Wasserkraft_Zielpfad_Aggregated = {
  __typename?: 'wasserkraft_zielpfad_aggregated';
  avg?: Maybe<Wasserkraft_Zielpfad_Aggregated_Fields>;
  avgDistinct?: Maybe<Wasserkraft_Zielpfad_Aggregated_Fields>;
  count?: Maybe<Wasserkraft_Zielpfad_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Wasserkraft_Zielpfad_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Wasserkraft_Zielpfad_Aggregated_Fields>;
  min?: Maybe<Wasserkraft_Zielpfad_Aggregated_Fields>;
  sum?: Maybe<Wasserkraft_Zielpfad_Aggregated_Fields>;
  sumDistinct?: Maybe<Wasserkraft_Zielpfad_Aggregated_Fields>;
};

export type Wasserkraft_Zielpfad_Aggregated_Count = {
  __typename?: 'wasserkraft_zielpfad_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Wasserkraft_Zielpfad_Aggregated_Fields = {
  __typename?: 'wasserkraft_zielpfad_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Wasserkraft_Zielpfad_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Date_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Wasserkraft_Zielpfad_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Wasserkraft_Zielpfad_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Wasserkraft_Zielpfad_Mutated = {
  __typename?: 'wasserkraft_zielpfad_mutated';
  data?: Maybe<Wasserkraft_Zielpfad>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Windkraft_Produktion = {
  __typename?: 'windkraft_produktion';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Datetime_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Wind?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};


export type Windkraft_ProduktionCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Windkraft_Produktion_Aggregated = {
  __typename?: 'windkraft_produktion_aggregated';
  avg?: Maybe<Windkraft_Produktion_Aggregated_Fields>;
  avgDistinct?: Maybe<Windkraft_Produktion_Aggregated_Fields>;
  count?: Maybe<Windkraft_Produktion_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Windkraft_Produktion_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Windkraft_Produktion_Aggregated_Fields>;
  min?: Maybe<Windkraft_Produktion_Aggregated_Fields>;
  sum?: Maybe<Windkraft_Produktion_Aggregated_Fields>;
  sumDistinct?: Maybe<Windkraft_Produktion_Aggregated_Fields>;
};

export type Windkraft_Produktion_Aggregated_Count = {
  __typename?: 'windkraft_produktion_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  Wind?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Windkraft_Produktion_Aggregated_Fields = {
  __typename?: 'windkraft_produktion_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  Wind?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Windkraft_Produktion_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  Wind?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Windkraft_Produktion_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Windkraft_Produktion_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Windkraft_Produktion_Mutated = {
  __typename?: 'windkraft_produktion_mutated';
  data?: Maybe<Windkraft_Produktion>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Windkraft_Zielpfad = {
  __typename?: 'windkraft_zielpfad';
  Country?: Maybe<Countries>;
  DateTime?: Maybe<Scalars['Date']['output']>;
  DateTime_func?: Maybe<Date_Functions>;
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
};


export type Windkraft_ZielpfadCountryArgs = {
  filter?: InputMaybe<Countries_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Windkraft_Zielpfad_Aggregated = {
  __typename?: 'windkraft_zielpfad_aggregated';
  avg?: Maybe<Windkraft_Zielpfad_Aggregated_Fields>;
  avgDistinct?: Maybe<Windkraft_Zielpfad_Aggregated_Fields>;
  count?: Maybe<Windkraft_Zielpfad_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Windkraft_Zielpfad_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Windkraft_Zielpfad_Aggregated_Fields>;
  min?: Maybe<Windkraft_Zielpfad_Aggregated_Fields>;
  sum?: Maybe<Windkraft_Zielpfad_Aggregated_Fields>;
  sumDistinct?: Maybe<Windkraft_Zielpfad_Aggregated_Fields>;
};

export type Windkraft_Zielpfad_Aggregated_Count = {
  __typename?: 'windkraft_zielpfad_aggregated_count';
  Country?: Maybe<Scalars['Int']['output']>;
  DateTime?: Maybe<Scalars['Int']['output']>;
  Jahresproduktion?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Windkraft_Zielpfad_Aggregated_Fields = {
  __typename?: 'windkraft_zielpfad_aggregated_fields';
  Jahresproduktion?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Windkraft_Zielpfad_Filter = {
  Country?: InputMaybe<Countries_Filter>;
  DateTime?: InputMaybe<Date_Filter_Operators>;
  DateTime_func?: InputMaybe<Date_Function_Filter_Operators>;
  Jahresproduktion?: InputMaybe<Number_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Windkraft_Zielpfad_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Windkraft_Zielpfad_Filter>>>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Windkraft_Zielpfad_Mutated = {
  __typename?: 'windkraft_zielpfad_mutated';
  data?: Maybe<Windkraft_Zielpfad>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};
