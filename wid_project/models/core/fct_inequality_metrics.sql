{{ config(materialized='table') }}

WITH filtered_data AS (
    SELECT 
        country_code,
        variable_code,
        percentile,
        year,
        value,
        -- categorize based on variable code
        CASE 
            WHEN variable_code LIKE 'sptinc%' THEN 'Pre-tax national income'
            WHEN variable_code LIKE 'shweal%' THEN 'Net personal wealth'
            ELSE 'Other'
        END as category,
        FLOOR(year / 10) * 10 as decade
    FROM {{ ref('stg_wid_raw') }}
    WHERE (variable_code LIKE 'sptinc%' OR variable_code LIKE 'shweal%')
      AND age = '992' -- adults
      AND percentile IN ('p99p100', 'p90p100', 'p0p50')
),

joined_data AS (
    SELECT
        d.decade,
        c.country_name as region,
        c.country_code,
        c.region as continent,
        d.percentile,
        d.category,
        d.value
    FROM filtered_data d
    JOIN {{ ref('stg_wid_countries') }} c
      ON d.country_code = c.country_code
    WHERE c.country_name IS NOT NULL
)

SELECT
    decade as year,
    region,
    country_code,
    continent,
    percentile,
    category,
    AVG(value) as value
FROM joined_data
GROUP BY year, region, country_code, continent, percentile, category
