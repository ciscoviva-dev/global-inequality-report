{{ config(materialized='view') }}

WITH raw_data AS (
    SELECT 
        country as country_code,
        variable as variable_code,
        percentile,
        CAST(year AS INTEGER) as year,
        CAST(value AS DOUBLE) as value,
        age,
        pop
    FROM read_csv_auto('C:/Users/Ben_C/Documents/Agent Development Kit/DBT/wid-all-data/WID_data_*.csv', sep=';', header=true, ALL_VARCHAR=true)
)

SELECT *
FROM raw_data
WHERE year >= 1820
  AND value IS NOT NULL
