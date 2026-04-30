with source as (
    select * from {{ ref('wid_data_clean') }}
),

renamed as (
    select
        percentile,
        year,
        variable_code,
        value
    from source
)

select * from renamed
