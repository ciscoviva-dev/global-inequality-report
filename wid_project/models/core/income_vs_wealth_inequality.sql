{{ config(materialized='table') }}

with income as (
    select 
        year, 
        region, 
        country_code,
        percentile,
        value as income_share
    from {{ ref('fct_inequality_metrics') }}
    where category = 'Pre-tax national income'
      and percentile IN ('p99p100', 'p90p100', 'p0p50')
),

wealth as (
    select 
        year, 
        region, 
        country_code,
        percentile,
        value as wealth_share
    from {{ ref('fct_inequality_metrics') }}
    where category = 'Net personal wealth'
      and percentile IN ('p99p100', 'p90p100', 'p0p50')
),

comparison as (
    select
        i.year,
        i.region,
        i.country_code,
        i.percentile,
        i.income_share,
        w.wealth_share,
        (w.wealth_share - i.income_share) as inequality_gap,
        lag(i.income_share) over (partition by i.region, i.percentile order by i.year) as prev_income_share,
        lag(w.wealth_share) over (partition by i.region, i.percentile order by i.year) as prev_wealth_share
    from income i
    join wealth w on i.year = w.year and i.region = w.region and i.country_code = w.country_code and i.percentile = w.percentile
)

select 
    year,
    region,
    country_code,
    percentile,
    income_share,
    wealth_share,
    inequality_gap,
    (income_share - prev_income_share) as income_share_change,
    (wealth_share - prev_wealth_share) as wealth_share_change
from comparison
