{{ config(materialized='table') }}

SELECT
    alpha2 as country_code,
    titlename as country_name,
    shortname,
    region,
    region2 as subregion
FROM read_csv_auto('C:/Users/Ben_C/Documents/Agent Development Kit/DBT/wid-all-data/WID_countries.csv', sep=';', header=true)
